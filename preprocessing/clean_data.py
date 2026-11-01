"""
clean_data.py
Handles missing values, duplicates, outliers, and datetime feature extraction.
"""
import pandas as pd
import numpy as np


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    return df


def report_missing(df: pd.DataFrame) -> pd.DataFrame:
    miss = df.isnull().sum()
    pct = (miss / len(df) * 100).round(2)
    return pd.DataFrame({"missing_count": miss, "missing_pct": pct}).query("missing_count > 0")


def handle_missing_values(df: pd.DataFrame, strategy: dict = None) -> pd.DataFrame:
    """
    strategy: dict mapping column -> method ('mean', 'median', 'mode', 'ffill')
    Defaults: numeric -> median, categorical -> mode
    """
    df = df.copy()
    strategy = strategy or {}
    for col in df.columns:
        if df[col].isnull().sum() == 0:
            continue
        method = strategy.get(col)
        if method is None:
            method = "median" if pd.api.types.is_numeric_dtype(df[col]) else "mode"

        if method == "mean":
            df[col] = df[col].fillna(df[col].mean())
        elif method == "median":
            df[col] = df[col].fillna(df[col].median())
        elif method == "mode":
            df[col] = df[col].fillna(df[col].mode().iloc[0])
        elif method == "ffill":
            df[col] = df[col].fillna(method="ffill").fillna(method="bfill")
    return df


def remove_duplicates(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    return df, removed


def detect_outliers_iqr(df: pd.DataFrame, column: str) -> pd.Series:
    q1, q3 = df[column].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return (df[column] < lower) | (df[column] > upper)


def detect_outliers_zscore(df: pd.DataFrame, column: str, threshold: float = 3.0) -> pd.Series:
    z = (df[column] - df[column].mean()) / df[column].std()
    return z.abs() > threshold


def cap_outliers_iqr(df: pd.DataFrame, columns: list) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        q1, q3 = df[col].quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        df[col] = df[col].clip(lower, upper)
    return df


def extract_datetime_features(df: pd.DataFrame, date_col: str = "Date") -> pd.DataFrame:
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df["Year"] = df[date_col].dt.year
    df["Month"] = df[date_col].dt.month
    df["Week"] = df[date_col].dt.isocalendar().week.astype(int)
    df["Day"] = df[date_col].dt.day
    df["DayOfWeek"] = df[date_col].dt.dayofweek
    df["IsWeekend"] = (df["DayOfWeek"] >= 5).astype(int)
    df["Quarter"] = df[date_col].dt.quarter
    return df


def full_cleaning_pipeline(path: str) -> tuple[pd.DataFrame, dict]:
    """Runs the whole preprocessing pipeline and returns (clean_df, log)."""
    log = {}
    df = load_data(path)
    log["initial_rows"] = len(df)

    miss_report = report_missing(df)
    log["missing_before"] = miss_report.to_dict()

    df = handle_missing_values(df)
    df, dupes_removed = remove_duplicates(df)
    log["duplicates_removed"] = dupes_removed

    numeric_cols = ["Sales_Quantity", "Unit_Price", "Revenue", "Inventory_Level"]
    outlier_flags = {c: int(detect_outliers_iqr(df, c).sum()) for c in numeric_cols if c in df.columns}
    log["outliers_detected_iqr"] = outlier_flags

    df = cap_outliers_iqr(df, [c for c in numeric_cols if c in df.columns])
    df = extract_datetime_features(df)

    log["final_rows"] = len(df)
    return df, log


if __name__ == "__main__":
    clean_df, log = full_cleaning_pipeline("../data/retail_sales_data.csv")
    print(log)
    clean_df.to_csv("../data/retail_sales_clean.csv", index=False)
    print("Saved cleaned dataset -> data/retail_sales_clean.csv")
