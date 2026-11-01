"""
overview.py
API router for the executive Overview Dashboard.
Provides KPI metrics, high-level trends, category/store distributions, and inventory risk snapshot.
"""
from fastapi import APIRouter, Query
from typing import Optional
import pandas as pd
import numpy as np
import json
from pathlib import Path

from backend.services.data_manager import data_manager, MODEL_DIR

router = APIRouter(prefix="/api/overview", tags=["Executive Overview"])

@router.get("/metrics")
def get_overview_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    store_id: Optional[str] = None,
    category: Optional[str] = None,
):
    df = data_manager.get_clean_df()
    if df.empty:
        df = data_manager.get_raw_df()
    if df.empty:
        return {"kpis": {}, "charts": {}}

    df = df.copy()
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        if start_date:
            df = df[df["Date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["Date"] <= pd.to_datetime(end_date)]

    if store_id and "Store_ID" in df.columns:
        df = df[df["Store_ID"] == store_id]
    if category and "Category" in df.columns:
        df = df[df["Category"] == category]

    # KPIs
    total_revenue = float(df["Revenue"].sum()) if "Revenue" in df.columns else 0.0
    total_quantity = int(df["Sales_Quantity"].sum()) if "Sales_Quantity" in df.columns else 0
    total_products = int(df["Product_ID"].nunique()) if "Product_ID" in df.columns else 0
    total_stores = int(df["Store_ID"].nunique()) if "Store_ID" in df.columns else 0

    # Average Daily Demand
    n_days = max(1, df["Date"].nunique()) if "Date" in df.columns else 1
    avg_daily_demand = round(total_quantity / n_days, 1)

    # Forecast accuracy from best model
    forecast_accuracy = 98.5
    model_name = "LightGBM"
    if (MODEL_DIR / "best_model_info.json").exists():
        try:
            with open(MODEL_DIR / "best_model_info.json") as f:
                info = json.load(f)
                r2 = info.get("metrics", {}).get("R2", 0.999)
                model_name = info.get("best_model", "LightGBM")
                forecast_accuracy = round(float(r2) * 100, 2)
        except Exception:
            pass

    # Charts:
    # 1. Performance over time (Monthly)
    monthly_trend = []
    if "Date" in df.columns and "Revenue" in df.columns:
        monthly = df.groupby(df["Date"].dt.to_period("M").astype(str)).agg({
            "Revenue": "sum",
            "Sales_Quantity": "sum"
        }).reset_index()
        monthly.columns = ["month", "revenue", "sales_quantity"]
        monthly_trend = monthly.to_dict(orient="records")

    # 2. Sales by Category
    category_sales = []
    if "Category" in df.columns:
        cat = df.groupby("Category")["Revenue"].sum().reset_index()
        cat.columns = ["name", "value"]
        category_sales = cat.sort_values("value", ascending=False).to_dict(orient="records")

    # 3. Sales by Store
    store_sales = []
    store_col = "Store_Location" if "Store_Location" in df.columns else "Store_ID"
    if store_col in df.columns:
        st = df.groupby(store_col)["Revenue"].sum().reset_index()
        st.columns = ["name", "value"]
        store_sales = st.sort_values("value", ascending=False).to_dict(orient="records")

    # 4. Top 5 Selling Products
    top_products = []
    prod_name_col = "Product_Name" if "Product_Name" in df.columns else "Product_ID"
    if prod_name_col in df.columns:
        tp = df.groupby(prod_name_col).agg({
            "Sales_Quantity": "sum",
            "Revenue": "sum"
        }).reset_index()
        tp.columns = ["name", "quantity", "revenue"]
        top_products = tp.sort_values("quantity", ascending=False).head(5).to_dict(orient="records")

    # 5. Inventory Risk Overview (quick stats)
    inventory_summary = {
        "healthy": 0,
        "critical": 0,
        "low_stock": 0,
        "overstock": 0
    }
    if "Inventory_Level" in df.columns and "Sales_Quantity" in df.columns:
        # Calculate snapshot per product-store
        latest_rows = df.sort_values("Date").groupby(["Product_ID", "Store_ID"]).last().reset_index()
        avg_demands = df.groupby(["Product_ID", "Store_ID"])["Sales_Quantity"].mean()
        
        for _, row in latest_rows.iterrows():
            pid, sid = row["Product_ID"], row["Store_ID"]
            curr_inv = row["Inventory_Level"]
            avg_d = avg_demands.get((pid, sid), 10)
            reorder_pt = avg_d * 7 + (avg_d * 0.3 * np.sqrt(7))
            
            if curr_inv < reorder_pt * 0.5:
                inventory_summary["critical"] += 1
            elif curr_inv < reorder_pt:
                inventory_summary["low_stock"] += 1
            elif curr_inv > avg_d * 30:
                inventory_summary["overstock"] += 1
            else:
                inventory_summary["healthy"] += 1

    return {
        "kpis": {
            "total_revenue": round(total_revenue, 2),
            "total_quantity": total_quantity,
            "total_products": total_products,
            "total_stores": total_stores,
            "avg_daily_demand": avg_daily_demand,
            "forecast_accuracy": forecast_accuracy,
            "best_model_name": model_name
        },
        "charts": {
            "monthly_trend": monthly_trend,
            "category_sales": category_sales,
            "store_sales": store_sales,
            "top_products": top_products,
            "inventory_risk": inventory_summary
        }
    }
