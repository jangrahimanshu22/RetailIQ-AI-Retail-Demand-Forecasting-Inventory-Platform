"""config.py — central configuration for the Retail Demand Forecasting System."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

RAW_DATA_FILE = DATA_DIR / "retail_sales_data.csv"
CLEAN_DATA_FILE = DATA_DIR / "retail_sales_clean.csv"
FEATURE_DATA_FILE = DATA_DIR / "retail_sales_features.csv"

TARGET_COLUMN = "Sales_Quantity"
DATE_COLUMN = "Date"

TIME_SPLIT_TEST_FRACTION = 0.2
CROSS_VAL_FOLDS = 3

INVENTORY_LEAD_TIME_DAYS = 7
INVENTORY_SERVICE_LEVEL_Z = 1.65   # ~95% service level

DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "",
    "database": "retail_forecast_db",
}
