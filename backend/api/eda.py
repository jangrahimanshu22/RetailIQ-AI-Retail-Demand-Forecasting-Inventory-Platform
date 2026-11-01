"""
eda.py
Exploratory Data Analysis API router providing aggregated interactive chart data and statistical distributions.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
import pandas as pd
import numpy as np

from backend.services.data_manager import data_manager

router = APIRouter(prefix="/api/eda", tags=["Exploratory Data Analysis"])

def get_filtered_df(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[str] = None,
    store_id: Optional[str] = None,
    category: Optional[str] = None,
):
    df = data_manager.get_clean_df()
    if df.empty:
        df = data_manager.get_raw_df()
    if df.empty:
        raise HTTPException(status_code=400, detail="No dataset loaded. Run cleaning or upload dataset first.")

    df = df.copy()
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])
        if start_date:
            df = df[df["Date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["Date"] <= pd.to_datetime(end_date)]

    if product_id and "Product_ID" in df.columns:
        df = df[df["Product_ID"] == product_id]
    if store_id and "Store_ID" in df.columns:
        df = df[df["Store_ID"] == store_id]
    if category and "Category" in df.columns:
        df = df[df["Category"] == category]

    return df

@router.get("/filters")
def get_eda_filter_options():
    df = data_manager.get_clean_df()
    if df.empty:
        df = data_manager.get_raw_df()
    if df.empty:
        return {"products": [], "stores": [], "categories": [], "date_min": None, "date_max": None}

    products = sorted([str(p) for p in df["Product_ID"].dropna().unique()]) if "Product_ID" in df.columns else []
    stores = sorted([str(s) for s in df["Store_ID"].dropna().unique()]) if "Store_ID" in df.columns else []
    categories = sorted([str(c) for c in df["Category"].dropna().unique()]) if "Category" in df.columns else []

    date_min = str(df["Date"].min())[:10] if "Date" in df.columns else None
    date_max = str(df["Date"].max())[:10] if "Date" in df.columns else None

    return {
        "products": products,
        "stores": stores,
        "categories": categories,
        "date_min": date_min,
        "date_max": date_max
    }

@router.get("/charts")
def get_eda_charts(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[str] = None,
    store_id: Optional[str] = None,
    category: Optional[str] = None,
):
    df = get_filtered_df(start_date, end_date, product_id, store_id, category)
    if df.empty:
        raise HTTPException(status_code=400, detail="Filtered dataset is empty.")

    # 1. Daily Sales Trend
    daily = df.groupby(df["Date"].dt.strftime("%Y-%m-%d")).agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index()
    daily.columns = ["date", "sales_quantity", "revenue"]
    # Downsample if too many days for crisp chart rendering (max 100 points)
    if len(daily) > 120:
        step = max(1, len(daily) // 100)
        daily_trend = daily.iloc[::step].to_dict(orient="records")
    else:
        daily_trend = daily.to_dict(orient="records")

    # 2. Monthly Revenue Trend
    monthly = df.groupby(df["Date"].dt.to_period("M").astype(str)).agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index()
    monthly.columns = ["month", "sales_quantity", "revenue"]
    monthly_trend = monthly.to_dict(orient="records")

    # 3. Category-wise Sales Distribution
    cat_sales = df.groupby("Category").agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index()
    cat_sales.columns = ["category", "sales_quantity", "revenue"]
    category_distribution = cat_sales.sort_values("revenue", ascending=False).to_dict(orient="records")

    # 4. Store-wise Sales Performance
    store_group_col = "Store_Location" if "Store_Location" in df.columns else "Store_ID"
    store_sales = df.groupby(store_group_col).agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index()
    store_sales.columns = ["store", "sales_quantity", "revenue"]
    store_performance = store_sales.sort_values("revenue", ascending=False).to_dict(orient="records")

    # 5. Product-wise Sales Quantity (Top 10)
    prod_name_col = "Product_Name" if "Product_Name" in df.columns else "Product_ID"
    prod_sales = df.groupby(prod_name_col).agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index()
    prod_sales.columns = ["product", "sales_quantity", "revenue"]
    product_performance = prod_sales.sort_values("sales_quantity", ascending=False).head(10).to_dict(orient="records")

    # 6. Correlation Heatmap
    numeric_cols = [c for c in [
        "Sales_Quantity", "Unit_Price", "Revenue", "Discount",
        "Inventory_Level", "Competitor_Price", "Fuel_Price", "Economic_Index"
    ] if c in df.columns]
    corr_matrix = []
    if len(numeric_cols) > 1:
        corr_df = df[numeric_cols].corr().round(2).fillna(0)
        for col_y in numeric_cols:
            row = {"variable": col_y}
            for col_x in numeric_cols:
                row[col_x] = float(corr_df.loc[col_y, col_x])
            corr_matrix.append(row)

    # 7. Sales Quantity Distribution (Histogram bins)
    hist_counts, bin_edges = np.histogram(df["Sales_Quantity"].dropna(), bins=20)
    sales_distribution = [
        {"bin": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}", "count": int(hist_counts[i])}
        for i in range(len(hist_counts))
    ]

    # 8. Sales Boxplots / Quantiles by Category
    category_boxplots = []
    if "Category" in df.columns:
        for cat, group in df.groupby("Category"):
            q = group["Sales_Quantity"].quantile([0.0, 0.25, 0.5, 0.75, 1.0])
            category_boxplots.append({
                "category": cat,
                "min": round(float(q[0.0]), 1),
                "q1": round(float(q[0.25]), 1),
                "median": round(float(q[0.5]), 1),
                "q3": round(float(q[0.75]), 1),
                "max": round(float(q[1.0]), 1),
                "avg": round(float(group["Sales_Quantity"].mean()), 1)
            })

    # 9. Seasonal Demand Analysis
    seasonal_analysis = []
    if "Season" in df.columns:
        season_sales = df.groupby("Season").agg({
            "Sales_Quantity": "mean",
            "Revenue": "mean"
        }).reset_index()
        season_sales.columns = ["season", "avg_quantity", "avg_revenue"]
        seasonal_analysis = season_sales.round(2).to_dict(orient="records")

    # 10. Holiday Impact Analysis
    holiday_analysis = []
    if "Holiday_Indicator" in df.columns:
        h_df = df.copy()
        h_df["Holiday_Status"] = h_df["Holiday_Indicator"].map({0: "Non-Holiday", 1: "Holiday"}).fillna("Unknown")
        hol_sales = h_df.groupby("Holiday_Status").agg({
            "Sales_Quantity": "mean",
            "Revenue": "mean"
        }).reset_index()
        hol_sales.columns = ["status", "avg_quantity", "avg_revenue"]
        holiday_analysis = hol_sales.round(2).to_dict(orient="records")

    # 11. Promotion Impact Analysis
    promotion_analysis = []
    if "Promotion" in df.columns:
        p_df = df.copy()
        p_df["Promo_Status"] = p_df["Promotion"].map({0: "No Promo", 1: "With Promo"}).fillna("Unknown")
        prom_sales = p_df.groupby("Promo_Status").agg({
            "Sales_Quantity": "mean",
            "Revenue": "mean"
        }).reset_index()
        prom_sales.columns = ["status", "avg_quantity", "avg_revenue"]
        promotion_analysis = prom_sales.round(2).to_dict(orient="records")

    return {
        "daily_trend": daily_trend,
        "monthly_trend": monthly_trend,
        "category_distribution": category_distribution,
        "store_performance": store_performance,
        "product_performance": product_performance,
        "correlation_matrix": corr_matrix,
        "numeric_cols": numeric_cols,
        "sales_distribution": sales_distribution,
        "category_boxplots": category_boxplots,
        "seasonal_analysis": seasonal_analysis,
        "holiday_analysis": holiday_analysis,
        "promotion_analysis": promotion_analysis,
        "summary": {
            "total_rows": len(df),
            "total_sales_quantity": int(df["Sales_Quantity"].sum()),
            "total_revenue": round(float(df["Revenue"].sum()), 2),
            "avg_unit_price": round(float(df["Unit_Price"].mean()), 2) if "Unit_Price" in df.columns else 0
        }
    }
