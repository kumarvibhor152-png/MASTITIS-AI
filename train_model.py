"""
train_model.py — Trains AI Mastitis Classifier & Financial Loss Estimator
on the generated synthetic dataset using XGBoost, evaluating accuracy,
saving joblib model artifacts and metadata for the AI Voice Assistant.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier, XGBRegressor

DATA_PATH = "data/synthetic_mastitis_data.csv"
MODEL_DIR = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "mastitis_model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "dataset_metadata.json")

FEATURE_COLS = [
    "ec_lf", "ec_rf", "ec_lh", "ec_rh", "max_ec", "ec_variance",
    "scc", "body_temp_c", "milk_ph", "yield_drop_pct",
    "udder_swelling", "kicking_behavior"
]

LABEL_MAP = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
INV_LABEL_MAP = {0: "LOW", 1: "MEDIUM", 2: "HIGH"}

def train_mastitis_ai():
    os.makedirs(MODEL_DIR, exist_ok=True)
    if not os.path.exists(DATA_PATH):
        from data.generate_dataset import generate_synthetic_data
        generate_synthetic_data(output_path=DATA_PATH)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {len(df)} records from {DATA_PATH}")

    # Shuffle and split into Train (80%) and Test (20%)
    shuffled = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    split_idx = int(0.8 * len(shuffled))
    train_df = shuffled.iloc[:split_idx]
    test_df = shuffled.iloc[split_idx:]

    X_train = train_df[FEATURE_COLS]
    y_train = train_df["risk_level"].map(LABEL_MAP).values
    loss_train = train_df["financial_loss_inr"].values

    X_test = test_df[FEATURE_COLS]
    y_test = test_df["risk_level"].map(LABEL_MAP).values
    loss_test = test_df["financial_loss_inr"].values

    print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")

    # 1. Train Classifier (XGBoost)
    print("\n[1/4] Training XGBoost Risk Classifier...")
    clf = XGBClassifier(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        random_state=42,
        eval_metric="mlogloss"
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = float((y_pred == y_test).mean())

    print(f"\n>> Model Accuracy on Test Set: {acc * 100:.2f}%")
    print("-" * 50)
    print(f"{'Class':<10} {'Precision':<12} {'Recall':<12} {'F1-Score':<10}")
    print("-" * 50)
    per_class_metrics = {}
    for label_str, code in LABEL_MAP.items():
        tp = int(np.sum((y_pred == code) & (y_test == code)))
        fp = int(np.sum((y_pred == code) & (y_test != code)))
        fn = int(np.sum((y_pred != code) & (y_test == code)))
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        per_class_metrics[label_str] = {"precision": round(prec, 3), "recall": round(rec, 3), "f1": round(f1, 3)}
        print(f"{label_str:<10} {prec:<12.3f} {rec:<12.3f} {f1:<10.3f}")
    print("-" * 50)

    # 2. Train Regressor for Financial Loss Estimation
    print("\n[2/4] Training XGBoost Financial Loss Regressor (INR)...")
    reg = XGBRegressor(
        n_estimators=80,
        max_depth=5,
        learning_rate=0.08,
        random_state=42
    )
    reg.fit(X_train, loss_train)
    loss_pred = reg.predict(X_test)
    mae = float(np.mean(np.abs(loss_pred - loss_test)))
    print(f">> Financial Loss Estimation MAE: ₹{mae:.2f}")

    # 3. Save Model Artifact
    print("\n[3/4] Saving model bundle...")
    artifact = {
        "classifier": clf,
        "loss_regressor": reg,
        "feature_cols": FEATURE_COLS,
        "label_map": LABEL_MAP,
        "inv_label_map": INV_LABEL_MAP,
        "accuracy": acc,
        "mae_loss": mae,
        "metrics": per_class_metrics
    }
    joblib.dump(artifact, MODEL_PATH)
    print(f"Saved model artifact to {MODEL_PATH} ({os.path.getsize(MODEL_PATH)} bytes)")

    # 4. Save Dataset & Model Metadata for Voice Assistant Prompt Grounding
    print("\n[4/4] Generating AI Voice Assistant Grounding Metadata...")
    metadata = {
        "model_name": "LactoGuard XGBoost Mastitis Diagnostic Engine",
        "dataset_records_count": len(df),
        "features": FEATURE_COLS,
        "accuracy_pct": round(acc * 100, 2),
        "mae_loss_inr": round(mae, 2),
        "class_distribution": df["risk_level"].value_counts().to_dict(),
        "breeds_represented": df["breed"].unique().tolist(),
        "mean_scc": {
            "healthy": int(df[df["risk_level"] == "LOW"]["scc"].mean()),
            "subclinical": int(df[df["risk_level"] == "MEDIUM"]["scc"].mean()),
            "clinical": int(df[df["risk_level"] == "HIGH"]["scc"].mean())
        },
        "mean_ec_ms_cm": {
            "healthy": round(float(df[df["risk_level"] == "LOW"]["max_ec"].mean()), 2),
            "subclinical": round(float(df[df["risk_level"] == "MEDIUM"]["max_ec"].mean()), 2),
            "clinical": round(float(df[df["risk_level"] == "HIGH"]["max_ec"].mean()), 2)
        },
        "mean_loss_inr": {
            "healthy": int(df[df["risk_level"] == "LOW"]["financial_loss_inr"].mean()),
            "subclinical": int(df[df["risk_level"] == "MEDIUM"]["financial_loss_inr"].mean()),
            "clinical": int(df[df["risk_level"] == "HIGH"]["financial_loss_inr"].mean())
        },
        "icar_remedies": {
            "herbal_paste": "Aloe vera (250g) + Turmeric powder (50g) + Calcium hydroxide / Chuna (15g). Grind to paste, dilute with water, apply externally on udder 3 times daily for 5 days after thorough milking.",
            "sanitation": "Post-milking teat dip in 0.5% povidone-iodine solution. Keep animals standing for 45 minutes after milking.",
            "prevention": "Routine California Mastitis Test (CMT) weekly and IoT electrical conductivity monitoring."
        },
        "farm_context": {
            "owner": "Kundan Pal",
            "farm_name": "Surabhi Dairy Farm",
            "total_cows": 8,
            "cows": [
                {"id": "COW-01", "name": "Gauri", "breed": "Murrah Buffalo"},
                {"id": "COW-02", "name": "Lakshmi", "breed": "Gir"},
                {"id": "COW-03", "name": "Nandini", "breed": "Sahiwal"},
                {"id": "COW-04", "name": "Kaveri", "breed": "HF Cross"},
                {"id": "COW-05", "name": "Radha", "breed": "Jersey Cross"},
                {"id": "COW-06", "name": "Ganga", "breed": "Gir"},
                {"id": "COW-07", "name": "Yamuna", "breed": "Murrah Buffalo"},
                {"id": "COW-08", "name": "Saraswati", "breed": "Sahiwal"}
            ]
        }
    }
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Saved metadata to {METADATA_PATH}")

    return artifact, metadata

if __name__ == "__main__":
    train_mastitis_ai()
