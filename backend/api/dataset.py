"""
dataset.py
Endpoints for dataset upload, sample loading, preview, statistics, and downloads.
"""
from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from fastapi.responses import FileResponse
from typing import Optional
import pandas as pd
import numpy as np
import io

from backend.services.data_manager import data_manager, DATA_DIR

router = APIRouter(prefix="/api/dataset", tags=["Dataset Management"])

@router.get("/status")
def get_dataset_status():
    return data_manager.get_dataset_status()

@router.get("/preview")
def get_dataset_preview(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    dataset_type: str = Query("raw", pattern="^(raw|clean|features)$")
):
    if dataset_type == "clean":
        df = data_manager.get_clean_df()
    elif dataset_type == "features":
        df = data_manager.get_feature_df()
    else:
        df = data_manager.get_raw_df()

    if df.empty:
        return {
            "columns": [],
            "data": [],
            "total_rows": 0,
            "page": page,
            "limit": limit,
            "total_pages": 0
        }

    # Filter if search query provided
    filtered_df = df
    if search:
        search_lower = search.strip().lower()
        mask = filtered_df.astype(str).apply(
            lambda col: col.str.lower().str.contains(search_lower, na=False)
        ).any(axis=1)
        filtered_df = filtered_df[mask]

    total_rows = len(filtered_df)
    total_pages = max(1, (total_rows + limit - 1) // limit)
    start_idx = (page - 1) * limit
    end_idx = min(start_idx + limit, total_rows)

    page_slice = filtered_df.iloc[start_idx:end_idx].copy()
    # Replace NaN and inf with None/string for JSON serialization
    page_slice = page_slice.replace([np.inf, -np.inf], None).fillna("")

    return {
        "columns": list(df.columns),
        "data": page_slice.to_dict(orient="records"),
        "total_rows": total_rows,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/stats")
def get_dataset_stats(dataset_type: str = Query("raw", pattern="^(raw|clean|features)$")):
    if dataset_type == "clean":
        df = data_manager.get_clean_df()
    elif dataset_type == "features":
        df = data_manager.get_feature_df()
    else:
        df = data_manager.get_raw_df()

    if df.empty:
        return {"columns_stats": [], "summary": {}}

    stats = []
    for col in df.columns:
        s = df[col]
        dtype_str = str(s.dtype)
        null_count = int(s.isnull().sum())
        null_pct = round(null_count / len(df) * 100, 2)
        unique_count = int(s.nunique())
        
        col_stat = {
            "name": col,
            "dtype": dtype_str,
            "null_count": null_count,
            "null_pct": null_pct,
            "unique_count": unique_count,
        }

        if pd.api.types.is_numeric_dtype(s):
            col_stat.update({
                "min": round(float(s.min()), 2) if not pd.isna(s.min()) else None,
                "max": round(float(s.max()), 2) if not pd.isna(s.max()) else None,
                "mean": round(float(s.mean()), 2) if not pd.isna(s.mean()) else None,
                "std": round(float(s.std()), 2) if not pd.isna(s.std()) else None,
            })
        else:
            col_stat.update({
                "top_value": str(s.mode().iloc[0]) if not s.mode().empty else None,
            })
        stats.append(col_stat)

    duplicates = int(df.duplicated().sum())

    summary = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "duplicate_rows": duplicates,
        "missing_cells": int(df.isnull().sum().sum()),
        "memory_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
    }

    return {"columns_stats": stats, "summary": summary}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    data_manager.set_raw_df(df, is_upload=True)
    return {
        "message": f"Successfully uploaded {file.filename}",
        "rows": len(df),
        "columns": list(df.columns)
    }

@router.post("/sample")
def load_sample(sample_name: str = Query("sample_2023_2024", pattern="^(sample_2023_2024|july_2026)$")):
    try:
        df = data_manager.load_sample_dataset(sample_name)
        return {
            "message": f"Successfully loaded {sample_name}",
            "rows": len(df),
            "columns": list(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download")
def download_dataset(dataset_type: str = Query("raw", pattern="^(raw|clean|features)$")):
    if dataset_type == "clean":
        path = data_manager.clean_path
        filename = "retail_sales_clean.csv"
    elif dataset_type == "features":
        path = data_manager.feature_path
        filename = "retail_sales_features.csv"
    else:
        path = data_manager.uploaded_path if data_manager.uploaded_path.exists() else data_manager.raw_path
        filename = "retail_sales_data.csv"

    if not path.exists():
        raise HTTPException(status_code=404, detail="Dataset file not found")

    return FileResponse(path, filename=filename, media_type="text/csv")
