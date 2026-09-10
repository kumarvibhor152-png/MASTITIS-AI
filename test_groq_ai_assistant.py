#!/usr/bin/env python3
"""
test_groq_ai_assistant.py
Comprehensive test suite verifying LactoGuard's Real-World Conversational AI:
- Groq Cloud AI integration
- Trained Bovine NLP model (qa_nlp_model.joblib)
- Trained XGBoost sensor model (mastitis_model.joblib)
- Live Encyclopedic RAG engine
"""

import sys
import os
import json
import voice_assistant

def run_tests():
    print("=" * 70)
    print("  LACTOGUARD AI VOICE ASSISTANT — REAL-WORLD VERIFICATION SUITE")
    print("=" * 70)

    test_queries = [
        # Clinical & Pathology
        ("Can humans drink milk from a cow with mastitis?", ["no", "never", "boil", "staphylococcus", "toxin"]),
        ("Why does cow milk turn watery and yellow with clots?", ["clot", "watery", "epithelial", "mastitis", "serum"]),
        ("What is subclinical mastitis and how does it cause loss?", ["subclinical", "invisible", "scc", "conductivity", "loss"]),
        
        # Remedies & Pharmacology
        ("What is the ICAR herbal paste recipe for mastitis?", ["aloe vera", "turmeric", "haldi", "chuna", "lime"]),
        ("Can I give Meloxicam or Paracetamol for udder swelling?", ["meloxicam", "anti-inflammatory", "fever", "flunixin"]),
        ("What is Dry Cow Therapy and teat sealant?", ["dry cow", "sealant", "bismuth", "keratin", "calving"]),
        
        # Systemic Diseases
        ("What is milk fever and how to treat with calcium borogluconate?", ["hypocalcemia", "calcium", "borogluconate", "downer", "calving"]),
        ("My cow has bloated stomach on left side after grazing clover", ["bloat", "tympany", "rumen", "oil", "frothy"]),
        ("What is Lumpy Skin Disease in cattle?", ["lumpy", "capripox", "nodule", "fever", "vaccine"]),
        ("What are symptoms of Foot and Mouth Disease?", ["fmd", "blister", "saliv", "foot", "mouth"]),

        # Breeding & Reproduction
        ("What is the AM-PM rule for artificial insemination?", ["am-pm", "morning", "evening", "inseminat", "ovulation"]),
        ("What is the gestation period of a cow vs buffalo?", ["280", "285", "310", "day", "buffalo"]),
        ("How to care for a newborn calf and colostrum feeding?", ["colostrum", "naval", "iodine", "hour", "10%"]),

        # Nutrition & Farm Management
        ("How to make pit silage from green maize?", ["silage", "maize", "ferment", "anaerobic", "pit"]),
        ("How much water does a milking cow need per day?", ["liter", "water", "day", "milk"]),
        ("How is fresh paneer or cheese made from milk?", ["paneer", "citric", "whey", "curd"]),

        # Telemetry & Surabhi Farm Herd
        ("How is cow Kaveri doing in Kundan Pal's farm?", ["kaveri", "cow-04", "clinical", "alert"]),
        ("Summary of Kundan Pal cattle herd", ["surabhi", "kundan", "8", "gauri", "lakshmi"]),
        ("EC is 7.4 and SCC is 680000", ["diagnosis", "medium", "risk", "xgboost", "loss"]),

        # AI & Open Domain General Knowledge
        ("What is artificial intelligence in LactoGuard?", ["xgboost", "decision tree", "sensor", "model"]),
        ("What is photosynthesis?", ["photosynthesis", "biological", "light", "plant", "organism"]),
        ("Who was Isaac Newton?", ["newton", "mathematician", "physicist", "english"])
    ]

    passed = 0
    failed = 0

    for query, expected_keywords in test_queries:
        res = voice_assistant.ask_voice_assistant(query)
        resp_text = res["response"].lower()
        source = res["source"]

        # Check that response is NOT the old generic boilerplate
        is_generic = "bovine udder health depends on maintaining clean, dry bedding" in resp_text and len(expected_keywords) > 0 and not any(k in resp_text for k in expected_keywords)
        matched_kw = [k for k in expected_keywords if k in resp_text]
        is_match = len(matched_kw) > 0 and not is_generic

        if is_match:
            passed += 1
            status = "PASS"
        else:
            failed += 1
            status = "FAIL"

        print(f"[{status}] Q: \"{query[:45]}...\"")
        print(f"       Engine: {source}")
        print(f"       Matched: {matched_kw}")
        print(f"       Snippet: {res['response'][:110]}...")
        print()

    total = len(test_queries)
    pct = (passed / total) * 100.0
    print("=" * 70)
    print(f"TOTAL TESTS: {total} | PASSED: {passed} | FAILED: {failed} | SUCCESS RATE: {pct:.1f}%")
    print("=" * 70)

    if failed == 0:
        print("ALL REAL-WORLD CONVERSATIONAL TESTS PASSED!")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(run_tests())
