"""
generate_dataset.py — Synthetic Bovine Health & Mastitis Dataset Generator
Generates realistic, veterinary-calibrated synthetic data for Indian dairy cattle.
Covering healthy, subclinical (48-72h warning), and acute clinical mastitis cases.
"""

import os
import json
import random
import numpy as np
import pandas as pd

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

INDIAN_COW_NAMES = [
    "Lakshmi", "Kamdhenu", "Ganga", "Meera", "Radha", 
    "Nandini", "Surabhi", "Kapila", "Yamuna", "Sita", 
    "Gauri", "Tulsi", "Bhavani", "Kalyani", "Devi"
]

BREEDS = [
    "Gir", "Sahiwal", "Murrah Buffalo", "Tharparkar", 
    "Rathi", "HF Cross", "Red Sindhi"
]

def generate_synthetic_data(n_samples: int = 2500, output_path: str = "data/synthetic_mastitis_data.csv") -> pd.DataFrame:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    records = []

    for i in range(n_samples):
        cow_id = f"COW-{1000 + i}"
        name = random.choice(INDIAN_COW_NAMES)
        breed = random.choice(BREEDS)
        age = round(random.uniform(2.5, 9.5), 1)
        parity = random.randint(1, 6)
        dim = random.randint(12, 290)

        # Baseline healthy yield based on breed
        if breed in ["HF Cross"]:
            baseline_yield = round(random.uniform(18.0, 26.0), 1)
        elif breed in ["Murrah Buffalo"]:
            baseline_yield = round(random.uniform(12.0, 18.0), 1)
        elif breed in ["Gir", "Sahiwal"]:
            baseline_yield = round(random.uniform(14.0, 20.0), 1)
        else:
            baseline_yield = round(random.uniform(10.0, 16.0), 1)

        # Class distribution: 60% Healthy (LOW), 25% Subclinical (MEDIUM), 15% Acute Clinical (HIGH)
        rand_case = random.random()
        
        if rand_case < 0.60:
            # Healthy Case (LOW RISK)
            risk_level = "LOW"
            ec_base = random.uniform(4.5, 5.1)
            ec_lf = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_rf = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_lh = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_rh = round(ec_base + random.uniform(-0.15, 0.15), 2)
            scc = int(np.clip(np.random.normal(loc=130000, scale=35000), 50000, 195000))
            body_temp = round(float(np.clip(np.random.normal(loc=38.5, scale=0.2), 38.2, 38.9)), 1)
            milk_ph = round(float(np.clip(np.random.normal(loc=6.58, scale=0.06), 6.45, 6.70)), 2)
            yield_drop_pct = round(max(0.0, float(np.random.normal(loc=1.5, scale=1.5))), 1)
            current_yield = round(max(2.0, baseline_yield * (1.0 - yield_drop_pct / 100.0)), 1)
            udder_swelling = 0
            kicking = 0
            subclinical_q = "None"
            loss_inr = 0
            action = "Routine milking, clean dry udder cloth, post-milking dip (0.5% povidone iodine)."
            phytotherapy = "No medication needed. Maintain clean bedding and nutrition."

        elif rand_case < 0.85:
            # Subclinical Mastitis (MEDIUM RISK - 48 to 72h Early Warning)
            risk_level = "MEDIUM"
            subclinical_q = random.choice(["LF", "RF", "LH", "RH"])
            ec_base = random.uniform(4.7, 5.2)
            
            ec_lf = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_rf = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_lh = round(ec_base + random.uniform(-0.15, 0.15), 2)
            ec_rh = round(ec_base + random.uniform(-0.15, 0.15), 2)
            
            # Spike in the affected quarter (conductivity elevates by 25-45%)
            spike_val = round(ec_base + random.uniform(1.2, 2.2), 2)
            if subclinical_q == "LF": ec_lf = spike_val
            elif subclinical_q == "RF": ec_rf = spike_val
            elif subclinical_q == "LH": ec_lh = spike_val
            else: ec_rh = spike_val

            scc = int(np.clip(np.random.normal(loc=320000, scale=70000), 210000, 480000))
            body_temp = round(float(np.clip(np.random.normal(loc=38.8, scale=0.25), 38.5, 39.3)), 1)
            milk_ph = round(float(np.clip(np.random.normal(loc=6.82, scale=0.08), 6.72, 7.00)), 2)
            yield_drop_pct = round(random.uniform(10.0, 22.0), 1)
            current_yield = round(max(2.0, baseline_yield * (1.0 - yield_drop_pct / 100.0)), 1)
            udder_swelling = random.choice([0, 1])
            kicking = random.choice([0, 1])
            loss_inr = int(yield_drop_pct * 350 + random.randint(1500, 3500))
            action = f"Subclinical warning in {subclinical_q} quarter. Apply ICAR herbal paste 3x daily for 5 days. Strip affected quarter completely."
            phytotherapy = "ICAR Formulation: 250g Aloe Vera + 50g Pure Turmeric + 15g Edible Lime (Chuna) ground into paste."

        else:
            # Acute Clinical Mastitis (HIGH RISK)
            risk_level = "HIGH"
            subclinical_q = random.choice(["LF", "RF", "LH", "RH", "Both Hind", "Both Front"])
            ec_base = random.uniform(6.5, 8.5)
            ec_lf = round(ec_base + random.uniform(-0.3, 0.3), 2)
            ec_rf = round(ec_base + random.uniform(-0.3, 0.3), 2)
            ec_lh = round(ec_base + random.uniform(-0.3, 0.3), 2)
            ec_rh = round(ec_base + random.uniform(-0.3, 0.3), 2)
            scc = int(np.clip(np.random.normal(loc=1200000, scale=350000), 600000, 3500000))
            body_temp = round(float(np.clip(np.random.normal(loc=40.2, scale=0.4), 39.6, 41.5)), 1)
            milk_ph = round(float(np.clip(np.random.normal(loc=7.25, scale=0.15), 7.05, 7.60)), 2)
            yield_drop_pct = round(random.uniform(40.0, 75.0), 1)
            current_yield = round(max(1.0, baseline_yield * (1.0 - yield_drop_pct / 100.0)), 1)
            udder_swelling = 2
            kicking = random.choice([1, 2])
            loss_inr = int(yield_drop_pct * 500 + random.randint(8000, 18000))
            action = "Urgent: Acute clinical mastitis! Isolate animal immediately. Call government veterinary officer (1962). Administer prescribed veterinary therapy."
            phytotherapy = "Immediate veterinary antibiotic injection + anti-inflammatory + frequent cold water fanning and stripping."

        # Calculate electrical conductivity metrics
        ecs = [ec_lf, ec_rf, ec_lh, ec_rh]
        max_ec = max(ecs)
        min_ec = min(ecs)
        ec_variance = round(max_ec - min_ec, 2)

        records.append({
            "cow_id": cow_id,
            "name": name,
            "breed": breed,
            "age_years": age,
            "parity": parity,
            "days_in_milk": dim,
            "baseline_yield_liters": baseline_yield,
            "milk_yield_liters": current_yield,
            "yield_drop_pct": yield_drop_pct,
            "ec_lf": ec_lf,
            "ec_rf": ec_rf,
            "ec_lh": ec_lh,
            "ec_rh": ec_rh,
            "max_ec": max_ec,
            "ec_variance": ec_variance,
            "scc": scc,
            "body_temp_c": body_temp,
            "milk_ph": milk_ph,
            "udder_swelling": udder_swelling,
            "kicking_behavior": kicking,
            "subclinical_quarter": subclinical_q,
            "risk_level": risk_level,
            "financial_loss_inr": loss_inr,
            "recommended_action": action,
            "phytotherapy_recipe": phytotherapy,
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated synthetic dataset with {len(df)} records at {output_path}")
    print("Class Distribution:\n", df["risk_level"].value_counts(normalize=True))
    return df

if __name__ == "__main__":
    generate_synthetic_data()
