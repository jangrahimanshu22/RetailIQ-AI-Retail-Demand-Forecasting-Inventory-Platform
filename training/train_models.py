"""
train_models.py
Trains multiple regression models on the engineered feature set,
compares them on held-out data (time-based split), and saves the best model.

Models: Linear Regression, Decision Tree, Random Forest, Extra Trees,
Gradient Boosting, XGBoost, LightGBM.

(CatBoost, ARIMA/SARIMA/Prophet, and LSTM/GRU are architected as pluggable
 modules in forecasting/ — see forecasting/README_advanced_models.md for
 how to add them; they're omitted here to keep training time reasonable.)
"""
import pandas as pd
import numpy as np
import joblib
import json
import time
from pathlib import Path

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, GradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import xgboost as xgb
import lightgbm as lgb

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

TARGET = "Sales_Quantity"
DROP_COLS = ["Date", "Product_Name", "Category", "Store_Location", "Customer_ID",
             "Season", "Weather", TARGET]


def mape(y_true, y_pred):
    mask = y_true != 0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def load_features(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["Date"] = pd.to_datetime(df["Date"])
    return df.sort_values("Date")


def time_split(df: pd.DataFrame, test_frac: float = 0.2):
    split_idx = int(len(df) * (1 - test_frac))
    return df.iloc[:split_idx], df.iloc[split_idx:]


def get_model_zoo():
    return {
        "LinearRegression": LinearRegression(),
        "DecisionTree": DecisionTreeRegressor(max_depth=10, random_state=42),
        "RandomForest": RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1),
        "ExtraTrees": ExtraTreesRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=150, max_depth=4, random_state=42),
        "XGBoost": xgb.XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.08,
                                     random_state=42, n_jobs=-1, verbosity=0),
        "LightGBM": lgb.LGBMRegressor(n_estimators=200, max_depth=6, learning_rate=0.08,
                                       random_state=42, verbosity=-1),
    }


def train_and_compare(df: pd.DataFrame):
    numeric_dtype_kinds = ("i", "u", "f", "b")  # int, uint, float, bool
    feature_cols = [c for c in df.columns
                    if c not in DROP_COLS and df[c].dtype.kind in numeric_dtype_kinds]
    train_df, test_df = time_split(df)

    X_train, y_train = train_df[feature_cols].fillna(0), train_df[TARGET]
    X_test, y_test = test_df[feature_cols].fillna(0), test_df[TARGET]

    results = []
    trained_models = {}

    for name, model in get_model_zoo().items():
        t0 = time.time()
        model.fit(X_train, y_train)
        preds = np.clip(model.predict(X_test), 0, None)
        elapsed = time.time() - t0

        mae = mean_absolute_error(y_test, preds)
        rmse = mean_squared_error(y_test, preds) ** 0.5
        mse = mean_squared_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        mp = mape(y_test.values, preds)

        # 3-fold time series cross validation (on training set only)
        tscv = TimeSeriesSplit(n_splits=3)
        cv_scores = cross_val_score(model, X_train, y_train, cv=tscv,
                                     scoring="neg_root_mean_squared_error")
        cv_rmse = -cv_scores.mean()

        results.append({
            "Model": name, "MAE": round(mae, 3), "RMSE": round(rmse, 3),
            "MSE": round(mse, 3), "MAPE": round(mp, 2), "R2": round(r2, 4),
            "CV_RMSE": round(cv_rmse, 3), "TrainTime_s": round(elapsed, 2)
        })
        trained_models[name] = model
        print(f"{name:20s} RMSE={rmse:8.3f}  MAE={mae:8.3f}  R2={r2:.4f}  MAPE={mp:.2f}%")

    results_df = pd.DataFrame(results).sort_values("RMSE")
    best_name = results_df.iloc[0]["Model"]
    best_model = trained_models[best_name]

    joblib.dump(best_model, MODEL_DIR / "best_model.pkl")
    joblib.dump(feature_cols, MODEL_DIR / "feature_columns.pkl")
    results_df.to_csv(MODEL_DIR / "model_comparison.csv", index=False)

    with open(MODEL_DIR / "best_model_info.json", "w") as f:
        json.dump({"best_model": best_name,
                   "metrics": results_df.iloc[0].to_dict()}, f, indent=2)

    print(f"\nBest model: {best_name}  -> saved to models/best_model.pkl")
    return results_df, best_name, best_model, feature_cols


if __name__ == "__main__":
    df = load_features("../data/retail_sales_features.csv")
    results_df, best_name, best_model, feature_cols = train_and_compare(df)
    print("\n=== Model Comparison ===")
    print(results_df.to_string(index=False))
