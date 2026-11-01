"""
forecast.py
Generates future demand forecasts (7 / 30 / 90 / 180 / 365 days) using the
trained best model, recursively feeding predictions back in as lag features.
Supports product-wise, store-wise, and category-wise aggregation.
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from datetime import timedelta

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"

HORIZONS = {"7 Days": 7, "30 Days": 30, "90 Days": 90,
            "6 Months": 182, "1 Year": 365}


def load_artifacts():
    model = joblib.load(MODEL_DIR / "best_model.pkl")
    feature_cols = joblib.load(MODEL_DIR / "feature_columns.pkl")
    return model, feature_cols


def recursive_forecast(history_df: pd.DataFrame, model, feature_cols,
                        product_id: str, store_id: str, horizon_days: int) -> pd.DataFrame:
    """
    history_df: full engineered feature dataframe (with Date, Product_ID, Store_ID, Sales_Quantity)
    Recursively predicts forward, updating lag/rolling features each step.
    """
    series = history_df[(history_df["Product_ID"] == product_id) &
                         (history_df["Store_ID"] == store_id)].sort_values("Date").copy()
    if series.empty:
        raise ValueError(f"No history found for {product_id} / {store_id}")

    last_row = series.iloc[-1]
    last_date = pd.to_datetime(last_row["Date"])
    sales_history = series["Sales_Quantity"].tolist()

    forecasts = []
    for step in range(1, horizon_days + 1):
        future_date = last_date + timedelta(days=step)
        row = last_row.copy()

        row["Date"] = future_date
        row["Year"], row["Month"], row["Day"] = future_date.year, future_date.month, future_date.day
        row["Week"] = future_date.isocalendar()[1]
        row["DayOfWeek"] = future_date.dayofweek
        row["IsWeekend"] = int(future_date.dayofweek >= 5)
        row["Quarter"] = (future_date.month - 1) // 3 + 1

        row["Lag_1"] = sales_history[-1]
        row["Lag_7"] = sales_history[-7] if len(sales_history) >= 7 else np.median(sales_history)
        row["Lag_30"] = sales_history[-30] if len(sales_history) >= 30 else np.median(sales_history)
        row["Lag_365"] = sales_history[-365] if len(sales_history) >= 365 else np.median(sales_history)
        recent7 = sales_history[-7:] if len(sales_history) >= 7 else sales_history
        recent30 = sales_history[-30:] if len(sales_history) >= 30 else sales_history
        row["Rolling_Mean_7"] = np.mean(recent7)
        row["Rolling_Std_7"] = np.std(recent7)
        row["Rolling_Mean_30"] = np.mean(recent30)
        row["Moving_Avg_7"] = row["Rolling_Mean_7"]
        row["EMA_7"] = pd.Series(recent7).ewm(span=7).mean().iloc[-1]

        X = pd.DataFrame([row])[feature_cols].fillna(0)
        pred = max(0, float(model.predict(X)[0]))

        sales_history.append(pred)
        forecasts.append({
            "Date": future_date.strftime("%Y-%m-%d"),
            "Product_ID": product_id, "Store_ID": store_id,
            "Predicted_Sales_Quantity": round(pred, 2)
        })
        last_row = row

    return pd.DataFrame(forecasts)


def forecast_all_combinations(history_df: pd.DataFrame, model, feature_cols,
                               horizon_days: int, product_ids=None, store_ids=None) -> pd.DataFrame:
    product_ids = product_ids or history_df["Product_ID"].unique().tolist()
    store_ids = store_ids or history_df["Store_ID"].unique().tolist()

    all_forecasts = []
    for pid in product_ids:
        for sid in store_ids:
            try:
                fc = recursive_forecast(history_df, model, feature_cols, pid, sid, horizon_days)
                all_forecasts.append(fc)
            except ValueError:
                continue
    return pd.concat(all_forecasts, ignore_index=True) if all_forecasts else pd.DataFrame()


def aggregate_forecast(forecast_df: pd.DataFrame, meta_df: pd.DataFrame, level: str) -> pd.DataFrame:
    """level: 'Product_ID', 'Store_ID', or 'Category' (via merge with meta)"""
    if level == "Category":
        cat_map = meta_df[["Product_ID", "Category"]].drop_duplicates()
        forecast_df = forecast_df.merge(cat_map, on="Product_ID", how="left")
        return forecast_df.groupby(["Date", "Category"])["Predicted_Sales_Quantity"].sum().reset_index()
    return forecast_df.groupby(["Date", level])["Predicted_Sales_Quantity"].sum().reset_index()


if __name__ == "__main__":
    hist = pd.read_csv("../data/retail_sales_features.csv")
    model, feature_cols = load_artifacts()
    fc = recursive_forecast(hist, model, feature_cols, "P001", "S01", horizon_days=30)
    print(fc.head(10))
    print(f"\nGenerated {len(fc)}-day forecast for P001 / S01")
