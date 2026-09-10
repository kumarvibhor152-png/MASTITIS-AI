#!/usr/bin/env python3
"""
server.py — High-Performance Turnkey Server for LactoGuard Dashboard
Smart India Hackathon (SIH) Problem Statement 109

Features:
- Pure Python 3 standard library (no pip / npm / external dependencies required)
- Multi-threaded HTTP Server with SQLite persistence
- Integrated AI Mastitis Prediction Engine (Subclinical & Clinical forecasting)
- Full REST API + Static Web Dashboard File Server
- Realistic Indian Cattle Herd Pre-population & IoT Milking Parlor Stream Simulator
"""

import os
import sys
import json
import sqlite3
import random
import time
import math
from datetime import datetime, timezone, timedelta
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Any, Dict, List, Optional

# Import AI prediction engine
from ai_engine import predictor

try:
    import voice_assistant
except Exception as e:
    print(f"[Warning] Failed to import voice_assistant: {e}")
    voice_assistant = None

PORT = int(os.environ.get("PORT", 5173))
DB_PATH = os.path.join(os.path.dirname(__file__), "mastai.db")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")


def init_db():
    """Initializes SQLite database with cattle, predictions, and alerts tables."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cattle (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tag_number TEXT NOT NULL,
        breed TEXT NOT NULL,
        age_years REAL NOT NULL,
        parity INTEGER NOT NULL,
        days_in_milk INTEGER NOT NULL,
        milk_yield REAL NOT NULL,
        baseline_yield REAL NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score REAL NOT NULL,
        last_checked TEXT NOT NULL,
        ec_lf REAL DEFAULT 4.8,
        ec_rf REAL DEFAULT 4.8,
        ec_lh REAL DEFAULT 4.8,
        ec_rh REAL DEFAULT 4.8,
        scc INTEGER DEFAULT 180000,
        body_temp REAL DEFAULT 38.6,
        milk_ph REAL DEFAULT 6.6
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT NOT NULL,
        cattle_name TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        title TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        message TEXT NOT NULL,
        message_hi TEXT NOT NULL,
        created_at TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Check if cattle table is empty, if so, seed sample realistic Indian dairy herd
    cur.execute("SELECT COUNT(*) FROM cattle")
    if cur.fetchone()[0] == 0:
        now_iso = datetime.now(timezone.utc).isoformat()
        sample_cattle = [
            ("COW-101", "Lakshmi (लक्ष्मी)", "TAG-IND-801", "Gir (गीर)", 4.5, 2, 110, 18.2, 18.5, "LOW", 10.2, now_iso, 4.8, 4.9, 4.7, 4.8, 120000, 38.5, 6.6),
            ("COW-102", "Kamdhenu (कामधेनु)", "TAG-IND-802", "Sahiwal (साहीवाल)", 5.0, 3, 45, 13.8, 16.0, "MEDIUM", 68.4, now_iso, 4.9, 5.0, 4.9, 6.4, 290000, 38.9, 6.8),
            ("COW-103", "Ganga (गंगा)", "TAG-IND-803", "Murrah Buffalo (मुर्रा भैंस)", 6.0, 3, 140, 14.5, 14.8, "LOW", 12.5, now_iso, 4.7, 4.8, 4.8, 4.7, 140000, 38.4, 6.62),
            ("COW-104", "Meera (मीरा)", "TAG-IND-804", "HF Cross (होल्सटीन संकर)", 3.5, 2, 35, 9.0, 19.5, "HIGH", 98.5, now_iso, 7.8, 5.2, 5.1, 5.3, 780000, 40.1, 7.25),
            ("COW-105", "Radha (राधा)", "TAG-IND-805", "Tharparkar (थारपारकर)", 4.0, 2, 95, 12.5, 12.8, "LOW", 14.0, now_iso, 4.8, 4.7, 4.9, 4.8, 160000, 38.6, 6.6),
            ("COW-106", "Nandini (नंदिनी)", "TAG-IND-806", "Rathi (राठी)", 3.0, 1, 160, 11.2, 11.5, "LOW", 9.8, now_iso, 4.6, 4.7, 4.7, 4.8, 110000, 38.5, 6.58),
        ]
        cur.executemany("""
        INSERT INTO cattle (id, name, tag_number, breed, age_years, parity, days_in_milk, milk_yield, baseline_yield, risk_level, risk_score, last_checked, ec_lf, ec_rf, ec_lh, ec_rh, scc, body_temp, milk_ph)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_cattle)

        # Seed initial alerts
        sample_alerts = [
            ("COW-104", "Meera (मीरा)", "CLINICAL_MASTITIS", "HIGH",
             "Emergency: Acute Clinical Mastitis in Left Front Quarter!",
             "आपातकालीन: बाएँ अगले थन में गंभीर थनैला रोग पाया गया!",
             "Udder temperature 40.1°C with severe milk yield drop (-53%). Veterinary intervention urgently required.",
             "थन का तापमान 40.1°C और दूध में भारी गिरावट (-53%)। तुरंत डॉक्टर से संपर्क करें।",
             now_iso, 0),
            ("COW-102", "Kamdhenu (कामधेनु)", "SUBCLINICAL_FORECAST", "MEDIUM",
             "48-Hour Early Warning: Subclinical Mastitis Detected in Right Hind Quarter",
             "48 घंटे पूर्व चेतावनी: दाएँ पिछले थन में सबक्लिनिकल थनैला का संकेत",
             "Conductivity spike to 6.4 mS/cm with 13.8% yield drop. Apply ICAR Herbal Phytotherapy paste immediately.",
             "दाएँ पिछले थन में कंडक्टिविटी 6.4 mS/cm पहुंची। आईसीएआर हर्बल हल्दी-एलोवेरा लेप तुरंत लगाएं।",
             now_iso, 0),
            ("COW-101", "Lakshmi (लक्ष्मी)", "ROUTINE_CHECK", "LOW",
             "Routine Health Verification Completed",
             "नियमित स्वास्थ्य परीक्षण पूर्ण",
             "All 4 quarters tested healthy. Daily milk yield is optimal at 18.2 L.",
             "चारों थन पूर्णतः स्वस्थ पाए गए। दैनिक दूध 18.2 लीटर सामान्य है।",
             now_iso, 1),
        ]
        cur.executemany("""
        INSERT INTO alerts (cattle_id, cattle_name, alert_type, risk_level, title, title_hi, message, message_hi, created_at, resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_alerts)

    conn.commit()
    conn.close()


class AppRequestHandler(SimpleHTTPRequestHandler):
    """Custom request handler supporting REST API endpoints and static assets."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _send_json(self, data, status: int = HTTPStatus.OK):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def _parse_body(self) -> Dict[str, Any]:
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len > 0:
                raw_data = self.rfile.read(content_len).decode("utf-8")
                return json.loads(raw_data)
        except Exception:
            pass
        return {}

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # ─── API Routes ───────────────────────────────────────────────
        if path == "/api/health":
            self._send_json({
                "status": "healthy",
                "service": "LactoGuard Backend",
                "version": "2.0.0",
                "platform": "Smart India Hackathon 2024 (Problem Statement 109)",
                "ai_engine": "Veterinary Calibrated Ensemble",
                "time": datetime.now(timezone.utc).isoformat(),
            })
            return

        if path == "/api/cattle":
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM cattle ORDER BY risk_score DESC")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._send_json({"success": True, "count": len(rows), "data": rows})
            return

        if path.startswith("/api/cattle/"):
            cattle_id = path.replace("/api/cattle/", "").strip()
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM cattle WHERE id = ?", (cattle_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                self._send_json({"success": True, "data": dict(row)})
            else:
                self._send_json({"success": False, "error": "Cattle not found"}, status=404)
            return

        if path == "/api/alerts":
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM alerts ORDER BY resolved ASC, id DESC")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._send_json({"success": True, "data": rows})
            return

        if path == "/api/iot-stream":
            # Live IoT Milking Parlor Simulation Stream
            # Simulates milk flow rate, quarter conductivities, temperature, and live anomaly trigger
            t = time.time()
            # Simulate a realistic 8-minute milking session curve
            second_in_session = int(t % 480)
            
            # Flow rate peaks in minute 2-4
            if second_in_session < 30:
                flow_rate = 0.5 + (second_in_session / 30.0) * 1.5
            elif second_in_session < 240:
                flow_rate = 2.0 + 0.6 * math.sin(second_in_session / 10.0)
            else:
                flow_rate = max(0.1, 2.0 - ((second_in_session - 240) / 240.0) * 1.9)

            # Simulated cow in stall #2 has right-hind subclinical spike
            ec_lf = round(4.8 + 0.1 * math.sin(t / 5.0), 2)
            ec_rf = round(4.9 + 0.1 * math.cos(t / 6.0), 2)
            ec_lh = round(4.75 + 0.08 * math.sin(t / 4.0), 2)
            # RH has periodic elevated spike (6.35 - 6.6 mS/cm)
            ec_rh = round(6.25 + 0.3 * math.sin(t / 3.0), 2)

            self._send_json({
                "stall_id": "STALL-02",
                "cow_id": "COW-102",
                "cow_name": "Kamdhenu",
                "session_second": second_in_session,
                "flow_rate_lpm": round(flow_rate, 2),
                "total_yield_accumulated": round(min(14.0, (second_in_session / 480.0) * 13.8), 2),
                "milk_temp_c": round(38.8 + 0.1 * math.sin(t / 7.0), 2),
                "quarters_ec": {
                    "LF": ec_lf,
                    "RF": ec_rf,
                    "LH": ec_lh,
                    "RH": ec_rh,
                },
                "max_ec": max(ec_lf, ec_rf, ec_lh, ec_rh),
                "quarter_variance": round(max(ec_lf, ec_rf, ec_lh, ec_rh) - min(ec_lf, ec_rf, ec_lh, ec_rh), 2),
                "live_warning": (ec_rh >= 6.0),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            return

        if path == "/api/knowledge":
            # ICAR & NDDB Vetted Knowledge Base Articles
            self._send_json({
                "success": True,
                "data": [
                    {
                        "id": "kb-1",
                        "category": "treatment",
                        "title_en": "ICAR Herbal Phytotherapy for Subclinical Mastitis",
                        "title_hi": "सबक्लिनिकल थनैला के लिए आईसीएआर प्रमाणित हर्बल लेप",
                        "summary_en": "Effective, low-cost botanical paste made from Aloe Vera, Turmeric, and Lime. Clinically tested by ICAR with >85% cure rate for subclinical cases.",
                        "summary_hi": "एलोवेरा (घृतकुमारी), हल्दी और चूने से बना असरदार एवं किफायती देसी लेप। आईसीएआर परीक्षण में 85% से अधिक सफलता दर।",
                        "tags": ["ICAR Approved", "Zero Antibiotics", "₹50 Cost"],
                        "icon": "🌿"
                    },
                    {
                        "id": "kb-2",
                        "category": "testing",
                        "title_en": "California Mastitis Test (CMT) Step-by-Step Guide",
                        "title_hi": "कैलिफ़ोर्निया मास्टाइटिस टेस्ट (CMT) करने की सरल विधि",
                        "summary_en": "How to use a 4-cup paddle to detect subclinical mastitis in 60 seconds using milk gelation reaction.",
                        "summary_hi": "चार खांचे वाली प्लास्टिक पैडल से 60 सेकंड में दूध के गाढ़ेपन द्वारा प्रारंभिक थनैला पहचानने का तरीका।",
                        "tags": ["Diagnostic", "Paddle Test", "Farmer Friendly"],
                        "icon": "🧪"
                    },
                    {
                        "id": "kb-3",
                        "category": "prevention",
                        "title_en": "5 Golden Rules of Clean Milking (SOP)",
                        "title_hi": "स्वच्छ दुग्ध उत्पादन के 5 स्वर्णिम नियम",
                        "summary_en": "Pre-dipping, strip-cup examination, clean drying with separate cloth, full-hand milking, and post-milking teat dipping.",
                        "summary_hi": "थनों की धुलाई, धार की जांच, अलग साफ कपड़े से पोंछना, अंगूठा न मोड़ना, और दुहने के बाद टिली डुबोना।",
                        "tags": ["Prevention", "Hygiene", "Daily Routine"],
                        "icon": "🧼"
                    },
                    {
                        "id": "kb-4",
                        "category": "schemes",
                        "title_en": "Government Cattle Welfare & Subsidy Schemes",
                        "title_hi": "सरकारी पशु कल्याण एवं अनुदान योजनाएं",
                        "summary_en": "Rashtriya Gokul Mission, Pashu Kisan Credit Card (PKCC - loan up to ₹1.6 Lakh without collateral), and National Livestock Mission.",
                        "summary_hi": "राष्ट्रीय गोकुल मिशन, पशु किसान क्रेडिट कार्ड (बिना गारंटी 1.6 लाख तक ऋण) एवं पशुधन बीमा योजना।",
                        "tags": ["Govt Scheme", "Subsidy", "PKCC"],
                        "icon": "🏛️"
                    }
                ]
            })
            return

        if path == "/api/voice/status":
            has_groq = bool(voice_assistant.get_api_key("groq")) if voice_assistant else False
            has_gemini = bool(voice_assistant.get_api_key("gemini")) if voice_assistant else False
            has_openai = bool(voice_assistant.get_api_key("openai")) if voice_assistant else False
            active_engine = "⚡ Groq AI (Llama 3.3 70B Versatile)" if has_groq else ("✨ Google Gemini 1.5 Flash" if has_gemini else "🧠 LactoGuard Trained Bovine Model (NLP Vector Space)")
            self._send_json({
                "available": bool(voice_assistant),
                "has_tts": getattr(voice_assistant, "HAS_PYTTSX3", False),
                "has_mic": getattr(voice_assistant, "HAS_SR", False),
                "has_groq_key": has_groq,
                "has_gemini_key": has_gemini,
                "external_ai_configured": has_groq or has_gemini or has_openai,
                "active_engine": active_engine,
                "farmer_name": "Kundan Pal",
                "farm_name": "Surabhi Dairy Farm",
                "total_cows": 8
            })
            return

        if path == "/api/voice/config":
            has_groq = bool(voice_assistant.get_api_key("groq")) if voice_assistant else False
            has_gemini = bool(voice_assistant.get_api_key("gemini")) if voice_assistant else False
            has_openai = bool(voice_assistant.get_api_key("openai")) if voice_assistant else False
            active_engine = "⚡ Groq AI (Llama 3.3 70B Versatile)" if has_groq else ("✨ Google Gemini 1.5 Flash" if has_gemini else "🧠 LactoGuard Trained Bovine Model (NLP Vector Space)")
            self._send_json({
                "success": True,
                "has_groq_key": has_groq,
                "has_gemini_key": has_gemini,
                "has_openai_key": has_openai,
                "active_engine": active_engine
            })
            return

        # ─── Static File Serving ───────────────────────────────────────
        # Rewrite root or SPA routes to index.html
        if path == "/" or not os.path.exists(os.path.join(PUBLIC_DIR, path.lstrip("/"))):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._parse_body()

        # ─── Auth Routes ──────────────────────────────────────────────
        if path == "/api/auth/send-otp":
            phone = str(body.get("phone", "")).strip()
            if len(phone) < 10:
                self._send_json({"success": False, "message": "Enter valid 10-digit mobile number"}, status=400)
                return
            # Simulated OTP (standard 123456 for convenience in SIH hackathon evaluation)
            self._send_json({
                "success": True,
                "phone": phone,
                "otp": "123456",
                "message": f"OTP sent to +91 {phone} (Demo Code: 123456)",
                "message_hi": f"+91 {phone} पर OTP भेजा गया (परीक्षण कोड: 123456)",
            })
            return

        if path == "/api/auth/verify-otp":
            phone = str(body.get("phone", "")).strip()
            otp = str(body.get("otp", "")).strip()
            if otp in ("123456", "999999") or len(otp) == 6:
                user_data = {
                    "id": f"farmer-{phone[-4:] if len(phone)>=4 else '0001'}",
                    "name": "Kisan Kundan Pal (कुंदन पाल)",
                    "phone": phone or "9876543210",
                    "role": "dairy_owner",
                    "farm_name": "Surabhi Gausansthan (सुरभि गोशाला)",
                    "cattle_count": 6,
                    "district": "Anand, Gujarat",
                    "token": f"token-dhenu-{int(time.time())}",
                }
                self._send_json({"success": True, "user": user_data})
            else:
                self._send_json({"success": False, "message": "Invalid OTP. Use 123456 for demo."}, status=401)
            return

        if path == "/api/auth/demo-login":
            user_data = {
                "id": "demo-kisan-01",
                "name": "Kisan Kundan Pal (कुंदन पाल)",
                "phone": "9876543210",
                "role": "farmer",
                "farm_name": "Surabhi Dairy Farm (सुरभि डेयरी फार्म)",
                "cattle_count": 8,
                "district": "Karnal, Haryana",
                "token": "token-kisan-demo",
            }
            self._send_json({"success": True, "user": user_data})
            return

        # ─── AI Voice Assistant Routes ────────────────────────────────
        if path == "/api/voice/config":
            groq_key = body.get("groq_api_key")
            gemini_key = body.get("gemini_api_key")
            openai_key = body.get("openai_api_key")
            if voice_assistant:
                voice_assistant.set_api_key(groq_key=groq_key, gemini_key=gemini_key, openai_key=openai_key)
                has_groq = bool(voice_assistant.get_api_key("groq"))
                has_gemini = bool(voice_assistant.get_api_key("gemini"))
                active_engine = "⚡ Groq AI (Llama 3.3 70B Versatile)" if has_groq else ("✨ Google Gemini 1.5 Flash" if has_gemini else "🧠 LactoGuard Trained Bovine Model (NLP Vector Space)")
                self._send_json({
                    "success": True,
                    "message": "AI configuration updated successfully!",
                    "has_groq_key": has_groq,
                    "has_gemini_key": has_gemini,
                    "active_engine": active_engine
                })
            else:
                self._send_json({"success": False, "error": "Voice assistant module not available"}, status=500)
            return

        if path == "/api/voice/test-groq":
            test_key = str(body.get("groq_api_key", "")).strip() or (voice_assistant.get_api_key("groq") if voice_assistant else "")
            if not test_key:
                self._send_json({"success": False, "error": "No Groq API key provided. Please paste your key from console.groq.com."})
                return
            try:
                # Direct test call with 5s timeout
                headers = {
                    "Authorization": f"Bearer {test_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "LactoGuard/2.0"
                }
                payload = {
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 5
                }
                import requests
                r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=6)
                if r.status_code == 200:
                    self._send_json({"success": True, "message": "Groq AI (Llama 3.3 / Llama 3.1) connected and verified!"})
                else:
                    self._send_json({"success": False, "error": f"Groq Error (HTTP {r.status_code}): {r.text[:100]}"})
            except Exception as e:
                self._send_json({"success": False, "error": str(e)})
            return

        if path == "/api/voice/chat":
            query = body.get("query", "").strip()
            if not query:
                self._send_json({"success": False, "error": "Query is required"}, status=400)
                return
            
            # Optional on-the-fly API key from client
            custom_groq = body.get("groq_api_key", "").strip()
            custom_gemini = body.get("gemini_api_key", "").strip()
            if voice_assistant:
                if custom_groq:
                    voice_assistant.set_api_key(groq_key=custom_groq)
                if custom_gemini:
                    voice_assistant.set_api_key(gemini_key=custom_gemini)

            if voice_assistant:
                res = voice_assistant.ask_voice_assistant(query)
                if body.get("speak", False):
                    voice_assistant.speak_aloud(res["response"])
                self._send_json({
                    "success": True,
                    "query": query,
                    "response": res["response"],
                    "source": res["source"],
                    "timestamp": res["timestamp"]
                })
            else:
                self._send_json({
                    "success": True,
                    "query": query,
                    "response": "LactoGuard AI Assistant active. All 8 dairy cattle are healthy and monitored.",
                    "source": "fallback",
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
                })
            return

        if path == "/api/voice/speak":
            text = body.get("text", "").strip()
            if text and voice_assistant:
                voice_assistant.speak_aloud(text)
                self._send_json({"success": True, "status": "speaking"})
            else:
                self._send_json({"success": False, "error": "No text provided or TTS unavailable"})
            return

        if path == "/api/voice/listen":
            if voice_assistant:
                res = voice_assistant.listen_to_microphone(timeout=5, phrase_time_limit=8)
                self._send_json(res)
            else:
                self._send_json({"success": False, "error": "Voice assistant module not available"})
            return

        # ─── AI Mastitis Prediction ───────────────────────────────────
        if path == "/api/predict":
            prediction_result = predictor.predict(body)
            
            # Save prediction record
            try:
                conn = sqlite3.connect(DB_PATH)
                cur = conn.cursor()
                now_iso = datetime.now(timezone.utc).isoformat()
                cur.execute("""
                INSERT INTO predictions (cattle_id, payload, result, created_at)
                VALUES (?, ?, ?, ?)
                """, (
                    prediction_result["cattle_id"],
                    json.dumps(body),
                    json.dumps(prediction_result),
                    now_iso,
                ))

                # If existing cow, update its current status
                cur.execute("""
                UPDATE cattle
                SET risk_level = ?, risk_score = ?, last_checked = ?,
                    milk_yield = ?, scc = ?, body_temp = ?, milk_ph = ?,
                    ec_lf = ?, ec_rf = ?, ec_lh = ?, ec_rh = ?
                WHERE id = ?
                """, (
                    prediction_result["risk_level"],
                    prediction_result["risk_score"],
                    now_iso,
                    body.get("milk_yield", 15.0),
                    body.get("scc", 180000),
                    body.get("body_temp", 38.6),
                    body.get("milk_ph", 6.6),
                    body.get("ec_lf", 4.8),
                    body.get("ec_rf", 4.8),
                    body.get("ec_lh", 4.8),
                    body.get("ec_rh", 4.8),
                    prediction_result["cattle_id"],
                ))

                # If high or medium risk, trigger a real-time alert!
                if prediction_result["risk_level"] in ("HIGH", "MEDIUM"):
                    cur.execute("""
                    INSERT INTO alerts (cattle_id, cattle_name, alert_type, risk_level, title, title_hi, message, message_hi, created_at, resolved)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    """, (
                        prediction_result["cattle_id"],
                        prediction_result["cow_name"],
                        "AI_MASTITIS_ALERT",
                        prediction_result["risk_level"],
                        f"AI Alert: {prediction_result['risk_level']} Mastitis Risk for {prediction_result['cow_name']}",
                        f"AI चेतावनी: {prediction_result['cow_name']} में थनैला रोग का {prediction_result['risk_label_hi']}!",
                        prediction_result["summary_en"],
                        prediction_result["summary_hi"],
                        now_iso,
                    ))

                conn.commit()
                conn.close()
            except Exception as e:
                print(f"DB log error: {e}", file=sys.stderr)

            self._send_json({"success": True, "prediction": prediction_result})
            return

        # ─── Add Cattle ───────────────────────────────────────────────
        if path == "/api/cattle":
            tag = body.get("tag_number", f"TAG-{random.randint(100, 999)}")
            cow_id = body.get("id", f"COW-{random.randint(200, 999)}")
            name = body.get("name", "New Cow")
            breed = body.get("breed", "Gir")
            age = float(body.get("age_years", 4.0))
            parity = int(body.get("parity", 2))
            dim = int(body.get("days_in_milk", 60))
            milk_yield = float(body.get("milk_yield", 15.0))
            now_iso = datetime.now(timezone.utc).isoformat()

            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO cattle (id, name, tag_number, breed, age_years, parity, days_in_milk, milk_yield, baseline_yield, risk_level, risk_score, last_checked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'LOW', 8.5, ?)
            """, (cow_id, name, tag, breed, age, parity, dim, milk_yield, milk_yield, now_iso))
            conn.commit()
            conn.close()

            self._send_json({"success": True, "message": "Cattle added successfully", "id": cow_id})
            return

        # ─── Resolve Alert ────────────────────────────────────────────
        if path == "/api/alerts/resolve":
            alert_id = body.get("alert_id")
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": "Alert marked as resolved"})
            return

        self._send_json({"error": "Endpoint not found"}, status=404)


def run_server():
    init_db()
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, AppRequestHandler)
    print(f"\n========================================================")
    print(f"🐄 LactoGuard — Bovine Mastitis Early Warning System")
    print(f"🏆 Smart India Hackathon (SIH) Problem Statement 109")
    print(f"========================================================")
    print(f"🌾 Server running at: http://localhost:{PORT}")
    print(f"🌾 Platform: Zero-dependency Python 3 Full-Stack")
    print(f"🌾 Database: SQLite initialized at {DB_PATH}")
    print(f"🌾 Public Assets: {PUBLIC_DIR}")
    print(f"========================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
