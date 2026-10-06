"""
NASA Space Apps Challenge 2025
A World Away – Hunting for Exoplanets with AI
Backend API: Exoplanet Predictor (FastAPI)

Bu sunucu, Kepler ve TESS verilerinden eğitilmiş yapay zekâ modelleriyle 
ötegezegen tespiti yapar. Kullanıcılar .csv dosyası yükleyerek olasılık tahmini alabilir.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import io
import pickle
import gzip
import pandas as pd
import numpy as np
from typing import List, Optional

# ==== MODEL YOLLARI ====
MODEL_PATH1 = "random_forest_kepler_model.pkl"
MODEL_PATH2 = "tess_random_forest_model.pkl"

# ==== ÖZELLİK LİSTESİ ====
CANDIDATE_FEATURES = [
    "st_teff", "st_logg", "st_rad",
    "st_dist", "pl_orbper", "pl_trandurh", "pl_trandep",
    "pl_rade", "pl_insool", "pl_eqt", "Rp_Rs"
]

# ==== UYGULAMA ====
app = FastAPI(
    title="Exoplanet Predictor API",
    description="Kepler ve TESS verilerinden ötegezegen tahmini yapan API.",
    version="1.0.0"
)

# ==== CORS ====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== MODEL YÜKLEYİCİ ====
try:
    import joblib
except Exception:
    joblib = None

try:
    import cloudpickle
except Exception:
    cloudpickle = None


def _load_model(path: str):
    """Modeli esnek biçimde yükler (joblib / cloudpickle / pickle)."""
    if not path:
        return None

    for loader in (joblib, cloudpickle, pickle):
        if loader is None:
            continue
        try:
            with open(path, "rb") as f:
                return loader.load(f)
        except Exception:
            # Gzip sıkıştırmalı dosyaları da dene
            try:
                with gzip.open(path, "rb") as f:
                    return loader.load(f)
            except Exception:
                pass

    raise RuntimeError(f"Model yüklenemedi: {path}")


# ==== MODEL CACHE ====
MODELS: Optional[List[object]] = None


def _ensure_models_loaded():
    """İlk istek geldiğinde modelleri yükler."""
    global MODELS
    if MODELS is None:
        m1 = _load_model(MODEL_PATH1) if MODEL_PATH1 else None
        m2 = _load_model(MODEL_PATH2) if MODEL_PATH2 else None
        MODELS = [m for m in (m1, m2) if m is not None]
        if not MODELS:
            raise RuntimeError("Hiç model yüklenemedi. MODEL_PATH1/2 yollarını kontrol edin.")


# ==== MODEL HESAPLAMA ====
def _as_probability(model, X: np.ndarray) -> np.ndarray:
    """Model tipine göre [0,1] aralığında olasılık üretir."""
    if hasattr(model, "predict_proba"):
        proba = np.asarray(model.predict_proba(X))
        return proba[:, 1] if proba.ndim == 2 else proba.ravel()

    if hasattr(model, "decision_function"):
        s = model.decision_function(X)
        return (s - s.min()) / (s.max() - s.min() + 1e-9)

    y = model.predict(X).astype(float)
    return (y - y.min()) / (y.max() - y.min() + 1e-9)


def _pick_features_for_model(df: pd.DataFrame, model) -> List[str]:
    """Modelin beklediği kolonları bulur."""
    feats = getattr(model, "feature_names_in_", None)
    if feats is not None:
        feats = [c for c in feats if c in df.columns]
        if feats:
            return feats
    return [c for c in CANDIDATE_FEATURES if c in df.columns]


def _ensure_matrix(df: pd.DataFrame, feats: List[str]) -> np.ndarray:
    """DataFrame’i modele uygun matris haline getirir."""
    return df[feats].apply(pd.to_numeric, errors="coerce").fillna(0.0).to_numpy()


def _mean_aggregate(prob_list: List[np.ndarray]) -> np.ndarray:
    """Modellerin ortalama olasılığını alır."""
    return np.mean(np.vstack(prob_list), axis=0)


# ==== ROUTES ====
@app.get("/")
def root():
    """API'nin genel bilgilerini döner."""
    try:
        _ensure_models_loaded()
        return {"ok": True, "models_loaded": len(MODELS)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/health")
def health():
    """Sağlık durumu (API ayakta mı?)"""
    try:
        _ensure_models_loaded()
        return {"status": "healthy", "models_loaded": len(MODELS)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.post("/predict-csv")
async def predict_csv(
    file: UploadFile = File(..., description=".csv formatında veri dosyası"),
    threshold: float = 0.5,
    method: str = Query("mean", pattern="^(mean)$", description="Model birleştirme yöntemi: mean (ortalama)")
):
    """
    CSV dosyası yükleyin, her satır için gezegen olasılığını tahmin edin.
    """
    _ensure_models_loaded()

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Lütfen .csv dosyası yükleyin.")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV boş görünüyor.")

    # Her model için olasılıkları hesapla
    probs_all_models = []
    features_used_per_model = []

    for model in MODELS:
        feats = _pick_features_for_model(df, model)
        if not feats:
            raise HTTPException(status_code=400, detail="Uygun kolon bulunamadı.")
        X = _ensure_matrix(df, feats)
        p = _as_probability(model, X)
        probs_all_models.append(p)
        features_used_per_model.append(feats)

    combined = _mean_aggregate(probs_all_models)
    combined = np.clip(combined, 0, 1)
    preds = (combined >= threshold).astype(int)

    # Sonuçları JSON formatında döndür
    results = [
        {"id": i, "probability": float(combined[i]), "prediction": int(preds[i])}
        for i in range(len(combined))
    ]

    summary = {
        "total_rows": len(results),
        "positives": int(preds.sum()),
        "negatives": int((preds == 0).sum()),
        "threshold": threshold,
        "models_loaded": len(MODELS),
        "features_used_per_model": features_used_per_model,
    }

    return {"summary": summary, "results": results}
