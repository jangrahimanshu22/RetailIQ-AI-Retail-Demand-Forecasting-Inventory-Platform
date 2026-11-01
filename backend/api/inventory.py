"""
inventory.py
API router for Inventory Optimization Engine: safety stock, reorder point,
restock quantities, and risk classifications (Critical, Low Stock, Healthy, Overstock).
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from typing import Optional
import pandas as pd
import numpy as np

from backend.services.data_manager import data_manager, MODEL_DIR
from forecasting.forecast import load_artifacts, recursive_forecast
from utils.inventory_engine import compute_recommendations

router = APIRouter(prefix="/api/inventory", tags=["Inventory Optimization"])

@router.get("/recommendations")
def get_inventory_recommendations(
    lead_time_days: int = Query(7, ge=1, le=60),
    service_level: float = Query(0.95, ge=0.80, le=0.999),
    filter_alert: Optional[str] = Query(None, pattern="^(ALL|STOCKOUT RISK|REORDER SOON|OK|OVERSTOCK WARNING)$"),
    search: Optional[str] = None
):
    clean_df = data_manager.get_clean_df()
    feat_df = data_manager.get_feature_df()
    if clean_df.empty:
        raise HTTPException(status_code=400, detail="Clean dataset is required. Please run Data Cleaning.")

    # Service level Z-score mapping
    z_map = {0.80: 1.28, 0.85: 1.44, 0.90: 1.64, 0.95: 1.65, 0.98: 2.05, 0.99: 2.33}
    service_z = z_map.get(round(service_level, 2), 1.65)

    # Use model forecasts if available, else derive 30-day forecast baseline from recent trend
    has_model = (MODEL_DIR / "best_model.pkl").exists() and not feat_df.empty
    
    # We generate/aggregate inventory recommendations for all product/store pairs
    pairs = clean_df[["Product_ID", "Store_ID"]].drop_duplicates()
    
    recs = []
    # If model exists, generate quick batch forecast or baseline
    if has_model:
        try:
            model, feature_cols = load_artifacts()
        except Exception:
            has_model = False

    for _, row in pairs.iterrows():
        pid, sid = str(row["Product_ID"]), str(row["Store_ID"])
        hist = clean_df[(clean_df["Product_ID"] == pid) & (clean_df["Store_ID"] == sid)].sort_values("Date")
        if hist.empty:
            continue

        avg_daily_demand = float(hist["Sales_Quantity"].mean())
        std_daily_demand = float(hist["Sales_Quantity"].std()) if len(hist) > 1 else avg_daily_demand * 0.2
        if pd.isna(std_daily_demand):
            std_daily_demand = avg_daily_demand * 0.2

        current_inventory = float(hist.iloc[-1]["Inventory_Level"]) if "Inventory_Level" in hist.columns else 0.0

        safety_stock = round(service_z * std_daily_demand * np.sqrt(lead_time_days), 1)
        reorder_point = round(avg_daily_demand * lead_time_days + safety_stock, 1)

        # 30-day horizon forecast
        forecast_horizon_demand = round(avg_daily_demand * 30, 1)
        restock_qty = max(0.0, round(forecast_horizon_demand - current_inventory + safety_stock, 1))

        # Alert level
        if current_inventory < reorder_point * 0.5:
            alert = "STOCKOUT RISK"
            status_badge = "Critical"
        elif current_inventory < reorder_point:
            alert = "REORDER SOON"
            status_badge = "Low Stock"
        elif current_inventory > forecast_horizon_demand * 2.5:
            alert = "OVERSTOCK WARNING"
            status_badge = "Overstock"
        else:
            alert = "OK"
            status_badge = "Healthy"

        # Product name and Category if available
        p_name = str(hist.iloc[-1]["Product_Name"]) if "Product_Name" in hist.columns else pid
        category = str(hist.iloc[-1]["Category"]) if "Category" in hist.columns else "General"
        location = str(hist.iloc[-1]["Store_Location"]) if "Store_Location" in hist.columns else sid

        recs.append({
            "Product_ID": pid,
            "Product_Name": p_name,
            "Category": category,
            "Store_ID": sid,
            "Store_Location": location,
            "Current_Inventory": round(current_inventory, 1),
            "Avg_Daily_Demand": round(avg_daily_demand, 2),
            "Forecast_Demand_30d": forecast_horizon_demand,
            "Safety_Stock": safety_stock,
            "Reorder_Point": reorder_point,
            "Recommended_Restock_Qty": restock_qty,
            "Alert": alert,
            "Status": status_badge
        })

    recs_df = pd.DataFrame(recs)
    if recs_df.empty:
        return {"summary": {}, "items": []}

    # Summary counts
    summary = {
        "total_sku_locations": len(recs_df),
        "critical_count": int((recs_df["Status"] == "Critical").sum()),
        "low_stock_count": int((recs_df["Status"] == "Low Stock").sum()),
        "healthy_count": int((recs_df["Status"] == "Healthy").sum()),
        "overstock_count": int((recs_df["Status"] == "Overstock").sum()),
        "total_recommended_restock": round(float(recs_df["Recommended_Restock_Qty"].sum()), 1),
    }

    # Filter
    filtered = recs_df
    if filter_alert and filter_alert != "ALL":
        filtered = filtered[filtered["Alert"] == filter_alert]

    if search:
        s_lower = search.strip().lower()
        mask = (
            filtered["Product_ID"].str.lower().str.contains(s_lower) |
            filtered["Product_Name"].str.lower().str.contains(s_lower) |
            filtered["Store_ID"].str.lower().str.contains(s_lower) |
            filtered["Category"].str.lower().str.contains(s_lower)
        )
        filtered = filtered[mask]

    return {
        "summary": summary,
        "items": filtered.to_dict(orient="records")
    }

@router.get("/download")
def download_inventory_csv(
    lead_time_days: int = 7,
    service_level: float = 0.95
):
    res = get_inventory_recommendations(lead_time_days=lead_time_days, service_level=service_level)
    df = pd.DataFrame(res["items"])
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_recommendations.csv"}
    )
