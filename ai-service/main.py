"""
main.py — FastAPI microservice for bovine mastitis prediction.
Endpoints: GET /health, POST /predict, POST /batch-predict, GET /feature-importance
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging & env
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./model/mastitis_model.pkl")
SHAP_PATH = "./model/shap_explainer.pkl"
VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Global model state
# ---------------------------------------------------------------------------
_model_bundle: dict = {}
_shap_explainer = None
_model_loaded: bool = False


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class PredictionRequest(BaseModel):
    cattle_id: Optional[str] = Field(None, description="Optional cattle identifier")
    milk_yield: float = Field(..., ge=0.0, description="Milk yield in liters/day")
    scc: int = Field(200_000, ge=0, description="Somatic cell count (cells/mL)")
    body_temp: float = Field(..., ge=35.0, le=45.0, description="Body temperature in °C")
    conductivity: float = Field(5.0, ge=0.0, description="Milk conductivity in mS/cm")
    udder_swelling: bool = Field(False, description="Presence of udder swelling")
    behavior_change: int = Field(0, ge=0, le=3, description="Behaviour change score (0=normal)")
    days_in_milk: int = Field(100, ge=1, le=305, description="Days in milk")
    previous_mastitis: int = Field(0, ge=0, description="Number of previous mastitis cases")
    quarter_affected: int = Field(0, ge=0, le=4, description="Quarter affected (0=none, 1-4=specific)")
    milk_color_score: int = Field(0, ge=0, le=3, description="Milk colour score (0=normal, 3=very abnormal)")

    class Config:
        json_schema_extra = {
            "example": {
                "cattle_id": "COW-042",
                "milk_yield": 8.5,
                "scc": 650000,
                "body_temp": 39.9,
                "conductivity": 8.2,
                "udder_swelling": True,
                "behavior_change": 1,
                "days_in_milk": 75,
                "previous_mastitis": 1,
                "quarter_affected": 2,
                "milk_color_score": 1,
            }
        }


class PredictionResponse(BaseModel):
    cattle_id: Optional[str] = None
    risk_level: str = Field(..., description="'LOW', 'MEDIUM', or 'HIGH'")
    risk_score: int = Field(..., description="0=LOW, 1=MEDIUM, 2=HIGH")
    confidence: float = Field(..., description="Prediction confidence (0–1)")
    probabilities: dict = Field(..., description="Class probabilities: {LOW, MEDIUM, HIGH}")
    explanation: str = Field(..., description="Human-readable explanation of key drivers")
    recommended_actions: List[str] = Field(..., description="Veterinary action recommendations")
    shap_values: dict = Field(..., description="Per-feature SHAP contributions for this prediction")
    timestamp: str = Field(..., description="ISO-8601 prediction timestamp (UTC)")


# ---------------------------------------------------------------------------
# Lifespan — load model on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model_bundle, _shap_explainer, _model_loaded
    logger.info("Starting up — loading model from %s …", MODEL_PATH)
    try:
        _model_bundle = joblib.load(MODEL_PATH)
        logger.info(
            "Model loaded. Version=%s  XGB-Accuracy=%.4f",
            _model_bundle["metadata"].get("version", "?"),
            _model_bundle["metadata"].get("accuracy_xgb", 0.0),
        )
        try:
            _shap_explainer = joblib.load(SHAP_PATH)
            logger.info("SHAP explainer loaded.")
        except FileNotFoundError:
            logger.warning("SHAP explainer not found at %s — SHAP values will be empty.", SHAP_PATH)
            _shap_explainer = None

        _model_loaded = True
    except FileNotFoundError:
        logger.error(
            "Model file not found at %s. Run generate_and_train.py first.", MODEL_PATH
        )
        _model_loaded = False
    yield
    logger.info("Shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Mastitis AI Prediction Service",
    description=(
        "XGBoost-powered microservice that predicts bovine mastitis risk "
        "from cow health and milking data."
    ),
    version=VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

FEATURE_NAMES = [
    "milk_yield", "scc", "body_temp", "conductivity",
    "udder_swelling", "behavior_change", "days_in_milk",
    "previous_mastitis", "quarter_affected", "milk_color_score",
]

RISK_LABELS = ["LOW", "MEDIUM", "HIGH"]

ACTIONS: dict[str, List[str]] = {
    "HIGH": [
        "Call veterinarian immediately",
        "Isolate the cow from the herd",
        "Do not use milk from this cow",
        "Check all four udder quarters thoroughly",
        "Record symptoms and any medications given",
    ],
    "MEDIUM": [
        "Monitor closely for the next 24 hours",
        "Check udder manually during the next milking",
        "Reduce stress on the animal",
        "Ensure clean, dry bedding",
        "Consider calling the vet if condition worsens",
    ],
    "LOW": [
        "Continue regular care routine",
        "Maintain hygiene during milking",
        "Ensure proper nutrition and hydration",
        "Schedule regular health checks",
    ],
}


def _request_to_df(req: PredictionRequest) -> pd.DataFrame:
    """Convert a PredictionRequest into a scaled DataFrame ready for the model."""
    row = {
        "milk_yield": req.milk_yield,
        "scc": float(req.scc),
        "body_temp": req.body_temp,
        "conductivity": req.conductivity,
        "udder_swelling": int(req.udder_swelling),
        "behavior_change": req.behavior_change,
        "days_in_milk": req.days_in_milk,
        "previous_mastitis": req.previous_mastitis,
        "quarter_affected": req.quarter_affected,
        "milk_color_score": req.milk_color_score,
    }
    df = pd.DataFrame([row], columns=FEATURE_NAMES)
    scaler = _model_bundle["scaler"]
    continuous = _model_bundle.get("continuous_features", ["milk_yield", "scc", "body_temp", "conductivity", "days_in_milk"])
    df[continuous] = scaler.transform(df[continuous])
    return df


def _build_explanation(req: PredictionRequest, shap_dict: dict, risk_level: str) -> str:
    """Generate a human-readable explanation driven by the top SHAP features."""
    lines: List[str] = []

    # --- Rule-based clinical phrases (checked regardless of SHAP order) ---
    if req.scc > 800_000:
        lines.append("Very high somatic cell count detected — strong sign of active infection.")
    elif req.scc > 300_000:
        lines.append("Elevated somatic cell count — possible subclinical mastitis.")

    if req.body_temp > 40.0:
        lines.append("High body temperature — possible fever or systemic infection.")
    elif req.body_temp > 39.5:
        lines.append("Mildly elevated body temperature — monitor for fever progression.")

    if req.udder_swelling:
        lines.append("Udder swelling detected — immediate veterinary attention may be needed.")

    if req.conductivity > 9.0:
        lines.append("High milk conductivity — indicative of significant quarter infection.")
    elif req.conductivity > 7.5:
        lines.append("Elevated milk conductivity — early sign of potential mastitis.")

    if req.behavior_change >= 2:
        lines.append("Noticeable behaviour change — animal may be in pain or discomfort.")
    elif req.behavior_change == 1:
        lines.append("Mild behaviour change observed — worth monitoring.")

    if req.milk_color_score >= 2:
        lines.append("Abnormal milk appearance — may contain flakes, clots, or discolouration.")

    if req.milk_yield < 5.0:
        lines.append("Very low milk yield — significant drop may indicate illness.")

    if req.previous_mastitis > 2:
        lines.append(f"History of {req.previous_mastitis} previous mastitis cases — higher recurrence risk.")

    # --- If no clinical flags, rely on top SHAP features ---
    if not lines:
        top_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        for feat, val in top_features:
            if abs(val) > 0.01:
                direction = "elevated" if val > 0 else "reduced"
                lines.append(f"{feat.replace('_', ' ').title()} is {direction} and contributing to this prediction.")

    if not lines:
        lines.append("All indicators are within normal range.")

    prefix = {
        "LOW": "✅ Low mastitis risk.",
        "MEDIUM": "⚠️ Moderate mastitis risk.",
        "HIGH": "🚨 High mastitis risk — urgent action required.",
    }[risk_level]

    return f"{prefix} " + " ".join(lines)


def _compute_shap(df_scaled: pd.DataFrame) -> dict:
    """Return per-feature SHAP contribution for the predicted class."""
    if _shap_explainer is None:
        return {f: 0.0 for f in FEATURE_NAMES}
    try:
        sv = _shap_explainer.shap_values(df_scaled)
        # sv shape: (n_classes, n_samples, n_features)  OR  (n_samples, n_features)
        if isinstance(sv, list):
            # Multi-class tree SHAP returns list of arrays per class
            # Pick values for the predicted class by using mean abs across classes for display
            mean_abs = np.mean([np.abs(c[0]) for c in sv], axis=0)
            return {feat: round(float(val), 6) for feat, val in zip(FEATURE_NAMES, mean_abs)}
        else:
            return {feat: round(float(val), 6) for feat, val in zip(FEATURE_NAMES, sv[0])}
    except Exception as exc:
        logger.warning("SHAP computation failed: %s", exc)
        return {f: 0.0 for f in FEATURE_NAMES}


def _single_predict(req: PredictionRequest) -> PredictionResponse:
    """Run prediction pipeline for a single request."""
    if not _model_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run generate_and_train.py and restart the service.",
        )

    df_scaled = _request_to_df(req)
    model = _model_bundle["model"]

    proba = model.predict_proba(df_scaled)[0]  # shape: (3,)
    risk_score = int(np.argmax(proba))
    risk_level = RISK_LABELS[risk_score]
    confidence = round(float(proba[risk_score]), 4)

    probabilities = {
        "LOW": round(float(proba[0]), 4),
        "MEDIUM": round(float(proba[1]), 4),
        "HIGH": round(float(proba[2]), 4),
    }

    shap_dict = _compute_shap(df_scaled)
    explanation = _build_explanation(req, shap_dict, risk_level)
    actions = ACTIONS[risk_level]
    timestamp = datetime.now(timezone.utc).isoformat()

    return PredictionResponse(
        cattle_id=req.cattle_id,
        risk_level=risk_level,
        risk_score=risk_score,
        confidence=confidence,
        probabilities=probabilities,
        explanation=explanation,
        recommended_actions=actions,
        shap_values=shap_dict,
        timestamp=timestamp,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health():
    """Service health check."""
    return {
        "status": "ok",
        "model_loaded": _model_loaded,
        "version": VERSION,
        "metadata": _model_bundle.get("metadata", {}) if _model_loaded else {},
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(req: PredictionRequest):
    """
    Predict bovine mastitis risk for a single cow.

    Returns risk level (LOW / MEDIUM / HIGH), confidence, SHAP explanations,
    and veterinary action recommendations.
    """
    try:
        return _single_predict(req)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Prediction error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


@app.post("/batch-predict", response_model=List[PredictionResponse], tags=["Prediction"])
async def batch_predict(requests: List[PredictionRequest]):
    """
    Predict mastitis risk for a batch of cows in a single call.

    Returns a list of PredictionResponse objects, one per input record.
    """
    if not requests:
        raise HTTPException(status_code=400, detail="Request list must not be empty.")
    if len(requests) > 500:
        raise HTTPException(status_code=400, detail="Batch size must not exceed 500.")

    results: List[PredictionResponse] = []
    errors: List[str] = []

    for i, req in enumerate(requests):
        try:
            results.append(_single_predict(req))
        except HTTPException as exc:
            errors.append(f"Record {i} ({req.cattle_id}): {exc.detail}")
            raise
        except Exception as exc:
            logger.exception("Batch prediction error at index %d: %s", i, exc)
            errors.append(f"Record {i} ({req.cattle_id}): {exc}")

    if errors and not results:
        raise HTTPException(status_code=500, detail="; ".join(errors))

    return results


@app.get("/feature-importance", tags=["Model Info"])
async def feature_importance():
    """
    Return global feature importance derived from SHAP values computed at training time.
    Also includes XGBoost's native feature importance (weight / gain / cover).
    """
    if not _model_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded.")

    metadata = _model_bundle.get("metadata", {})
    shap_importance = metadata.get("global_shap_importance", {})

    model = _model_bundle["model"]
    xgb_importance_weight = {
        k: round(float(v), 6)
        for k, v in model.get_booster().get_fscore().items()
    }

    # Also get gain-based importance
    try:
        gain_scores = model.get_booster().get_score(importance_type="gain")
        xgb_importance_gain = {k: round(float(v), 6) for k, v in gain_scores.items()}
    except Exception:
        xgb_importance_gain = {}

    # Rank by SHAP importance
    ranked = sorted(shap_importance.items(), key=lambda x: -x[1])

    return {
        "feature_importance_shap": {k: round(v, 6) for k, v in ranked},
        "feature_importance_xgb_weight": xgb_importance_weight,
        "feature_importance_xgb_gain": xgb_importance_gain,
        "feature_names": FEATURE_NAMES,
        "model_version": metadata.get("version", "unknown"),
        "accuracy_xgb": metadata.get("accuracy_xgb"),
    }


# ---------------------------------------------------------------------------
# Dev entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
