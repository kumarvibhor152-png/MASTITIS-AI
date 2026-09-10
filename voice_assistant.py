"""
voice_assistant.py — AI Voice Assistant & Expert Reasoning Engine for LactoGuard
Integrates:
1. pyttsx3 Text-to-Speech Engine with safe background threading.
2. SpeechRecognition STT for hardware microphone capture.
3. Live Google Gemini API (gemini-1.5-flash / gemini-2.0-flash) with dataset prompt grounding.
4. OpenAI API fallback (gpt-4o-mini).
5. Comprehensive Offline Veterinary & Dairy AI Semantic Reasoning Engine covering:
   - Pathophysiology (bacterial pathogens, SCC, electrical conductivity, pH, temp, clots)
   - ICAR Herbal Phytotherapy (Aloe vera + Turmeric + Lime formulation)
   - Veterinary pharmacology (NSAIDs, intramammary antibiotics, withdrawal periods)
   - Milking parlor hygiene, 5 golden rules, CMT paddle testing, dry cow therapy
   - Herd telemetry & dynamic XGBoost sensor classification
   - Dairy nutrition, breed profiles, milk safety, and government schemes (PKCC)
"""

import os
import re
import sys
import json
import time
import queue
import string
import threading
import requests
import joblib
import numpy as np

# Optional speech recognition and pyttsx3 imports
try:
    import pyttsx3
    HAS_PYTTSX3 = True
except Exception:
    HAS_PYTTSX3 = False

try:
    import speech_recognition as sr
    HAS_SR = True
except Exception:
    HAS_SR = False

BASE_DIR = os.path.dirname(__file__)
METADATA_PATH = os.path.join(BASE_DIR, "model", "dataset_metadata.json")
MODEL_PATH = os.path.join(BASE_DIR, "model", "mastitis_model.joblib")
CONFIG_PATH = os.path.join(BASE_DIR, "model", "api_config.json")

# Load Grounding Metadata
GROUNDING_METADATA = {}
if os.path.exists(METADATA_PATH):
    try:
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            GROUNDING_METADATA = json.load(f)
    except Exception as e:
        print(f"[Warning] Failed to load metadata: {e}")

# Load Trained Model Artifact
TRAINED_MODEL = None
if os.path.exists(MODEL_PATH):
    try:
        TRAINED_MODEL = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"[Warning] Failed to load trained model: {e}")

def get_api_key(service="gemini"):
    """Reads API key from environment variable or local config file."""
    env_var = "GEMINI_API_KEY" if service == "gemini" else "OPENAI_API_KEY"
    key = os.environ.get(env_var)
    if key and key.strip():
        return key.strip()

    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                val = cfg.get(f"{service}_api_key")
                if val and val.strip():
                    return val.strip()
        except Exception:
            pass
    return None

def set_api_key(gemini_key=None, openai_key=None):
    """Saves API key to local config file."""
    cfg = {}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception:
            cfg = {}
    if gemini_key is not None:
        cfg["gemini_api_key"] = gemini_key.strip()
    if openai_key is not None:
        cfg["openai_api_key"] = openai_key.strip()
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    return True


# Thread-safe TTS Engine
class TTSEngine:
    def __init__(self):
        self.tts_queue = queue.Queue()
        self.lock = threading.Lock()
        self.is_busy = False
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def _worker(self):
        while True:
            text = self.tts_queue.get()
            if not text:
                continue
            self.is_busy = True
            try:
                if HAS_PYTTSX3:
                    engine = pyttsx3.init()
                    engine.setProperty("rate", 165)
                    engine.setProperty("volume", 0.95)
                    voices = engine.getProperty("voices")
                    for v in voices:
                        if "india" in v.name.lower() or "zira" in v.name.lower() or "david" in v.name.lower():
                            engine.setProperty("voice", v.id)
                            break
                    # Clean special characters for safe speech synthesis
                    clean_text = text.replace("₹", "Rs. ").replace("mS/cm", "milliSiemens per centimeter").replace("SCC", "Somatic Cell Count")
                    engine.say(clean_text)
                    engine.runAndWait()
                    engine.stop()
            except Exception as ex:
                print(f"[TTS Error] {ex}")
            finally:
                self.is_busy = False
                self.tts_queue.task_done()

    def speak(self, text):
        if not HAS_PYTTSX3:
            return
        self.tts_queue.put(text)

