"""
generate_and_train.py
Generates a synthetic bovine mastitis dataset and trains an XGBoost classifier.
Saves the model, scaler, and SHAP explainer to ./model/.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
import shap

RANDOM_STATE = 42
N_SAMPLES = 1500
MODEL_DIR = "./model"
MODEL_PATH = os.path.join(MODEL_DIR, "mastitis_model.pkl")
SHAP_PATH = os.path.join(MODEL_DIR, "shap_explainer.pkl")

np.random.seed(RANDOM_STATE)

# ---------------------------------------------------------------------------
# 1. Synthetic data generation
# ---------------------------------------------------------------------------

def generate_dataset(n: int = N_SAMPLES) -> pd.DataFrame:
    """Generate a realistic synthetic mastitis dataset."""
    # --- Continuous features ---
    milk_yield = np.random.normal(loc=15.0, scale=5.0, size=n).clip(2.0, 35.0)
    scc = np.random.lognormal(mean=12.0, sigma=1.2, size=n).clip(50_000, 5_000_000).astype(int)
    body_temp = np.random.normal(loc=38.8, scale=0.5, size=n).clip(37.5, 41.5)
    conductivity = np.random.normal(loc=5.5, scale=1.8, size=n).clip(3.0, 15.0)
    days_in_milk = np.random.randint(1, 306, size=n)

    # --- Discrete / binary features ---
    udder_swelling = np.random.choice([0, 1], size=n, p=[0.85, 0.15])
    behavior_change = np.random.choice([0, 1, 2, 3], size=n, p=[0.60, 0.20, 0.12, 0.08])
    previous_mastitis = np.random.choice(range(9), size=n,
                                          p=[0.40, 0.20, 0.14, 0.10, 0.07, 0.04, 0.03, 0.01, 0.01])
    quarter_affected = np.random.choice([0, 1, 2, 3, 4], size=n, p=[0.70, 0.075, 0.075, 0.075, 0.075])
    milk_color_score = np.random.choice([0, 1, 2, 3], size=n, p=[0.70, 0.15, 0.10, 0.05])

    df = pd.DataFrame({
        "milk_yield": milk_yield,
        "scc": scc,
        "body_temp": body_temp,
        "conductivity": conductivity,
        "udder_swelling": udder_swelling,
        "behavior_change": behavior_change,
        "days_in_milk": days_in_milk,
        "previous_mastitis": previous_mastitis,
        "quarter_affected": quarter_affected,
        "milk_color_score": milk_color_score,
    })
    return df


def assign_labels(df: pd.DataFrame) -> np.ndarray:
    """
    Assign risk labels (0=LOW, 1=MEDIUM, 2=HIGH) using domain-driven rules.
    """
    labels = np.zeros(len(df), dtype=int)

    # Simulated "previous day average" milk yield (±15 % of own yield)
    prev_avg = df["milk_yield"] * np.random.uniform(0.85, 1.15, size=len(df))

    # ----- HIGH risk conditions -----
    high = (
        (df["scc"] > 800_000) & (
            (df["body_temp"] > 39.8) |
            (df["conductivity"] > 9.0) |
            (df["udder_swelling"] == 1)
        )
    ) | (
        (df["conductivity"] > 11.0) & (df["udder_swelling"] == 1)
    ) | (
        (df["behavior_change"] >= 2) &
        (df["body_temp"] > 39.5) &
        (df["milk_yield"] < 5.0)
    ) | (
        (df["milk_color_score"] >= 2) & (df["scc"] > 500_000)
    )

    # ----- MEDIUM risk conditions -----
    medium = (
        (df["scc"] > 300_000) & (df["body_temp"] > 39.2)
    ) | (
        df["conductivity"] > 7.5
    ) | (
        (df["udder_swelling"] == 1) & (df["scc"] > 200_000)
    ) | (
        df["milk_yield"] < prev_avg * 0.70
    ) | (
        (df["previous_mastitis"] > 2) & (df["scc"] > 250_000)
    )

    labels[medium] = 1
    labels[high] = 2  # HIGH overrides MEDIUM

    # ----- Realistic noise: ±10 % edge-case label flip -----
    n_noisy = int(len(labels) * 0.10)
    noisy_idx = np.random.choice(len(labels), size=n_noisy, replace=False)
    for idx in noisy_idx:
        current = labels[idx]
        candidates = [l for l in [0, 1, 2] if l != current]
        labels[idx] = np.random.choice(candidates)

    return labels


# ---------------------------------------------------------------------------
# 2. Model training
# ---------------------------------------------------------------------------

FEATURE_NAMES = [
    "milk_yield", "scc", "body_temp", "conductivity",
    "udder_swelling", "behavior_change", "days_in_milk",
    "previous_mastitis", "quarter_affected", "milk_color_score",
]

CONTINUOUS_FEATURES = ["milk_yield", "scc", "body_temp", "conductivity", "days_in_milk"]
DISCRETE_FEATURES = [
    "udder_swelling", "behavior_change", "previous_mastitis",
    "quarter_affected", "milk_color_score",
]


def train():
    print("=" * 60)
    print("  Bovine Mastitis Prediction — Model Training")
    print("=" * 60)

    # 1. Generate data
    print("\n[1/5] Generating synthetic dataset …")
    df = generate_dataset(N_SAMPLES)
    y = assign_labels(df)
    X = df[FEATURE_NAMES].copy()

    print(f"      Total samples : {len(X)}")
    print(f"      Class distribution: LOW={np.sum(y==0)}, MEDIUM={np.sum(y==1)}, HIGH={np.sum(y==2)}")

    # 2. Train / test split
    print("\n[2/5] Splitting 80/20 train/test …")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    # 3. Preprocessing — scale continuous features only
    print("\n[3/5] Preprocessing features …")
    scaler = StandardScaler()
    X_train_scaled = X_train.copy()
    X_test_scaled = X_test.copy()
    X_train_scaled[CONTINUOUS_FEATURES] = scaler.fit_transform(X_train[CONTINUOUS_FEATURES])
    X_test_scaled[CONTINUOUS_FEATURES] = scaler.transform(X_test[CONTINUOUS_FEATURES])

    # 4. Train XGBoost (primary)
    print("\n[4/5] Training XGBoost classifier …")
    xgb_model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    xgb_model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False,
    )

    # 4b. Train RandomForest (backup)
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    rf_model.fit(X_train_scaled, y_train)

    # 5. Evaluate
    print("\n[5/5] Evaluating models …")
    y_pred_xgb = xgb_model.predict(X_test_scaled)
    y_pred_rf = rf_model.predict(X_test_scaled)

    acc_xgb = accuracy_score(y_test, y_pred_xgb)
    acc_rf = accuracy_score(y_test, y_pred_rf)

    print(f"\n  XGBoost Accuracy : {acc_xgb:.4f} ({acc_xgb*100:.2f}%)")
    print(f"  RandomForest Accuracy : {acc_rf:.4f} ({acc_rf*100:.2f}%)")

    print("\n  XGBoost Classification Report:")
    print(classification_report(y_test, y_pred_xgb, target_names=["LOW", "MEDIUM", "HIGH"]))

    print("  Confusion Matrix (XGBoost):")
    print(confusion_matrix(y_test, y_pred_xgb))

    # 6. SHAP explainer
    print("\n  Building SHAP TreeExplainer …")
    explainer = shap.TreeExplainer(xgb_model)

    # Compute global feature importance from SHAP
    shap_values_train = explainer.shap_values(X_train_scaled)
    if isinstance(shap_values_train, list):
        # Multi-class: average absolute SHAP across classes
        mean_abs_shap = np.mean(
            [np.abs(sv).mean(axis=0) for sv in shap_values_train], axis=0
        )
    else:
        mean_abs_shap = np.abs(shap_values_train).mean(axis=0)

    global_importance = {
        feat: float(imp)
        for feat, imp in zip(FEATURE_NAMES, mean_abs_shap)
    }
    print("  Global SHAP feature importance:")
    for feat, imp in sorted(global_importance.items(), key=lambda x: -x[1]):
        print(f"    {feat:<22}: {imp:.4f}")

    # 7. Save artefacts
    os.makedirs(MODEL_DIR, exist_ok=True)

    metadata = {
        "version": "1.0.0",
        "n_samples": N_SAMPLES,
        "accuracy_xgb": round(acc_xgb, 4),
        "accuracy_rf": round(acc_rf, 4),
        "feature_names": FEATURE_NAMES,
        "continuous_features": CONTINUOUS_FEATURES,
        "discrete_features": DISCRETE_FEATURES,
        "class_names": ["LOW", "MEDIUM", "HIGH"],
        "global_shap_importance": global_importance,
    }

    model_bundle = {
        "model": xgb_model,
        "backup_model": rf_model,
        "scaler": scaler,
        "feature_names": FEATURE_NAMES,
        "continuous_features": CONTINUOUS_FEATURES,
        "discrete_features": DISCRETE_FEATURES,
        "metadata": metadata,
    }

    joblib.dump(model_bundle, MODEL_PATH)
    joblib.dump(explainer, SHAP_PATH)

    # Also save metadata as JSON for quick inspection
    with open(os.path.join(MODEL_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n  Model bundle saved  → {MODEL_PATH}")
    print(f"  SHAP explainer saved → {SHAP_PATH}")
    print(f"\n✅  Model trained and saved! Accuracy: {acc_xgb*100:.2f}%")
    print("=" * 60)


if __name__ == "__main__":
    train()
