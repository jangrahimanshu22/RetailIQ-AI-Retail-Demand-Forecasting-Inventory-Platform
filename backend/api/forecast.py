"""
forecast.py
API router for Demand Forecasting using trained regression models.
Generates multi-horizon recursive forecasts with confidence intervals and demand summaries.
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from typing import Optional
import pandas as pd
import numpy as np
import io

from backend.services.data_manager import data_manager, MODEL_DIR
from forecasting.forecast import load_artifacts, recursive_forecast, HORIZONS

router = APIRouter(prefix="/api/forecast", tags=["Demand Forecasting"])

@router.get("/options")
def get_forecast_options():
    feat_df = data_manager.get_feature_df()
    if feat_df.empty:
        feat_df = data_manager.get_clean_df()

    if feat_df.empty:
        return {"products": [], "stores": [], "horizons": list(HORIZONS.keys())}

    products = []
    if "Product_ID" in feat_df.columns:
        if "Product_Name" in feat_df.columns:
            prod_pairs = feat_df[["Product_ID", "Product_Name"]].drop_duplicates().sort_values("Product_ID")
            products = [{"id": str(r["Product_ID"]), "name": f"{r['Product_ID']} - {r['Product_Name']}"} for _, r in prod_pairs.iterrows()]
        else:
            products = [{"id": str(p), "name": str(p)} for p in sorted(feat_df["Product_ID"].dropna().unique())]

    stores = []
    if "Store_ID" in feat_df.columns:
        if "Store_Location" in feat_df.columns:
            store_pairs = feat_df[["Store_ID", "Store_Location"]].drop_duplicates().sort_values("Store_ID")
            stores = [{"id": str(r["Store_ID"]), "name": f"{r['Store_ID']} ({r['Store_Location']})"} for _, r in store_pairs.iterrows()]
        else:
            stores = [{"id": str(s), "name": str(s)} for s in sorted(feat_df["Store_ID"].dropna().unique())]

    return {
        "products": products,
        "stores": stores,
        "horizons": list(HORIZONS.keys()),
        "has_model": (MODEL_DIR / "best_model.pkl").exists()
    }

@router.get("/generate")
def generate_demand_forecast(
    product_id: str = Query(..., description="Product ID e.g. P001"),
    store_id: str = Query(..., description="Store ID e.g. S01"),
    horizon: str = Query("30 Days", description="Horizon: '7 Days', '30 Days', '90 Days', '6 Months', '1 Year'")
):
    if not (MODEL_DIR / "best_model.pkl").exists():
        raise HTTPException(status_code=400, detail="No trained model found. Please train models first in Model Training.")

    horizon_days = HORIZONS.get(horizon, 30)

    feat_df = data_manager.get_feature_df()
    if feat_df.empty:
        raise HTTPException(status_code=400, detail="Feature dataset not available. Please run model training first.")

    try:
        model, feature_cols = load_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model artifacts: {str(e)}")

    try:
        fc = recursive_forecast(feat_df, model, feature_cols, product_id, store_id, horizon_days)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecasting error: {str(e)}")

    # Get historical segment for this product-store for context (last 60 days)
    hist_sub = feat_df[(feat_df["Product_ID"] == product_id) & (feat_df["Store_ID"] == store_id)].sort_values("Date")
    hist_tail = hist_sub.tail(60).copy()

    history_chart = []
    for _, row in hist_tail.iterrows():
        d_str = str(row["Date"])[:10]
        actual = float(row["Sales_Quantity"])
        history_chart.append({
            "date": d_str,
            "actual": round(actual, 1),
            "predicted": None,
            "lower_bound": None,
            "upper_bound": None,
            "type": "Historical"
        })

    # Estimate residual standard deviation for confidence interval (95% CI = +/- 1.96 * std_err)
    hist_std = float(hist_tail["Sales_Quantity"].std()) if len(hist_tail) > 1 else 3.0
    if pd.isna(hist_std) or hist_std <= 0:
        hist_std = 2.5

    forecast_chart = []
    for i, row in fc.iterrows():
        d_str = str(row["Date"])[:10]
        pred = float(row["Predicted_Sales_Quantity"])
        # Interval expands slightly further into the horizon
        uncertainty = hist_std * (1.0 + 0.015 * i)
        lower_bound = max(0.0, round(pred - 1.96 * uncertainty, 1))
        upper_bound = round(pred + 1.96 * uncertainty, 1)

        forecast_chart.append({
            "date": d_str,
            "actual": None,
            "predicted": round(pred, 1),
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "type": "Forecast"
        })

    # Combined timeline
    combined_timeline = history_chart + forecast_chart

    # Summary metrics
    preds_array = fc["Predicted_Sales_Quantity"].values
    total_forecast_demand = float(np.sum(preds_array))
    avg_daily_forecast = float(np.mean(preds_array))
    peak_idx = int(np.argmax(preds_array))
    peak_date = str(fc.iloc[peak_idx]["Date"])
    peak_demand = float(preds_array[peak_idx])

    # Prior equivalent historical period comparison
    prior_days = min(len(hist_sub), horizon_days)
    if prior_days > 0:
        prior_sum = float(hist_sub.tail(prior_days)["Sales_Quantity"].sum())
        growth_pct = round(((total_forecast_demand - prior_sum) / prior_sum) * 100, 2) if prior_sum > 0 else 0.0
    else:
        growth_pct = 0.0

    # Stock requirements (demand + 15% safety buffer)
    predicted_stock_requirement = int(np.ceil(total_forecast_demand * 1.15))

    return {
        "product_id": product_id,
        "store_id": store_id,
        "horizon": horizon,
        "horizon_days": horizon_days,
        "summary": {
            "total_demand": round(total_forecast_demand, 1),
            "avg_daily_demand": round(avg_daily_forecast, 2),
            "growth_percentage": growth_pct,
            "peak_date": peak_date,
            "peak_demand": round(peak_demand, 1),
            "stock_requirement": predicted_stock_requirement
        },
        "forecast_table": fc.to_dict(orient="records"),
        "chart_data": combined_timeline
    }

@router.get("/download")
def download_forecast_csv(
    product_id: str,
    store_id: str,
    horizon: str = "30 Days"
):
    horizon_days = HORIZONS.get(horizon, 30)
    feat_df = data_manager.get_feature_df()
    if feat_df.empty or not (MODEL_DIR / "best_model.pkl").exists():
        raise HTTPException(status_code=400, detail="Cannot generate forecast for download.")

    model, feature_cols = load_artifacts()
    fc = recursive_forecast(feat_df, model, feature_cols, product_id, store_id, horizon_days)
    
    csv_bytes = fc.to_csv(index=False).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=forecast_{product_id}_{store_id}_{horizon_days}d.csv"}
    )
