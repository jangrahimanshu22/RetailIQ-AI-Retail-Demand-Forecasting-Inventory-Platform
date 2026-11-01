"""
api.py — FastAPI backend for real-time and batch demand predictions.
Run: uvicorn deployment.api:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path
import joblib
import pandas as pd
import sys

sys.path.append(str(Path(__file__).resolve().parent.parent))
from forecasting.forecast import recursive_forecast, HORIZONS

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

app = FastAPI(title="Retail Demand Forecasting API", version="1.0")


class ForecastRequest(BaseModel):
    product_id: str
    store_id: str
    horizon: str = "30 Days"   # one of HORIZONS keys


class BatchForecastRequest(BaseModel):
    requests: list[ForecastRequest]


def _load():
    model = joblib.load(MODEL_DIR / "best_model.pkl")
    feature_cols = joblib.load(MODEL_DIR / "feature_columns.pkl")
    history = pd.read_csv(DATA_DIR / "retail_sales_features.csv")
    return model, feature_cols, history


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: ForecastRequest):
    if req.horizon not in HORIZONS:
        raise HTTPException(400, f"horizon must be one of {list(HORIZONS.keys())}")
    model, feature_cols, history = _load()
    try:
        fc = recursive_forecast(history, model, feature_cols, req.product_id,
                                 req.store_id, HORIZONS[req.horizon])
    except ValueError as e:
        raise HTTPException(404, str(e))
    return fc.to_dict(orient="records")


@app.post("/predict/batch")
def predict_batch(req: BatchForecastRequest):
    model, feature_cols, history = _load()
    results = {}
    for item in req.requests:
        key = f"{item.product_id}_{item.store_id}"
        try:
            fc = recursive_forecast(history, model, feature_cols, item.product_id,
                                     item.store_id, HORIZONS.get(item.horizon, 30))
            results[key] = fc.to_dict(orient="records")
        except ValueError:
            results[key] = None
    return results
