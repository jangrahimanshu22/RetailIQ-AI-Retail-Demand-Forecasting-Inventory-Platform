"""
insights.py
API router for automated SaaS Business Intelligence and Executive Analytics.
Calculates real revenue drivers, underperformers, category velocities, and seasonal opportunities.
"""
from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np

from backend.services.data_manager import data_manager
from utils.inventory_engine import generate_business_insights

router = APIRouter(prefix="/api/insights", tags=["Business Intelligence"])

@router.get("/summary")
def get_business_insights():
    df = data_manager.get_clean_df()
    if df.empty:
        df = data_manager.get_raw_df()
    if df.empty:
        raise HTTPException(status_code=400, detail="No dataset available for business insights.")

    df = df.copy()
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"])

    # 1. Base insights from existing engine
    base_insights = generate_business_insights(df)

    # 2. Category velocity & revenue breakdown
    cat_stats = df.groupby("Category").agg({
        "Sales_Quantity": ["sum", "mean"],
        "Revenue": "sum"
    })
    cat_stats.columns = ["total_quantity", "avg_daily_quantity", "total_revenue"]
    cat_stats = cat_stats.reset_index().sort_values("total_revenue", ascending=False)
    cat_breakdown = cat_stats.to_dict(orient="records")

    # 3. Store efficiency & contribution
    store_col = "Store_Location" if "Store_Location" in df.columns else "Store_ID"
    store_stats = df.groupby(["Store_ID", store_col]).agg({
        "Sales_Quantity": "sum",
        "Revenue": "sum"
    }).reset_index().sort_values("Revenue", ascending=False)
    store_efficiency = store_stats.to_dict(orient="records")

    # 4. Seasonal opportunities
    seasonal_opportunities = []
    if "Season" in df.columns:
        season_perf = df.groupby("Season").agg({
            "Sales_Quantity": "sum",
            "Revenue": "sum"
        }).reset_index().sort_values("Revenue", ascending=False)
        top_season = season_perf.iloc[0]["Season"]
        top_revenue = float(season_perf.iloc[0]["Revenue"])
        seasonal_opportunities.append({
            "title": f"Peak Season: {top_season}",
            "description": f"{top_season} yields highest gross sales (${top_revenue:,.2f}). Prepare inventory 3 weeks in advance.",
            "impact": "High Positive",
            "type": "opportunity"
        })

    # 5. Promotion elasticity
    promo_elasticity = None
    if "Promotion" in df.columns:
        promo_avg = float(df[df["Promotion"] == 1]["Sales_Quantity"].mean()) if (df["Promotion"] == 1).any() else 0
        non_promo_avg = float(df[df["Promotion"] == 0]["Sales_Quantity"].mean()) if (df["Promotion"] == 0).any() else 0
        uplift = round(((promo_avg - non_promo_avg) / non_promo_avg) * 100, 1) if non_promo_avg > 0 else 0
        promo_elasticity = {
            "promo_avg": round(promo_avg, 2),
            "non_promo_avg": round(non_promo_avg, 2),
            "uplift_pct": uplift,
            "conclusion": f"Promotions yield a {uplift}% sales uplift on average."
        }

    # 6. Actionable Executive Recommendations
    executive_recommendations = [
        {
            "priority": "HIGH",
            "category": "Merchandising",
            "action": f"Expand shelf space and promotional campaigns for {base_insights.get('top_category', 'top category')}, which leads overall sales volume."
        },
        {
            "priority": "MEDIUM",
            "category": "Store Operations",
            "action": f"Audit product mix and footfall in store {base_insights['low_performing_stores'][0]['Store_ID'] if base_insights.get('low_performing_stores') else 'bottom stores'} to mitigate regional lag."
        },
        {
            "priority": "CRITICAL",
            "category": "Supply Chain",
            "action": "Synchronize lead-time buffer on fast-moving SKUs to prevent revenue leakage from recurring stockouts."
        }
    ]

    return {
        "best_selling": base_insights.get("best_selling", []),
        "worst_selling": base_insights.get("worst_selling", []),
        "top_category": base_insights.get("top_category", "N/A"),
        "low_performing_stores": base_insights.get("low_performing_stores", []),
        "high_revenue_products": base_insights.get("high_revenue_products", []),
        "category_breakdown": cat_breakdown,
        "store_efficiency": store_efficiency,
        "seasonal_opportunities": seasonal_opportunities,
        "promotion_elasticity": promo_elasticity,
        "executive_recommendations": executive_recommendations
    }
