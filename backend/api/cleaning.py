"""
cleaning.py
API endpoints for data cleaning analysis, duplicate & outlier detection, and executing cleaning pipeline.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
import pandas as pd
import numpy as np

from backend.services.data_manager import data_manager
from preprocessing.clean_data import (
    report_missing,
    handle_missing_values,
    remove_duplicates,
    detect_outliers_iqr,
    detect_outliers_zscore,
    cap_outliers_iqr,
    extract_datetime_features
)

router = APIRouter(prefix="/api/cleaning", tags=["Data Cleaning"])

class CleaningConfig(BaseModel):
    handle_missing: bool = True
    missing_strategy: Optional[Dict[str, str]] = None
    remove_duplicates: bool = True
    cap_outliers: bool = True
    outlier_method: str = "iqr"  # "iqr" or "zscore"

@router.get("/analysis")
def get_cleaning_analysis():
    df = data_manager.get_raw_df()
    if df.empty:
        raise HTTPException(status_code=400, detail="No dataset loaded. Upload or select a sample dataset first.")

    # 1. Missing values
    missing_data = []
    for col in df.columns:
        n_missing = int(df[col].isnull().sum())
        if n_missing > 0:
            missing_data.append({
                "column": col,
                "missing_count": n_missing,
                "missing_pct": round(n_missing / len(df) * 100, 2),
                "dtype": str(df[col].dtype),
                "suggested_imputation": "median" if pd.api.types.is_numeric_dtype(df[col]) else "mode"
            })

    # 2. Duplicate detection
    n_dupes = int(df.duplicated().sum())

    # 3. Outlier analysis
    numeric_cols = [c for c in ["Sales_Quantity", "Unit_Price", "Revenue", "Inventory_Level", "Competitor_Price"] if c in df.columns]
    outlier_analysis = []
    for col in numeric_cols:
        iqr_mask = detect_outliers_iqr(df, col)
        z_mask = detect_outliers_zscore(df, col)
        outlier_analysis.append({
            "column": col,
            "iqr_outliers": int(iqr_mask.sum()),
            "iqr_pct": round(float(iqr_mask.mean() * 100), 2),
            "zscore_outliers": int(z_mask.sum()),
            "zscore_pct": round(float(z_mask.mean() * 100), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "q25": round(float(df[col].quantile(0.25)), 2),
            "median": round(float(df[col].median()), 2),
            "q75": round(float(df[col].quantile(0.75)), 2),
        })

    # 4. Data types
    dtypes_list = [{"column": col, "dtype": str(df[col].dtype)} for col in df.columns]

    return {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "missing_summary": missing_data,
        "duplicate_count": n_dupes,
        "duplicate_pct": round(n_dupes / len(df) * 100, 2) if len(df) > 0 else 0,
        "outlier_analysis": outlier_analysis,
        "dtypes": dtypes_list
    }

@router.post("/run")
def run_cleaning(config: CleaningConfig):
    raw_df = data_manager.get_raw_df()
    if raw_df.empty:
        raise HTTPException(status_code=400, detail="No dataset loaded to clean.")

    initial_rows = len(raw_df)
    initial_missing = int(raw_df.isnull().sum().sum())
    initial_dupes = int(raw_df.duplicated().sum())

    df = raw_df.copy()

    # Step 1: Missing values
    if config.handle_missing:
        df = handle_missing_values(df, strategy=config.missing_strategy)

    # Step 2: Remove duplicates
    dupes_removed = 0
    if config.remove_duplicates:
        df, dupes_removed = remove_duplicates(df)

    # Step 3: Outliers
    numeric_cols = [c for c in ["Sales_Quantity", "Unit_Price", "Revenue", "Inventory_Level"] if c in df.columns]
    outliers_capped = {}
    if config.cap_outliers:
        for c in numeric_cols:
            outliers_count = int(detect_outliers_iqr(df, c).sum())
            outliers_capped[c] = outliers_count
        df = cap_outliers_iqr(df, numeric_cols)

    # Step 4: Datetime features
    if "Date" in df.columns:
        df = extract_datetime_features(df, "Date")

    final_rows = len(df)
    final_missing = int(df.isnull().sum().sum())

    log = {
        "initial_rows": initial_rows,
        "final_rows": final_rows,
        "initial_missing": initial_missing,
        "final_missing": final_missing,
        "duplicates_removed": dupes_removed,
        "outliers_detected_iqr": outliers_capped,
    }

    # Save cleaned dataset
    data_manager.set_clean_df(df, log)

    # Preview of cleaned data
    preview_slice = df.head(30).replace([np.inf, -np.inf], None).fillna("")

    return {
        "status": "success",
        "message": f"Dataset cleaned successfully. {initial_rows} -> {final_rows} rows.",
        "log": log,
        "preview": preview_slice.to_dict(orient="records"),
        "columns": list(df.columns)
    }
