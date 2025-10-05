from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import pickle
import pandas as pd
import numpy as np

MODEL_PATH = "flexible_exoplanet_model.pkl"

app = FastAPI(title="Exoplanet Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    with open(MODEL_PATH, "rb") as f:
        MODEL = pickle.load(f)
except Exception as e:
    raise RuntimeError(f"Model yüklenemedi: {e}")

def _as_probability(model, X: np.ndarray) -> np.ndarray:
    """Model türüne göre olasılık çıkar."""
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        if isinstance(proba, list):  
            proba = proba[0]
        return np.asarray(proba)[:, 1]
    if hasattr(model, "decision_function"):
        s = model.decision_function(X).astype(float)
        s_min, s_max = s.min(), s.max()
        return (s - s_min) / (s_max - s_min + 1e-9)
    y = model.predict(X).astype(float)
    return y

def _pick_features(df: pd.DataFrame) -> list[str]:
    """Modelin beklediği kolonları yakala; yoksa makul varsayılanlar kullan."""
    model_feats = getattr(MODEL, "feature_names_in_", None)
    if model_feats is not None:
        feats = [c for c in model_feats if c in df.columns]
        if len(feats) >= 1:
            return feats

    candidates = [
        "depth_ppm", "transit_depth", "depth",
        "snr", "planet_radius", "orbital_period",
        "duration_hours", "duration", "period",
    ]
    feats = [c for c in candidates if c in df.columns]
    return feats

@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...), threshold: float = 0.5):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Lütfen .csv dosyası yükleyin.")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {e}")

    feats = _pick_features(df)
    if len(feats) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uygun özellik bulunamadı. CSV içinde şunlardan en az birkaçından biri olmalı: "
                   "depth_ppm, transit_depth, snr, planet_radius, orbital_period, duration_hours, duration, period"
        )

    X = df[feats].apply(pd.to_numeric, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    if X.shape[0] == 0:
        raise HTTPException(status_code=400, detail="CSV boş görünüyor.")

    probs = _as_probability(MODEL, X)
    if probs.ndim > 1:
        probs = probs.ravel()

    preds = (probs >= float(threshold)).astype(int)

    rows = [
        {"i": int(i), "prob": float(probs[i]), "label": int(preds[i])}
        for i in range(len(probs))
    ]
    summary = {
        "n": int(len(rows)),
        "positives": int(preds.sum()),
        "negatives": int((preds == 0).sum()),
        "threshold": float(threshold),
        "features_used": feats,
    }
    return {"summary": summary, "rows": rows}
