# server.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import io
import pickle
import pandas as pd
import numpy as np
from typing import List, Optional

# === Model dosya yollarını buraya koy ===
MODEL_PATH1 = "random_forest_kepler_model.pkl"    # Örn: Kepler modeli
MODEL_PATH2 = "tess_random_forest_model.pkl"  # Örn: TESS modeli (varsa)

app = FastAPI(title="Exoplanet Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _load_model(path: str):
    if not path:
        return None
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        # Yol boş değilse ama yüklenemiyorsa fail edelim ki gizli hatalar kalmasın
        raise RuntimeError(f"Model yüklenemedi ({path}): {e}")

# Modeller (en az bir tanesi olmalı)
MODEL_1 = _load_model(MODEL_PATH1)
MODEL_2 = _load_model(MODEL_PATH2) if MODEL_PATH2 else None
MODELS = [m for m in [MODEL_1, MODEL_2] if m is not None]
if len(MODELS) == 0:
    raise RuntimeError("Hiç model yüklenemedi. Lütfen MODEL_PATH1/2 dosyalarını kontrol edin.")

def _as_probability(model, X: np.ndarray) -> np.ndarray:
    """Model türüne göre olasılık çıkar (ikili sınıflandırma varsayımı)."""
    # predict_proba varsa: pozitif sınıfın (class 1) olasılığı
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        if isinstance(proba, list):
            proba = proba[0]
        proba = np.asarray(proba)
        # İkili sınıflandırmada sütun sayısı 2 olur; değilse en yüksek sınıfı alırız
        if proba.ndim == 2 and proba.shape[1] >= 2:
            return proba[:, 1]
        else:
            # Tek kolonlu ya da beklenmedik: güvenli düşüş
            return proba.ravel().astype(float)

    # decision_function varsa: min-max ile [0,1] ölçekle
    if hasattr(model, "decision_function"):
        s = model.decision_function(X).astype(float)
        s_min, s_max = s.min(), s.max()
        return (s - s_min) / (s_max - s_min + 1e-9)

    # Aksi takdirde predict -> [0,1] varsayımı
    y = model.predict(X).astype(float)
    # Eğer model 0/1 dönmüyorsa yine de [0,1] aralığına sıkıştır
    y_min, y_max = y.min(), y.max()
    if y_max - y_min > 1e-9:
        y = (y - y_min) / (y_max - y_min)
    return y

def _pick_features_for_model(df: pd.DataFrame, model) -> List[str]:
    """
    Her modelin kendi beklediği kolonlarını yakala; yoksa makul varsayılanları kullan.
    Bu sayede modeller farklı feature set'leriyle eğitilmiş olsa bile çalışır.
    """
    model_feats = getattr(model, "feature_names_in_", None)
    if model_feats is not None:
        feats = [c for c in model_feats if c in df.columns]
        if len(feats) >= 1:
            return feats

    # Ortak adaylar (Kepler/TESS benzeri transit verileri için makul kolon isimleri)
    candidates = [
        "st_teff", "st_logg", "st_rad",
        "st_dist", "pl_orbper", "pl_trandurh",
        "pl_trandep", "pl_rade", "pl_insool", "pl_eqt", "Rp_Rs"
    ]
    feats = [c for c in candidates if c in df.columns]
    return feats

def _ensure_matrix(df: pd.DataFrame, feats: List[str]) -> np.ndarray:
    """Seçili kolonları sayısallaştır, NaN'leri doldur ve float matris döndür."""
    X = df[feats].apply(pd.to_numeric, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    return X

def _borda_aggregate(prob_list: List[np.ndarray]) -> np.ndarray:
    """
    Borda: Her model, örnekleri kendi olasılığına göre (yüksek->iyi) sıralar.
    n örnek için puanlar n-1 ... 0 dağıtılır; modeller arası toplanır ve [0,1] ölçeklenir.
    """
    if len(prob_list) == 1:
        return prob_list[0]  # Tek model varsa doğrudan dön

    n = prob_list[0].shape[0]
    if n == 0:
        return prob_list[0]

    scores = np.zeros(n, dtype=float)
    for probs in prob_list:
        # Büyük olasılık -> yüksek sıra
        order = np.argsort(-probs)  # azalan
        # Borda puanı: en yüksek olasılık n-1, en düşük 0
        borda_for_model = np.zeros(n, dtype=float)
        for rank, idx in enumerate(order):
            borda_for_model[idx] = (n - 1 - rank)
        scores += borda_for_model

    # Maks puan: model_sayısı * (n-1)
    denom = len(prob_list) * max(n - 1, 1)
    return scores / denom

def _mean_aggregate(prob_list: List[np.ndarray]) -> np.ndarray:
    return np.mean(np.vstack(prob_list), axis=0)

def _vote_aggregate(prob_list: List[np.ndarray], threshold: float) -> np.ndarray:
    """Çoğunluk oyu: her model thresholde göre 0/1 oy verir → ortalama oy."""
    votes = [(p >= threshold).astype(int) for p in prob_list]
    return np.mean(np.vstack(votes), axis=0)

@app.get("/")
def root():
    return {"ok": True, "models_loaded": len(MODELS)}

@app.get("/health")
def health():
    return {"status": "healthy", "models_loaded": len(MODELS)}

@app.post("/predict-csv")
async def predict_csv(
    file: UploadFile = File(...),
    threshold: float = 0.5,
    method: str = Query("borda", pattern="^(borda|mean|vote)$")  # 'borda' | 'mean' | 'vote'
):
    # --- Dosya kontrolü ---
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Lütfen .csv dosyası yükleyin.")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {e}")

    if df.shape[0] == 0:
        raise HTTPException(status_code=400, detail="CSV boş görünüyor.")

    # --- Her model için uygun feature set'i seç ve olasılıkları hesapla ---
    probs_all_models: List[np.ndarray] = []
    features_used_per_model: List[List[str]] = []

    for i, model in enumerate(MODELS, start=1):
        feats = _pick_features_for_model(df, model)
        if len(feats) == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Model {i} için uygun özellik bulunamadı. CSV içinde şunlardan bazıları olmalı: "
                    "depth_ppm, transit_depth, snr, planet_radius, orbital_period, duration_hours, duration, period"
                ),
            )
        X = _ensure_matrix(df, feats)
        p = _as_probability(model, X)
        if p.ndim > 1:
            p = p.ravel()
        probs_all_models.append(p.astype(float))
        features_used_per_model.append(feats)

    # --- Birleştirme (ensemble) ---
    if method == "borda":
        combined = _borda_aggregate(probs_all_models)
    elif method == "mean":
        combined = _mean_aggregate(probs_all_models)
    elif method == "vote":
        combined = _vote_aggregate(probs_all_models, float(threshold))
    else:
        raise HTTPException(status_code=400, detail="Geçersiz method parametresi.")

    # Güvenlik: [0,1] aralığına sıkıştır
    combined = np.clip(combined, 0.0, 1.0)

    preds = (combined >= float(threshold)).astype(int)

    rows = [
        {
            "i": int(i),
            "prob": float(combined[i]),
            "label": int(preds[i]),
            # İstersen model başına olasılıkları da göster:
            "models": {f"m{j+1}": float(probs_all_models[j][i]) for j in range(len(probs_all_models))}
        }
        for i in range(len(combined))
    ]

    summary = {
        "n": int(len(rows)),
        "positives": int(preds.sum()),
        "negatives": int((preds == 0).sum()),
        "threshold": float(threshold),
        "method": method,
        "models_loaded": len(MODELS),
        "features_used_per_model": features_used_per_model,
    }

    return {"summary": summary, "rows": rows}
