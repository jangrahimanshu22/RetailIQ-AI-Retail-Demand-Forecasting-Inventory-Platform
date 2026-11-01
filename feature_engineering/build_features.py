"""
build_features.py
Creates lag/rolling features, holiday/weekend flags, price features,
and encodes + scales the dataset for modeling.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler


def add_lag_and_rolling_features(df: pd.DataFrame, group_cols=("Product_ID", "Store_ID"),
                                  target="Sales_Quantity") -> pd.DataFrame:
    df = df.sort_values(list(group_cols) + ["Date"]).copy()
    grp = df.groupby(list(group_cols))[target]

    df["Lag_1"] = grp.shift(1)
    df["Lag_7"] = grp.shift(7)          # previous week same weekday
    df["Lag_30"] = grp.shift(30)        # previous month
    df["Lag_365"] = grp.shift(365)      # previous year

    df["Rolling_Mean_7"] = grp.transform(lambda s: s.shift(1).rolling(7).mean())
    df["Rolling_Std_7"] = grp.transform(lambda s: s.shift(1).rolling(7).std())
    df["Rolling_Mean_30"] = grp.transform(lambda s: s.shift(1).rolling(30).mean())
    df["Moving_Avg_7"] = df["Rolling_Mean_7"]
    df["EMA_7"] = grp.transform(lambda s: s.shift(1).ewm(span=7).mean())

    # fill early NaNs (start of each series) with group median
    lag_cols = ["Lag_1", "Lag_7", "Lag_30", "Lag_365",
                "Rolling_Mean_7", "Rolling_Std_7", "Rolling_Mean_30", "EMA_7"]
    for c in lag_cols:
        df[c] = df.groupby(list(group_cols))[c].transform(lambda s: s.fillna(s.median()))
        df[c] = df[c].fillna(df[target].median())
    return df


def add_business_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["Discount_Percentage"] = df["Discount"]
    df["Price_Change"] = df["Unit_Price"] - df.groupby("Product_ID")["Unit_Price"].transform("mean")
    df["Inventory_Ratio"] = df["Inventory_Level"] / (df["Sales_Quantity"] + 1)
    df["Festival_Indicator"] = df["Holiday_Indicator"]  # alias, extendable with a festival calendar
    return df


def encode_categoricals(df: pd.DataFrame, onehot_cols=None, label_cols=None):
    df = df.copy()
    onehot_cols = onehot_cols or ["Season", "Weather"]
    label_cols = label_cols or ["Product_ID", "Category", "Store_ID", "Store_Location"]

    encoders = {}
    for col in label_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

    onehot_cols = [c for c in onehot_cols if c in df.columns]
    df = pd.get_dummies(df, columns=onehot_cols, prefix=onehot_cols)
    return df, encoders


def scale_features(df: pd.DataFrame, columns: list, method: str = "standard"):
    df = df.copy()
    scaler = StandardScaler() if method == "standard" else MinMaxScaler()
    df[columns] = scaler.fit_transform(df[columns])
    return df, scaler


def build_feature_pipeline(df: pd.DataFrame):
    df = add_lag_and_rolling_features(df)
    df = add_business_features(df)
    df_encoded, encoders = encode_categoricals(df)
    return df_encoded, encoders


if __name__ == "__main__":
    clean_df = pd.read_csv("../data/retail_sales_clean.csv")
    featured_df, encoders = build_feature_pipeline(clean_df)
    featured_df.to_csv("../data/retail_sales_features.csv", index=False)
    print(f"Feature set shape: {featured_df.shape}")
    print("Saved -> data/retail_sales_features.csv")