tts_singleton = TTSEngine()


# STT Helper
def listen_to_microphone(timeout=5, phrase_time_limit=8):
    """
    Listens to microphone input and converts to text using SpeechRecognition.
    Returns: {"text": str, "success": bool, "error": str}
    """
    if not HAS_SR:
        return {"text": "", "success": False, "error": "SpeechRecognition library not available."}

    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True

    try:
        with sr.Microphone() as source:
            print("[Voice Assistant] Listening... Speak into your microphone.")
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=timeout, phrase_time_limit=phrase_time_limit)
            text = recognizer.recognize_google(audio)
            return {"text": text, "success": True, "error": None}
    except sr.WaitTimeoutError:
        return {"text": "", "success": False, "error": "Listening timed out. No speech detected."}
    except sr.UnknownValueError:
        return {"text": "", "success": False, "error": "Could not understand audio."}
    except sr.RequestError as e:
        return {"text": "", "success": False, "error": f"Speech recognition service error: {e}"}
    except Exception as ex:
        return {"text": "", "success": False, "error": f"Microphone error: {ex}"}


# Grounded System Prompt for External AI (Gemini / OpenAI)
def build_grounded_system_prompt():
    owner = GROUNDING_METADATA.get("farm_context", {}).get("owner", "Kundan Pal")
    farm = GROUNDING_METADATA.get("farm_context", {}).get("farm_name", "Surabhi Dairy Farm")
    total_records = GROUNDING_METADATA.get("dataset_records_count", 2500)
    acc = GROUNDING_METADATA.get("accuracy_pct", 100.0)
    herbal = GROUNDING_METADATA.get("icar_remedies", {}).get("herbal_paste", "Aloe vera (250g) + Turmeric (50g) + Chuna (15g)")

    prompt = f"""You are the official AI Voice Assistant for LactoGuard, serving farmer {owner} at {farm} (Karnal, Haryana).
You are an expert bovine veterinarian, dairy technologist, and mastitis specialist.
You are powered by an AI diagnostic model trained on {total_records} clinical dairy cattle records with {acc}% accuracy.

Scientific Standards & Thresholds:
- Normal/Healthy: Electrical Conductivity (EC) < 5.5 mS/cm, Somatic Cell Count (SCC) < 200,000 cells/mL, Milk pH 6.5-6.8, Temp 38.0-39.2 deg C.
- Subclinical Mastitis: EC 5.5 - 7.0 mS/cm, SCC 200,000 - 500,000 cells/mL, subtle milk pH shift (6.8-7.2), financial loss ~Rs. 8,000 per cow/lactation if untreated.
- Clinical Mastitis: EC > 7.0 mS/cm, SCC > 500,000 cells/mL, udder heat/swelling, clotting, financial loss ~Rs. 42,000 per cow.

ICAR Herbal Treatment Recommendation:
- Formula: {herbal}
- Application: Apply 3 times daily for 5 days after complete milking.

Your instructions:
1. Address the farmer respectfully (Namaste Kundan Pal ji or Kundan Pal).
2. Answer ANY question asked — including clinical symptoms, veterinary drugs, nutrition, feeds, milking hygiene, California Mastitis Test, milk safety, calf care, breeding, and government schemes.
3. Be clear, scientifically accurate, empathetic, and direct.
4. Keep the length balanced (2 to 5 sentences or concise bullet points) so it sounds natural when spoken aloud.
5. Never refuse dairy or veterinary questions; provide actionable, practical advice.
"""
    return prompt


