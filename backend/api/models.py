"""
models.py
API router for Machine Learning model training, comparison across 7 regression algorithms,
feature importance, and evaluation metrics.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
import pandas as pd
import numpy as np
import json
import joblib
from pathlib import Path

from backend.services.data_manager import data_manager, MODEL_DIR, DATA_DIR
from training.train_models import train_and_compare, load_features
from feature_engineering.build_features import build_feature_pipeline

router = APIRouter(prefix="/api/models", tags=["Model Training & Comparison"])

# In-memory training status tracker
training_state = {
    "is_training": False,
    "progress": 0,
    "current_model": "",
    "status": "idle",
    "error": None
}

@router.get("/status")
def get_training_status():
    return training_state

@router.get("/comparison")
def get_model_comparison():
    comp_file = MODEL_DIR / "model_comparison.csv"
    info_file = MODEL_DIR / "best_model_info.json"

    if not comp_file.exists():
        return {
            "has_models": False,
            "models": [],
            "best_model": None,
            "metrics": None
        }

    df = pd.read_csv(comp_file)
    best_info = {}
    if info_file.exists():
        try:
            with open(info_file, "r") as f:
                best_info = json.load(f)
        except Exception:
            pass

    # Sort by RMSE ascending (best first)
    df = df.sort_values("RMSE", ascending=True)
    models_list = df.to_dict(orient="records")

    return {
        "has_models": True,
        "models": models_list,
        "best_model": best_info.get("best_model", models_list[0]["Model"] if models_list else "LightGBM"),
        "best_metrics": best_info.get("metrics", models_list[0] if models_list else {}),
        "total_models": len(models_list)
    }

@router.post("/train")
def train_all_models():
    """
    Executes feature engineering and trains all 7 regression models synchronously.
    """
    global training_state
    if training_state["is_training"]:
        raise HTTPException(status_code=400, detail="Model training is already in progress.")

    training_state["is_training"] = True
    training_state["progress"] = 10
    training_state["status"] = "Generating feature pipeline..."
    training_state["error"] = None

    try:
        clean_df = data_manager.get_clean_df()
        if clean_df.empty:
            training_state["is_training"] = False
            raise HTTPException(status_code=400, detail="Cleaned dataset not found. Run Data Cleaning first.")

        # Step 1: Feature Engineering
        training_state["progress"] = 25
        training_state["status"] = "Creating lag, rolling & categorical features..."
        featured_df, _ = build_feature_pipeline(clean_df)
        data_manager.set_feature_df(featured_df)

        # Step 2: Training 7 regression models
        training_state["progress"] = 50
        training_state["status"] = "Training 7 regression models with time-series CV..."

        # Load features formatted for training
        feat_path = data_manager.feature_path
        train_features_df = load_features(str(feat_path))

        results_df, best_name, best_model, feature_cols = train_and_compare(train_features_df)

        training_state["progress"] = 100
        training_state["status"] = f"Training completed. Best model: {best_name}"
        training_state["is_training"] = False

        models_list = results_df.to_dict(orient="records")

        return {
            "status": "success",
            "message": f"Successfully trained 7 models. Best model: {best_name}",
            "best_model": best_name,
            "models": models_list,
            "feature_columns": feature_cols
        }

    except Exception as e:
        training_state["is_training"] = False
        training_state["status"] = "Failed"
        training_state["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.get("/feature_importance")
def get_feature_importance():
    model_path = MODEL_DIR / "best_model.pkl"
    cols_path = MODEL_DIR / "feature_columns.pkl"

    if not model_path.exists() or not cols_path.exists():
        return {"features": []}

    try:
        model = joblib.load(model_path)
        feature_cols = joblib.load(cols_path)

        importances = None
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_)

        if importances is not None:
            # Normalize to sum 100%
            total = np.sum(importances)
            if total > 0:
                normalized = (importances / total) * 100
            else:
                normalized = importances

            df = pd.DataFrame({
                "feature": feature_cols,
                "importance": np.round(normalized, 2)
            }).sort_values("importance", ascending=False).head(15)

            return {"features": df.to_dict(orient="records")}
    except Exception as e:
        return {"features": [], "error": str(e)}

    return {"features": []}
