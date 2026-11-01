"""
generate_dataset.py
Generates realistic synthetic retail sales datasets matching the project schema.
Run: python data/generate_dataset.py
Outputs:
- data/retail_sales_data.csv
- data/retail_sales_data_july_2026.csv
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

np.random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent
BASE_START_DATE = datetime(2023, 1, 1)
BASE_N_DAYS = 730  # 2 years of daily data
JULY_2026_START_DATE = datetime(2026, 7, 1)
JULY_2026_N_DAYS = 31

PRODUCTS = [
    ("P001", "Wireless Mouse", "Electronics"),
    ("P002", "Bluetooth Speaker", "Electronics"),
    ("P003", "Office Chair", "Furniture"),
    ("P004", "Study Desk", "Furniture"),
    ("P005", "Running Shoes", "Footwear"),
    ("P006", "Formal Shoes", "Footwear"),
    ("P007", "Cotton T-Shirt", "Apparel"),
    ("P008", "Denim Jeans", "Apparel"),
    ("P009", "Green Tea", "Grocery"),
    ("P010", "Instant Noodles", "Grocery"),
]

STORES = [
    ("S01", "Delhi"),
    ("S02", "Mumbai"),
    ("S03", "Bangalore"),
    ("S04", "Chennai"),
]

SEASONS = {12: "Winter", 1: "Winter", 2: "Winter",
           3: "Spring", 4: "Spring", 5: "Spring",
           6: "Summer", 7: "Summer", 8: "Summer",
           9: "Autumn", 10: "Autumn", 11: "Autumn"}

INDIAN_HOLIDAYS_APPROX = {
    "01-26", "08-15", "10-02", "12-25", "11-01", "03-08", "10-24", "11-12"
}

def generate_dataset(start_date: datetime, n_days: int,
                     output_path: Path, add_training_noise: bool = True) -> pd.DataFrame:
    rows = []
    dates = [start_date + timedelta(days=i) for i in range(n_days)]

    for date in dates:
        day_key = date.strftime("%m-%d")
        is_holiday = 1 if day_key in INDIAN_HOLIDAYS_APPROX else 0
        season = SEASONS[date.month]
        weather = np.random.choice(["Sunny", "Rainy", "Cloudy", "Cold"], p=[0.45, 0.2, 0.25, 0.1])
        fuel_price = round(95 + np.random.normal(0, 3) + 5 * np.sin(date.timetuple().tm_yday / 60), 2)
        economic_index = round(100 + np.random.normal(0, 2) + 0.01 * date.timetuple().tm_yday, 2)

        for pid, pname, category in PRODUCTS:
            base_price = {"Electronics": 1200, "Furniture": 4500, "Footwear": 1800,
                          "Apparel": 700, "Grocery": 120}[category]
            unit_price = round(base_price * np.random.uniform(0.9, 1.1), 2)
            competitor_price = round(unit_price * np.random.uniform(0.9, 1.15), 2)

            for sid, location in STORES:
                base_demand = {"Electronics": 25, "Furniture": 6, "Footwear": 18,
                               "Apparel": 30, "Grocery": 60}[category]

                weekday_factor = 1.3 if date.weekday() >= 5 else 1.0
                holiday_factor = 1.8 if is_holiday else 1.0
                season_factor = 1.2 if season in ["Winter", "Autumn"] else 1.0
                trend_factor = 1 + 0.0004 * (date - BASE_START_DATE).days
                noise = np.random.normal(1, 0.15)

                promotion = np.random.choice([0, 1], p=[0.85, 0.15])
                discount = round(np.random.uniform(5, 30), 1) if promotion else 0.0
                promo_factor = 1 + (discount / 100) * 1.5 if promotion else 1.0

                sales_quantity = max(
                    0,
                    int(base_demand * weekday_factor * holiday_factor * season_factor
                        * trend_factor * promo_factor * noise)
                )

                inventory_level = max(0, int(sales_quantity * np.random.uniform(1.5, 3.5)))
                revenue = round(sales_quantity * unit_price * (1 - discount / 100), 2)
                customer_id = f"C{np.random.randint(1000, 9999)}"

                rows.append([
                    date.strftime("%Y-%m-%d"), pid, pname, category, sid, location,
                    customer_id, sales_quantity, unit_price, revenue, promotion,
                    discount, is_holiday, season, inventory_level, weather,
                    competitor_price, fuel_price, economic_index
                ])

    df = pd.DataFrame(rows, columns=[
        "Date", "Product_ID", "Product_Name", "Category", "Store_ID", "Store_Location",
        "Customer_ID", "Sales_Quantity", "Unit_Price", "Revenue", "Promotion",
        "Discount", "Holiday_Indicator", "Season", "Inventory_Level", "Weather",
        "Competitor_Price", "Fuel_Price", "Economic_Index"
    ])

    if add_training_noise:
        # Keep a few data-quality issues in the larger training sample so preprocessing stays meaningful.
        missing_idx = np.random.choice(df.index, size=max(1, int(0.01 * len(df))), replace=False)
        df.loc[missing_idx, "Inventory_Level"] = np.nan
        missing_idx2 = np.random.choice(df.index, size=max(1, int(0.005 * len(df))), replace=False)
        df.loc[missing_idx2, "Unit_Price"] = np.nan
        duplicate_count = min(50, len(df))
        df = pd.concat([df, df.sample(duplicate_count, random_state=1)], ignore_index=True)

    df.to_csv(output_path, index=False)
    print(f"Generated {len(df):,} rows -> {output_path}")
    return df


if __name__ == "__main__":
    generate_dataset(
        start_date=BASE_START_DATE,
        n_days=BASE_N_DAYS,
        output_path=OUTPUT_DIR / "retail_sales_data.csv",
        add_training_noise=True,
    )
    generate_dataset(
        start_date=JULY_2026_START_DATE,
        n_days=JULY_2026_N_DAYS,
        output_path=OUTPUT_DIR / "retail_sales_data_july_2026.csv",
        add_training_noise=False,
    )