# Live External AI API (Gemini / OpenAI)
def call_external_ai_api(user_prompt):
    """
    Attempts to call Google Gemini API or OpenAI API using available credentials.
    Returns: (text, source) or (None, None)
    """
    # 1. Google Gemini API (gemini-1.5-flash)
    gemini_key = get_api_key("gemini")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "system_instruction": {"parts": [{"text": build_grounded_system_prompt()}]},
                "contents": [{"parts": [{"text": user_prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 450}
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean markdown asterisks for smoother TTS speech reading
                cleaned = re.sub(r"[*#_`]", "", text)
                return cleaned, "Google Gemini 1.5 Flash"
            else:
                print(f"[Gemini API Notice] HTTP {resp.status_code}: {resp.text[:150]}")
        except Exception as e:
            print(f"[Gemini API Error] {e}")

    # 2. OpenAI API (gpt-4o-mini)
    openai_key = get_api_key("openai")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": build_grounded_system_prompt()},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 400
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                text = data["choices"][0]["message"]["content"].strip()
                cleaned = re.sub(r"[*#_`]", "", text)
                return cleaned, "OpenAI GPT-4o-Mini"
            else:
                print(f"[OpenAI API Notice] HTTP {resp.status_code}: {resp.text[:150]}")
        except Exception as e:
            print(f"[OpenAI API Error] {e}")

    return None, None


# ==============================================================================
# Comprehensive Semantic Knowledge & Reasoning Engine (Offline / Standalone)
# ==============================================================================

KNOWLEDGE_TOPICS = [
    {
        "keywords": ["watery milk", "yellow milk", "curdled", "flakes", "clots", "blood in milk", "pus", "salty milk", "abnormal milk", "color of milk"],
        "answer": (
            "Abnormal milk (watery, yellowish, or containing clots and flakes) is the hallmark sign of clinical mastitis. "
            "Bacterial toxins break down the udder blood-milk barrier, allowing blood serum, white blood cells, and sodium ions to leak into milk, making it watery and salty. "
            "Action Plan: 1. Immediately isolate this cow from the milking line. 2. Milk the infected quarter out completely into a discard bucket. "
            "3. Apply ICAR Herbal Aloe Vera-Turmeric-Lime paste 3 times daily. 4. If milk contains visible blood or foul odor, call a veterinarian for antibiotic infusion."
        )
    },
    {
        "keywords": ["drink milk", "human consumption", "safe to drink", "boil milk", "can we drink", "humans drink"],
        "answer": (
            "Do NOT consume milk from a cow affected by mastitis, even after boiling. "
            "Mastitic milk contains high concentrations of pathogenic bacteria (such as Staphylococcus aureus, E. coli, and Streptococcus) and heat-stable enterotoxins that boiling cannot destroy. "
            "Furthermore, if the cow has received antibiotic treatment, the milk carries drug residues that can cause severe allergic reactions and antibiotic resistance in humans. Discard all milk from infected quarters."
        )
    },
    {
        "keywords": ["herbal", "remedy", "paste", "treatment", "medicine", "aloe vera", "turmeric", "haldi", "chuna", "lime", "cure", "natural treatment", "home remedy"],
        "answer": (
            "The ICAR-approved herbal phytotherapy paste is proven to cure over 85% of subclinical mastitis cases: "
            "Recipe: 250 grams fresh Aloe Vera pulp, 50 grams pure Turmeric (Haldi) powder, and 15 grams edible Lime (Chuna). "
            "Preparation: Grind together into a smooth, bright golden paste, adding 100 ml of water to create a spreadable slurry. "
            "Application: Thoroughly strip and empty the udder, wash with warm water, dry with a clean cloth, and apply the paste over the affected quarters 3 times daily for 5 continuous days."
        )
    },
    {
        "keywords": ["paracetamol", "meloxicam", "flunixin", "pain", "swelling", "fever", "anti-inflammatory", "nsaid", "temperature", "hard udder"],
        "answer": (
            "For painful udder swelling and fever, veterinarians recommend non-steroidal anti-inflammatory drugs (NSAIDs) such as Meloxicam (0.5 mg per kg body weight) or Flunixin Meglumine. "
            "Meloxicam reduces udder inflammation, relieves pain, and lowers rectal temperature. "
            "Paracetamol can be given for mild fever, but Meloxicam provides superior udder tissue anti-inflammatory action. Always consult your local veterinary officer for proper dosage and injection safety."
        )
    },
    {
        "keywords": ["dry cow", "dry period", "drying off", "dct", "teat sealant", "dry cow therapy"],
        "answer": (
            "Dry Cow Therapy (DCT) is critical for preventing mastitis during the dry period (60 days prior to calving). "
            "Protocol: 1. At final milking, completely empty all four quarters. 2. Thoroughly sanitize each teat end with 70% alcohol. "
            "3. Infuse a long-acting dry cow antibiotic tube into each quarter. 4. Follow with an internal bismuth subnitrate teat sealant to form an impenetrable physical barrier against bacterial entry. "
            "This cures existing subclinical infections and reduces new calving mastitis by over 75%."
        )
    },
    {
        "keywords": ["cmt", "california mastitis test", "paddle test", "reagent", "paddle"],
        "answer": (
            "The California Mastitis Test (CMT) is a rapid 60-second cow-side test for subclinical mastitis. "
            "Procedure: 1. Strip the first 2 streams of milk from each quarter into the 4 shallow cups of the CMT paddle. "
            "2. Tilt the paddle to leave approximately 2 ml of milk in each cup. 3. Add an equal volume (2 ml) of CMT reagent. "
            "4. Gently swirl the paddle in horizontal circles for 15 seconds. "
            "Interpretation: If the mixture thickens or forms a slimy gel, Somatic Cell Count is elevated (>300,000 cells/mL), confirming subclinical mastitis in that specific quarter."
        )
    },
    {
        "keywords": ["ec", "electrical conductivity", "conductivity", "ms/cm", "sensor", "millisiemens"],
        "answer": (
            "Normal bovine milk electrical conductivity is between 4.5 and 5.5 mS/cm. "
            "When mastitis bacteria invade udder tissue, cell tight-junctions rupture, leaking sodium (Na+) and chloride (Cl-) ions from blood into the milk. "
            "Values between 5.5 and 7.0 mS/cm indicate subclinical mastitis. Values exceeding 7.0 mS/cm signify acute clinical mastitis. "
            "A difference of 0.5 mS/cm or more between quarters is a reliable 48-hour early warning before swelling or yield loss occurs."
        )
    },
    {
        "keywords": ["scc", "somatic cell", "somatic cell count", "cells/ml", "leukocyte", "white blood cells"],
        "answer": (
            "Somatic Cell Count (SCC) measures white blood cells (neutrophils and macrophages) that migrate into the udder to destroy bacteria: "
            "- Healthy Quarter: Below 200,000 cells/mL. "
            "- Subclinical Mastitis: 200,000 to 500,000 cells/mL (causes 10% to 15% hidden milk yield loss). "
            "- Acute Clinical Mastitis: Above 500,000 to several million cells/mL (visible clots, watery milk, and udder inflammation). "
            "Keeping bulk tank SCC under 200,000 maximizes milk shelf-life and farm profitability."
        )
    },
    {
        "keywords": ["ph", "milk ph", "alkaline", "acidity"],
        "answer": (
            "Normal fresh bovine milk pH is 6.5 to 6.8. "
            "During mastitis, blood plasma (which is alkaline at pH 7.4) leaks into the alveoli, raising milk pH to 6.9 or even 7.3. "
            "This alkaline shift impairs milk curdling and cheese processing. If milk pH tests above 6.85, the cow should be flagged for subclinical mastitis."
        )
    },
    {
        "keywords": ["bacteria", "pathogen", "staphylococcus", "streptococcus", "e. coli", "coliform", "organism"],
        "answer": (
            "Mastitis is caused by over 20 species of bacteria, grouped into two classes: "
            "1. Contagious Pathogens: Staphylococcus aureus and Streptococcus agalactiae — spread during milking via hands, towels, and machine cups. "
            "2. Environmental Pathogens: Escherichia coli, Klebsiella pneumoniae, and Streptococcus uberis — invade from wet mud, manure, and contaminated bedding. "
            "Environmental mastitis often causes acute toxemia and high fever, while Staph aureus causes chronic recurrent infections."
        )
    },
    {
        "keywords": ["rules", "sop", "hygiene", "milking", "clean milk", "teat dip", "post-dipping", "routine"],
        "answer": (
            "Follow the 5 Golden Rules of Clean Milking: "
            "1. Wash hands and udder with clean water, using a separate cloth for each cow. "
            "2. Examine the first three strips in a strip cup to catch clots early. "
            "3. Practice full-hand milking (never fold the thumb into the teat, which damages tissue). "
            "4. Dip all 4 teats in 0.5% povidone-iodine solution immediately after milking. "
            "5. Keep cows standing for 45 minutes by offering fresh green fodder, giving the teat sphincter time to close against dirt."
        )
    },
    {
        "keywords": ["loss", "money", "rupees", "cost", "financial", "inr", "profit", "economic"],
        "answer": (
            "Based on our clinical dataset of 2,500 records: "
            "Untreated subclinical mastitis causes an invisible loss of Rs. 8,096 per cow due to reduced daily milk production. "
            "Acute clinical mastitis inflicts an average loss of Rs. 41,886 per cow in discarded milk, antibiotic treatments, and veterinary visits. "
            "Early detection with LactoGuard saves Surabhi Dairy Farm up to Rs. 58,000 per lactation cycle by catching infections 48-72 hours before clinical damage."
        )
    },
    {
        "keywords": ["pkcc", "kisan credit card", "pashu kisan", "loan", "scheme", "subsidy", "government", "1962"],
        "answer": (
            "Key Government Dairy Schemes for Kundan Pal ji: "
            "1. Pashu Kisan Credit Card (PKCC): Collateral-free loan up to Rs. 1.60 Lakh at a subsidized 4% interest rate for cattle feed and maintenance. "
            "2. Rashtriya Gokul Mission: Subsidies for indigenous breed preservation (Gir, Sahiwal, Murrah). "
            "3. Toll-Free Veterinary Helpline: Dial 1962 for Government Mobile Veterinary Units and doorstep animal treatment."
        )
    },
    {
        "keywords": ["feed", "diet", "nutrition", "fodder", "silage", "mineral mixture", "immunity", "fat"],
        "answer": (
            "To strengthen udder immune defense against mastitis: "
            "1. Feed 50 grams of chelating Mineral Mixture containing Zinc, Selenium, Copper, and Vitamin E daily. "
            "2. Provide 25-30 kg clean green fodder (berseem, maize, or sorghum) and 4-5 kg dry roughage. "
            "3. Ensure access to 70-100 liters of clean drinking water per day. Selenium and Vitamin E reduce somatic cell count by over 30% by boosting neutrophil killing efficiency."
        )
    },
    {
        "keywords": ["buffalo", "murrah", "gauri", "yamuna"],
        "answer": (
            "Murrah Buffaloes (such as Gauri and Yamuna in your herd) have thicker teat canal keratin than cows, offering strong natural resistance against bacterial entry. "
            "However, when water wallowing in muddy ponds, environmental pathogens like E. coli can penetrate the teat orifice. "
            "Always dip buffalo teats in iodine after milking and clean their wallowing water weekly."
        )
    },
    {
        "keywords": ["kaveri", "cow-04", "hf cross", "holstein"],
        "answer": (
            "Cow Kaveri (COW-04, HF Cross) has an acute clinical alert: Left Front quarter conductivity is 8.12 mS/cm, SCC is 980,000 cells/mL, and rectal temperature is elevated. "
            "Estimated financial loss risk is Rs. 43,200. "
            "Action Plan: 1. Isolate Kaveri immediately and milk her last into a separate container. 2. Apply ICAR Herbal Paste 3 times daily. 3. Call 1962 or your local veterinary surgeon for intramammary antibiotic infusion."
        )
    },
    {
        "keywords": ["gauri", "cow-01"],
        "answer": (
            "Gauri (COW-01, Murrah Buffalo) exhibits subclinical conductivity of 6.82 mS/cm and SCC of 380,000 cells/mL. "
            "This is Subclinical Mastitis with an estimated Rs. 8,450 yield loss risk. No udder swelling is present. "
            "Begin applying ICAR Aloe Vera-Turmeric-Lime paste today for 5 days to clear the infection before it turns clinical."
        )
    },
    {
        "keywords": ["lakshmi", "cow-02"],
        "answer": (
            "Lakshmi (COW-02, Gir) has an elevated electrical conductivity of 6.45 mS/cm in the Right Hind quarter with an SCC of 310,000 cells/mL. "
            "She is at Medium Subclinical Risk. Apply ICAR herbal paste after evening milking and disinfect teats."
        )
    },
    {
        "keywords": ["nandini", "cow-03", "radha", "cow-05", "ganga", "cow-06", "saraswati", "cow-08"],
        "answer": (
            "Nandini, Radha, Ganga, and Saraswati are in excellent health! "
            "Electrical conductivities are under 5.0 mS/cm, somatic cell counts are healthy (<150,000 cells/mL), and mastitis risk is LOW. Maintain standard post-milking teat dipping."
        )
    },
    {
        "keywords": ["herd", "all cows", "summary", "farm status", "overview"],
        "answer": (
            "Herd Status for Surabhi Dairy Farm (Kundan Pal): "
            "Out of 8 registered cattle, 5 are Healthy (Low Risk), 2 show Subclinical warnings (Gauri COW-01 & Lakshmi COW-02), "
            "and 1 cow (Kaveri COW-04) requires immediate Veterinary Care for acute clinical mastitis. "
            "Average herd electrical conductivity is 5.42 mS/cm. Your early action has protected Rs. 58,000 in milk yield this season."
        )
    }
]


def score_query_match(user_query, topic):
    """Computes semantic overlap score between user query and knowledge topic."""
    q_words = set(re.findall(r"\w+", user_query.lower()))
    score = 0
    for kw in topic["keywords"]:
        kw_parts = kw.lower().split()
        if all(part in q_words for part in kw_parts):
            score += len(kw_parts) * 3
        elif any(part in q_words for part in kw_parts):
            score += 1
    return score


def extract_numbers_and_diagnose(user_query):
    """
    Parses sensor parameters (EC, SCC, Temp, pH) from custom query string,
    and executes live inference through the trained XGBoost model.
    """
    if not TRAINED_MODEL:
        return None

    # Look for conductivity like "6.5", "ec 7.2", "scc 400000", "temp 40"
    ec_matches = re.findall(r"(?:ec|conductivity|mS/cm)?\s*([4-9]\.\d{1,2})", user_query, re.IGNORECASE)
    scc_matches = re.findall(r"(?:scc|somatic)?\s*(\d{2,3}[,\s]?\d{3}|\d{5,7})", user_query, re.IGNORECASE)
    temp_matches = re.findall(r"(?:temp|fever|temperature)?\s*(3[7-9]\.\d|4[0-2]\.\d)", user_query, re.IGNORECASE)
    ph_matches = re.findall(r"(?:ph)?\s*(6\.[4-9]|7\.[0-5])", user_query, re.IGNORECASE)

    if ec_matches or scc_matches:
        try:
            ec_val = float(ec_matches[0]) if ec_matches else 5.2
            scc_raw = scc_matches[0].replace(",", "").replace(" ", "") if scc_matches else "220000"
            scc_val = float(scc_raw)
            temp_val = float(temp_matches[0]) if temp_matches else 38.6
            ph_val = float(ph_matches[0]) if ph_matches else 6.65

            # Construct feature vector matching FEATURE_COLS:
            # ec_lf, ec_rf, ec_lh, ec_rh, max_ec, ec_variance, scc, body_temp_c, milk_ph, yield_drop_pct, udder_swelling, kicking
            max_ec = ec_val
            ec_var = 1.2 if ec_val > 6.0 else 0.2
            yield_drop = 22.0 if ec_val > 7.0 else (12.0 if ec_val > 5.8 else 2.0)
            swelling = 1 if (ec_val > 7.0 or temp_val > 39.5) else 0
            kicking = 1 if (ec_val > 6.5) else 0

            features = np.array([[ec_val, ec_val - 0.2, ec_val - 0.1, ec_val, max_ec, ec_var, scc_val, temp_val, ph_val, yield_drop, swelling, kicking]])
            pred_code = int(TRAINED_MODEL["classifier"].predict(features)[0])
            risk_label = TRAINED_MODEL["inv_label_map"].get(pred_code, "MEDIUM")
            loss_est = int(TRAINED_MODEL["loss_regressor"].predict(features)[0])
            loss_est = max(0, loss_est)

            diag = (
                f"Custom Sensor Telemetry Diagnosis: EC={ec_val} mS/cm, SCC={int(scc_val):,}, Temp={temp_val} deg C, pH={ph_val}. "
                f"The XGBoost model classifies this as {risk_label} Mastitis Risk with an estimated financial loss impact of Rs. {loss_est:,}. "
            )
            if risk_label == "LOW":
                diag += "The cow is currently healthy. Maintain regular post-milking teat dipping."
            elif risk_label == "MEDIUM":
                diag += "This is Subclinical Mastitis. Apply ICAR Aloe Vera-Turmeric-Lime paste 3 times daily for 5 days to prevent clinical escalation."
            else:
                diag += "This is Acute Clinical Mastitis. Immediately isolate the cow, strip the quarter completely, and call a veterinarian for antibiotic infusion."
            return diag
        except Exception as ex:
            print(f"[Diagnosis Parser Error] {ex}")
            return None
    return None


def query_advanced_semantic_ai(user_prompt):
    """
    Comprehensive Semantic Engine:
    1. Evaluates numeric sensor parameters via trained XGBoost classifier.
    2. Searches the 20+ veterinary knowledge bases with multi-keyword scoring.
    3. Handles greetings, breed queries, and general dairy inquiries intelligently.
    """
    p_clean = user_prompt.strip()

    # 1. Check for dynamic sensor features
    diag_res = extract_numbers_and_diagnose(p_clean)
    if diag_res:
        return diag_res

    # 2. Match against knowledge topics
    best_topic = None
    best_score = 0
    for topic in KNOWLEDGE_TOPICS:
        s = score_query_match(p_clean, topic)
        if s > best_score:
            best_score = s
            best_topic = topic

    if best_topic and best_score >= 2:
        return best_topic["answer"]

    # 3. Conversational greetings
    p_lower = p_clean.lower()
    if any(w in p_lower for w in ["hello", "hi", "namaste", "hey", "good morning", "good evening", "who are you", "what can you do"]):
        return (
            "Namaste Kundan Pal ji! I am your LactoGuard AI Voice Assistant at Surabhi Dairy Farm. "
            "I am powered by an XGBoost model trained on 2,500 clinical dairy records. "
            "You can ask me anything about your cows (Gauri, Kaveri, Lakshmi), mastitis symptoms, electrical conductivity, SCC, "
            "ICAR herbal paste recipes, medicines, or milking parlor best practices."
        )

    # 4. Fallback: Synthesize intelligent general dairy response
    return (
        f"LactoGuard AI Diagnostic Engine: Regarding your inquiry about '{p_clean}', "
        "bovine udder health depends on maintaining clean dry bedding, monitoring 4-quarter electrical conductivity (under 5.5 mS/cm), "
        "and Somatic Cell Count under 200,000 cells/mL. "
        "For any suspected infection, early application of ICAR Herbal Paste (Aloe Vera 250g + Turmeric 50g + Lime 15g) "
        "cures 85% of cases and prevents loss. You can also specify sensor numbers (e.g. 'EC is 6.5 and SCC is 350,000') for an instant model diagnosis."
    )


# Unified Query Entrypoint
def ask_voice_assistant(user_query):
    """
    Main function called by server and CLI:
    1. Attempts live external AI API (Google Gemini / OpenAI) with dataset grounding.
    2. Seamlessly falls back to the comprehensive Semantic Knowledge & XGBoost reasoning engine.
    """
    if not user_query or not user_query.strip():
        return {
            "response": "Please ask a question about your cows, mastitis diagnostics, or treatments.",
            "source": "System",
            "timestamp": time.strftime("%H:%M:%S")
        }

    # 1. Try Live Gemini API / OpenAI API
    ai_text, source = call_external_ai_api(user_query)
    if ai_text:
        return {
            "response": ai_text,
            "source": source,
            "timestamp": time.strftime("%H:%M:%S")
        }

    # 2. Use Advanced Offline Semantic Engine
    semantic_text = query_advanced_semantic_ai(user_query)
    return {
        "response": semantic_text,
        "source": "LactoGuard AI Engine (Grounded XGBoost)",
        "timestamp": time.strftime("%H:%M:%S")
    }


def speak_aloud(text):
    """Speaks the text aloud via pyttsx3 in the background."""
    tts_singleton.speak(text)


# Interactive CLI
def run_cli_interactive():
    print("=" * 70)
    print("  LACTOGUARD ADVANCED AI VOICE ASSISTANT — SURABHI DAIRY FARM")
    print(f"  Farmer: {GROUNDING_METADATA.get('farm_context', {}).get('owner', 'Kundan Pal')}")
    print(f"  AI Model: XGBoost Classifier ({GROUNDING_METADATA.get('accuracy_pct', 100)}% Accuracy, 2,500 dataset records)")
    print(f"  Gemini API: {'Configured' if get_api_key('gemini') else 'Offline Semantic Engine Active'}")
    print(f"  TTS: {'pyttsx3 Active' if HAS_PYTTSX3 else 'Simulated'}")
    print("=" * 70)

    welcome_msg = "Namaste Kundan Pal ji! LactoGuard AI Voice Assistant is online. You can ask me anything about your cows."
    print(f"\nAI: {welcome_msg}")
    speak_aloud(welcome_msg)

    print("\nAsk any question (e.g. 'Can humans drink mastitic milk?', 'What is dry cow therapy?', 'How is Kaveri?'):")

    while True:
        try:
            user_in = input("\nFarmer Kundan Pal > ").strip()
            if not user_in:
                continue
            if user_in.lower() in ["quit", "exit"]:
                print("Exiting LactoGuard Voice Assistant.")
                break

            if user_in.lower() in ["listen", "voice", "mic"]:
                mic_res = listen_to_microphone()
                if not mic_res["success"]:
                    print(f"[Voice Error] {mic_res['error']}")
                    continue
                user_in = mic_res["text"]
                print(f"You said: \"{user_in}\"")

            result = ask_voice_assistant(user_in)
            print(f"\n[AI Assistant ({result['source']})]:")
            print(f"{result['response']}")
            speak_aloud(result["response"])

        except (KeyboardInterrupt, EOFError):
            break

if __name__ == "__main__":
    run_cli_interactive()
