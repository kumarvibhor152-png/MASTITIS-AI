"""
test_ai_engine.py — Verify AI Mastitis Prediction Engine
Tests 3 realistic clinical scenarios:
1. Normal Healthy Cow (Lakshmi) -> LOW risk
2. Subclinical Early Warning (Kamdhenu) -> MEDIUM risk (48-72h forecast)
3. Acute Clinical Mastitis (Meera) -> HIGH risk (Immediate intervention)
"""

import sys
from ai_engine import predictor


def run_tests():
    print("🧪 Running AI Mastitis Prediction Engine Unit Tests...")

    # Case 1: Healthy Cow (Gir cow)
    healthy_cow = {
        "cattle_id": "COW-101",
        "cow_name": "Lakshmi",
        "milk_yield": 18.0,
        "baseline_yield": 18.2,
        "scc": 120_000,
        "body_temp": 38.5,
        "milk_ph": 6.6,
        "conductivity": 4.8,
        "ec_lf": 4.8,
        "ec_rf": 4.9,
        "ec_lh": 4.7,
        "ec_rh": 4.8,
        "udder_swelling": False,
        "milk_color_score": 0,
        "behavior_change": 0,
        "days_in_milk": 120,
        "previous_mastitis": 0,
    }
    res1 = predictor.predict(healthy_cow)
    print(f"Case 1 (Healthy): Risk = {res1['risk_level']}, Score = {res1['risk_score']}%, Quarters = {res1['flagged_quarters']}")
    assert res1["risk_level"] == "LOW", f"Expected LOW risk, got {res1['risk_level']}"
    assert res1["risk_score"] < 35.0, f"Expected <35 score, got {res1['risk_score']}"
    assert len(res1["flagged_quarters"]) == 0, f"Expected 0 flagged quarters, got {res1['flagged_quarters']}"
    print("  ✅ Healthy case passed!")

    # Case 2: Subclinical Early Warning (Kamdhenu - Right Hind quarter spike, 14% yield drop)
    subclinical_cow = {
        "cattle_id": "COW-102",
        "cow_name": "Kamdhenu",
        "milk_yield": 13.8,
        "baseline_yield": 16.0,  # ~13.8% drop
        "scc": 280_000,
        "body_temp": 38.9,
        "milk_ph": 6.78,
        "conductivity": 5.4,
        "ec_lf": 4.9,
        "ec_rf": 5.0,
        "ec_lh": 4.9,
        "ec_rh": 6.4,  # Anomaly in Right Hind quarter (>0.5 mS/cm variance!)
        "udder_swelling": False,  # Subclinical has NO visual swelling yet!
        "milk_color_score": 0,    # Milk looks normal to naked eye!
        "behavior_change": 1,
        "days_in_milk": 45,       # Early lactation
        "previous_mastitis": 1,
    }
    res2 = predictor.predict(subclinical_cow)
    print(f"Case 2 (Subclinical): Risk = {res2['risk_level']}, Score = {res2['risk_score']}%, Quarters = {res2['flagged_quarters']}")
    assert res2["risk_level"] == "MEDIUM", f"Expected MEDIUM risk, got {res2['risk_level']}"
    assert any("RH" in q or "Right Hind" in q for q in res2["flagged_quarters"]), f"RH quarter must be flagged! Got {res2['flagged_quarters']}"
    assert "48-72" in res2["forecast_window_en"], "Must mention 48-72h early warning"
    assert res2["economic_impact"]["saved_by_early_forecast_inr"] > 2000, "Should compute economic savings"
    print("  ✅ Subclinical early warning case passed!")

    # Case 3: Acute Clinical Mastitis (Meera - High fever, severe Left Front spike, udder swelling)
    clinical_cow = {
        "cattle_id": "COW-104",
        "cow_name": "Meera",
        "milk_yield": 9.0,
        "baseline_yield": 19.5,  # >50% drop
        "scc": 750_000,
        "body_temp": 40.1,  # High fever
        "milk_ph": 7.25,
        "conductivity": 7.5,
        "ec_lf": 7.8,
        "ec_rf": 5.2,
        "ec_lh": 5.1,
        "ec_rh": 5.3,
        "udder_swelling": True,
        "milk_color_score": 2,  # Clots visible
        "behavior_change": 3,
        "days_in_milk": 30,
        "previous_mastitis": 2,
    }
    res3 = predictor.predict(clinical_cow)
    print(f"Case 3 (Acute Clinical): Risk = {res3['risk_level']}, Score = {res3['risk_score']}%, Quarters = {res3['flagged_quarters']}")
    assert res3["risk_level"] == "HIGH", f"Expected HIGH risk, got {res3['risk_level']}"
    assert res3["risk_score"] >= 70.0, f"Expected >=70 score, got {res3['risk_score']}"
    assert any("LF" in q or "Left Front" in q for q in res3["flagged_quarters"]), f"LF quarter must be flagged! Got {res3['flagged_quarters']}"
    print("  ✅ Acute clinical case passed!")

    print("\n🎉 All AI Engine Verification Tests Passed Successfully!")


if __name__ == "__main__":
    run_tests()
