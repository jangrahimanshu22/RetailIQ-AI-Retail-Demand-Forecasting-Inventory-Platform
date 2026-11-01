"""
inventory_engine.py
Rule-based inventory recommendation engine built on top of demand forecasts.
"""
import pandas as pd
import numpy as np


def compute_recommendations(history_df: pd.DataFrame, forecast_df: pd.DataFrame,
                             lead_time_days: int = 7, service_level_z: float = 1.65) -> pd.DataFrame:
    """
    history_df: cleaned historical data with Sales_Quantity, Inventory_Level per Product/Store
    forecast_df: output of recursive_forecast/forecast_all_combinations (next-N-day predictions)
    """
    recs = []
    groups = forecast_df.groupby(["Product_ID", "Store_ID"])

    for (pid, sid), fc in groups:
        hist = history_df[(history_df["Product_ID"] == pid) & (history_df["Store_ID"] == sid)]
        if hist.empty:
            continue

        avg_daily_demand = hist["Sales_Quantity"].mean()
        std_daily_demand = hist["Sales_Quantity"].std()
        current_inventory = hist.sort_values("Date").iloc[-1]["Inventory_Level"]

        safety_stock = round(service_level_z * std_daily_demand * np.sqrt(lead_time_days), 1)
        reorder_point = round(avg_daily_demand * lead_time_days + safety_stock, 1)

        forecast_demand_horizon = fc["Predicted_Sales_Quantity"].sum()
        restock_qty = max(0, round(forecast_demand_horizon - current_inventory + safety_stock, 1))

        if current_inventory < reorder_point * 0.5:
            alert = "STOCKOUT RISK"
        elif current_inventory > forecast_demand_horizon * 2.5:
            alert = "OVERSTOCK WARNING"
        elif current_inventory < reorder_point:
            alert = "REORDER SOON"
        else:
            alert = "OK"

        recs.append({
            "Product_ID": pid, "Store_ID": sid,
            "Current_Inventory": round(current_inventory, 1),
            "Avg_Daily_Demand": round(avg_daily_demand, 2),
            "Forecast_Demand_Horizon": round(forecast_demand_horizon, 1),
            "Safety_Stock": safety_stock,
            "Reorder_Point": reorder_point,
            "Recommended_Restock_Qty": restock_qty,
            "Alert": alert
        })

    return pd.DataFrame(recs).sort_values("Alert")


def generate_business_insights(history_df: pd.DataFrame) -> dict:
    insights = {}
    prod_sales = history_df.groupby(["Product_ID", "Product_Name"])["Sales_Quantity"].sum().reset_index()
    insights["best_selling"] = prod_sales.nlargest(5, "Sales_Quantity").to_dict("records")
    insights["worst_selling"] = prod_sales.nsmallest(5, "Sales_Quantity").to_dict("records")

    cat_sales = history_df.groupby("Category")["Sales_Quantity"].sum()
    insights["top_category"] = cat_sales.idxmax()

    store_revenue = history_df.groupby(["Store_ID", "Store_Location"])["Revenue"].sum().reset_index()
    insights["low_performing_stores"] = store_revenue.nsmallest(3, "Revenue").to_dict("records")
    insights["high_revenue_products"] = (
        history_df.groupby(["Product_ID", "Product_Name"])["Revenue"].sum()
        .nlargest(5).reset_index().to_dict("records")
    )
    return insights


if __name__ == "__main__":
    hist = pd.read_csv("../data/retail_sales_clean.csv")
    insights = generate_business_insights(hist)
    for k, v in insights.items():
        print(f"\n{k}:")
        print(v)
