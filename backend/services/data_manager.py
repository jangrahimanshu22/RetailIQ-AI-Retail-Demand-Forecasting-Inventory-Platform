"""
data_manager.py
Manages datasets, model state, and provides cached data access for the FastAPI backend.
"""
from pathlib import Path
import pandas as pd
import json

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

class DataManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataManager, cls).__new__(cls)
            cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self.raw_path = DATA_DIR / "retail_sales_data.csv"
        self.clean_path = DATA_DIR / "retail_sales_clean.csv"
        self.feature_path = DATA_DIR / "retail_sales_features.csv"
        self.uploaded_path = DATA_DIR / "uploaded_retail_sales.csv"

        self._raw_cache = None
        self._clean_cache = None
        self._feature_cache = None
        self.cleaning_log = None

    def get_raw_df(self) -> pd.DataFrame:
        if self._raw_cache is None:
            active_path = self.uploaded_path if self.uploaded_path.exists() else self.raw_path
            if active_path.exists():
                self._raw_cache = pd.read_csv(active_path)
            else:
                return pd.DataFrame()
        return self._raw_cache

    def set_raw_df(self, df: pd.DataFrame, is_upload: bool = True):
        self._raw_cache = df
        if is_upload:
            df.to_csv(self.uploaded_path, index=False)
        else:
            df.to_csv(self.raw_path, index=False)
        # Invalidate downstream
        self._clean_cache = None
        self._feature_cache = None

    def load_sample_dataset(self, sample_name: str = "sample_2023_2024") -> pd.DataFrame:
        if sample_name == "july_2026":
            path = DATA_DIR / "retail_sales_data_july_2026.csv"
        else:
            path = DATA_DIR / "retail_sales_data.csv"
        
        if not path.exists():
            raise FileNotFoundError(f"Sample file {path.name} not found")
        
        df = pd.read_csv(path)
        self._raw_cache = df
        if self.uploaded_path.exists():
            try:
                self.uploaded_path.unlink()
            except Exception:
                pass
        self._clean_cache = None
        self._feature_cache = None
        return df

    def get_clean_df(self) -> pd.DataFrame:
        if self._clean_cache is None:
            if self.clean_path.exists():
                self._clean_cache = pd.read_csv(self.clean_path)
            else:
                # Fallback to cleaning raw if clean doesn't exist
                raw = self.get_raw_df()
                if not raw.empty:
                    from preprocessing.clean_data import full_cleaning_pipeline
                    clean_df, log = full_cleaning_pipeline(str(self.raw_path if self.raw_path.exists() else self.uploaded_path))
                    self._clean_cache = clean_df
                    self.cleaning_log = log
                    clean_df.to_csv(self.clean_path, index=False)
                else:
                    return pd.DataFrame()
        return self._clean_cache

    def set_clean_df(self, df: pd.DataFrame, log: dict = None):
        self._clean_cache = df
        self.cleaning_log = log
        df.to_csv(self.clean_path, index=False)
        self._feature_cache = None

    def get_feature_df(self) -> pd.DataFrame:
        if self._feature_cache is None:
            if self.feature_path.exists():
                self._feature_cache = pd.read_csv(self.feature_path)
            else:
                clean = self.get_clean_df()
                if not clean.empty:
                    from feature_engineering.build_features import build_feature_pipeline
                    fdf, _ = build_feature_pipeline(clean)
                    self._feature_cache = fdf
                    fdf.to_csv(self.feature_path, index=False)
                else:
                    return pd.DataFrame()
        return self._feature_cache

    def set_feature_df(self, df: pd.DataFrame):
        self._feature_cache = df
        df.to_csv(self.feature_path, index=False)

    def get_dataset_status(self) -> dict:
        raw_rows = len(self.get_raw_df()) if not self.get_raw_df().empty else 0
        clean_rows = len(self.get_clean_df()) if not self.get_clean_df().empty else 0
        feature_rows = len(self.get_feature_df()) if not self.get_feature_df().empty else 0
        has_model = (MODEL_DIR / "best_model.pkl").exists()
        best_model_name = None
        if (MODEL_DIR / "best_model_info.json").exists():
            try:
                with open(MODEL_DIR / "best_model_info.json", "r") as f:
                    info = json.load(f)
                    best_model_name = info.get("best_model")
            except Exception:
                pass

        return {
            "has_raw": raw_rows > 0,
            "raw_rows": raw_rows,
            "has_clean": clean_rows > 0,
            "clean_rows": clean_rows,
            "has_features": feature_rows > 0,
            "feature_rows": feature_rows,
            "has_model": has_model,
            "best_model": best_model_name
        }

data_manager = DataManager()
