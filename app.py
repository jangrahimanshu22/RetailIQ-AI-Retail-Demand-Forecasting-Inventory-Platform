"""
app.py
Retail Demand Forecasting System — Streamlit Dashboard
Run: streamlit run app.py
"""
import sys
from pathlib import Path
import tempfile
sys.path.append(str(Path(__file__).resolve().parent))

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from preprocessing.clean_data import full_cleaning_pipeline, report_missing
from feature_engineering.build_features import build_feature_pipeline
from training.train_models import train_and_compare, load_features
from forecasting.forecast import load_artifacts, recursive_forecast, HORIZONS
from utils.inventory_engine import compute_recommendations, generate_business_insights

st.set_page_config(page_title="Retail Demand Forecasting", layout="wide", page_icon="📦")

DATA_DIR = Path(__file__).resolve().parent / "data"
MODEL_DIR = Path(__file__).resolve().parent / "models"

# ---------------- Session state ----------------
for key in ["raw_df", "clean_df", "clean_log", "feature_df", "results_df", "best_model_name"]:
    if key not in st.session_state:
        st.session_state[key] = None

# ---------------- Sidebar navigation ----------------
st.sidebar.title("📦 Retail Forecast System")
theme = st.sidebar.radio("Theme", ["Light", "Dark"], horizontal=True)
page = st.sidebar.radio("Navigate", [
    "🏠 Home", "📁 Dataset Upload", "🧹 Data Cleaning", "📊 EDA Dashboard",
    "🤖 Model Training", "🔮 Forecast", "📦 Inventory Recommendations",
    "💡 Business Insights", "📄 Reports"
])

if theme == "Dark":
    st.markdown("""<style>
        .stApp { background-color: #0e1117; color: #fafafa; }
    </style>""", unsafe_allow_html=True)

# ================= HOME =================
if page == "🏠 Home":
    st.title("Retail Demand Forecasting System")
    st.markdown("""
    An end-to-end **AI-powered demand forecasting platform** for retail businesses.

    **What this system does:**
    - 📈 Predicts future product demand (7 days → 1 year ahead)
    - 🏭 Optimizes inventory: restock quantities, reorder points, safety stock
    - ⚠️ Flags stockout risk and overstock warnings automatically
    - 🧠 Trains & compares 7 ML models, auto-selecting the best performer
    - 📊 Interactive EDA: trends, seasonality, promotions, holiday impact

    **How to use this dashboard:**
    1. Go to **Dataset Upload** to load your CSV (or use the bundled sample data)
    2. Run **Data Cleaning** to preprocess it
    3. Explore **EDA Dashboard** for insights
    4. Train models in **Model Training**
    5. Generate predictions in **Forecast**
    6. Review **Inventory Recommendations** and **Business Insights**
    """)
    col1, col2, col3, col4 = st.columns(4)
    if (DATA_DIR / "retail_sales_data.csv").exists():
        df_preview = pd.read_csv(DATA_DIR / "retail_sales_data.csv")
        col1.metric("Sample Rows", f"{len(df_preview):,}")
        col2.metric("Products", df_preview["Product_ID"].nunique())
        col3.metric("Stores", df_preview["Store_ID"].nunique())
        col4.metric("Date Range", f"{df_preview['Date'].min()} → {df_preview['Date'].max()}")

# ================= DATASET UPLOAD =================
elif page == "📁 Dataset Upload":
    st.title("Dataset Upload")
    uploaded = st.file_uploader("Upload retail sales CSV", type=["csv"])
    c1, c2 = st.columns(2)
    use_sample = c1.button("Use bundled 2023-2024 sample")
    use_july_2026 = c2.button("Use bundled July 2026 sample")

    if uploaded is not None:
        st.session_state.raw_df = pd.read_csv(uploaded)
        st.success(f"Uploaded {len(st.session_state.raw_df):,} rows")
    elif use_sample:
        st.session_state.raw_df = pd.read_csv(DATA_DIR / "retail_sales_data.csv")
        st.success(f"Loaded sample dataset — {len(st.session_state.raw_df):,} rows")

    elif use_july_2026:
        st.session_state.raw_df = pd.read_csv(DATA_DIR / "retail_sales_data_july_2026.csv")
        st.success(f"Loaded July 2026 dataset â€” {len(st.session_state.raw_df):,} rows")

    if st.session_state.raw_df is not None:
        st.dataframe(st.session_state.raw_df.head(50), use_container_width=True)
        st.caption(f"Columns: {list(st.session_state.raw_df.columns)}")

# ================= DATA CLEANING =================
elif page == "🧹 Data Cleaning":
    st.title("Data Cleaning & Preprocessing")
    if st.session_state.raw_df is None:
        st.warning("Please upload a dataset first (Dataset Upload page).")
    else:
        if st.button("Run Cleaning Pipeline"):
            tmp_file = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
            tmp_path = Path(tmp_file.name)
            tmp_file.close()
            st.session_state.raw_df.to_csv(tmp_path, index=False)
            try:
                clean_df, log = full_cleaning_pipeline(str(tmp_path))
                st.session_state.clean_df = clean_df
                st.session_state.clean_log = log
                clean_df.to_csv(DATA_DIR / "retail_sales_clean.csv", index=False)
            finally:
                tmp_path.unlink(missing_ok=True)

        if st.session_state.clean_df is not None:
            log = st.session_state.clean_log
            c1, c2, c3 = st.columns(3)
            c1.metric("Initial Rows", log["initial_rows"])
            c2.metric("Duplicates Removed", log["duplicates_removed"])
            c3.metric("Final Rows", log["final_rows"])

            st.subheader("Missing Values (before cleaning)")
            st.json(log["missing_before"])
            st.subheader("Outliers Detected (IQR method)")
            st.json(log["outliers_detected_iqr"])

            st.subheader("Cleaned Data Preview")
            st.dataframe(st.session_state.clean_df.head(30), use_container_width=True)

# ================= EDA DASHBOARD =================
elif page == "📊 EDA Dashboard":
    st.title("Exploratory Data Analysis")
    df = st.session_state.clean_df
    if df is None and (DATA_DIR / "retail_sales_clean.csv").exists():
        df = pd.read_csv(DATA_DIR / "retail_sales_clean.csv")
    if df is None:
        st.warning("Run Data Cleaning first.")
    else:
        df["Date"] = pd.to_datetime(df["Date"])

        st.subheader("Overall Sales Trend")
        daily = df.groupby("Date")["Sales_Quantity"].sum().reset_index()
        st.plotly_chart(px.line(daily, x="Date", y="Sales_Quantity", title="Daily Sales Trend"),
                         use_container_width=True)

        c1, c2 = st.columns(2)
        with c1:
            monthly = df.groupby(df["Date"].dt.to_period("M").astype(str))["Sales_Quantity"].sum().reset_index()
            monthly.columns = ["Month", "Sales_Quantity"]
            st.plotly_chart(px.bar(monthly, x="Month", y="Sales_Quantity", title="Monthly Sales"),
                             use_container_width=True)
        with c2:
            cat_sales = df.groupby("Category")["Sales_Quantity"].sum().reset_index()
            st.plotly_chart(px.pie(cat_sales, names="Category", values="Sales_Quantity",
                                    title="Category-wise Sales Share"), use_container_width=True)

        c3, c4 = st.columns(2)
        with c3:
            store_sales = df.groupby("Store_Location")["Sales_Quantity"].sum().reset_index()
            st.plotly_chart(px.bar(store_sales, x="Store_Location", y="Sales_Quantity",
                                    title="Store-wise Sales", color="Store_Location"),
                             use_container_width=True)
        with c4:
            prod_sales = df.groupby("Product_Name")["Sales_Quantity"].sum().reset_index()
            st.plotly_chart(px.bar(prod_sales.sort_values("Sales_Quantity"), x="Sales_Quantity",
                                    y="Product_Name", orientation="h", title="Product-wise Sales"),
                             use_container_width=True)

        st.subheader("Correlation Heatmap")
        numeric_cols = ["Sales_Quantity", "Unit_Price", "Revenue", "Discount",
                        "Inventory_Level", "Competitor_Price", "Fuel_Price", "Economic_Index"]
        corr = df[numeric_cols].corr()
        st.plotly_chart(px.imshow(corr, text_auto=".2f", title="Feature Correlation Matrix",
                                   color_continuous_scale="RdBu_r"), use_container_width=True)

        c5, c6 = st.columns(2)
        with c5:
            st.plotly_chart(px.histogram(df, x="Sales_Quantity", nbins=50,
                                          title="Sales Quantity Distribution"), use_container_width=True)
        with c6:
            st.plotly_chart(px.box(df, x="Category", y="Sales_Quantity", title="Sales Boxplot by Category"),
                             use_container_width=True)

        st.subheader("Seasonal & Holiday Impact")
        c7, c8 = st.columns(2)
        with c7:
            season_sales = df.groupby("Season")["Sales_Quantity"].mean().reset_index()
            st.plotly_chart(px.bar(season_sales, x="Season", y="Sales_Quantity",
                                    title="Average Sales by Season"), use_container_width=True)
        with c8:
            holiday_sales = df.groupby("Holiday_Indicator")["Sales_Quantity"].mean().reset_index()
            holiday_sales["Holiday_Indicator"] = holiday_sales["Holiday_Indicator"].map({0: "Non-Holiday", 1: "Holiday"})
            st.plotly_chart(px.bar(holiday_sales, x="Holiday_Indicator", y="Sales_Quantity",
                                    title="Holiday vs Non-Holiday Avg Sales", color="Holiday_Indicator"),
                             use_container_width=True)

        st.subheader("Promotion Impact")
        promo_sales = df.groupby("Promotion")["Sales_Quantity"].mean().reset_index()
        promo_sales["Promotion"] = promo_sales["Promotion"].map({0: "No Promotion", 1: "Promotion"})
        st.plotly_chart(px.bar(promo_sales, x="Promotion", y="Sales_Quantity", color="Promotion",
                                title="Promotion vs Non-Promotion Avg Sales"), use_container_width=True)

# ================= MODEL TRAINING =================
elif page == "🤖 Model Training":
    st.title("Model Training & Comparison")
    st.markdown("Trains **7 regression models** (Linear Regression, Decision Tree, Random Forest, "
                "Extra Trees, Gradient Boosting, XGBoost, LightGBM) and auto-selects the best one "
                "by RMSE on a time-based holdout split.")

    if st.button("Run Feature Engineering + Train All Models"):
        with st.spinner("Building features..."):
            clean_path = DATA_DIR / "retail_sales_clean.csv"
            if not clean_path.exists():
                st.error("Run Data Cleaning first.")
                st.stop()
            clean_df = pd.read_csv(clean_path)
            feature_df, encoders = build_feature_pipeline(clean_df)
            feature_df.to_csv(DATA_DIR / "retail_sales_features.csv", index=False)
            st.session_state.feature_df = feature_df

        with st.spinner("Training models — this can take a minute..."):
            df = load_features(str(DATA_DIR / "retail_sales_features.csv"))
            results_df, best_name, best_model, feature_cols = train_and_compare(df)
            st.session_state.results_df = results_df
            st.session_state.best_model_name = best_name

    if st.session_state.results_df is not None:
        st.success(f"Best model: **{st.session_state.best_model_name}**")
        st.dataframe(st.session_state.results_df, use_container_width=True)
        st.plotly_chart(
            px.bar(st.session_state.results_df, x="Model", y="RMSE", color="Model",
                   title="Model Comparison — RMSE (lower is better)"),
            use_container_width=True
        )
        st.plotly_chart(
            px.bar(st.session_state.results_df, x="Model", y="R2", color="Model",
                   title="Model Comparison — R² Score (higher is better)"),
            use_container_width=True
        )
    elif (MODEL_DIR / "model_comparison.csv").exists():
        st.info("Showing results from the last training run:")
        st.dataframe(pd.read_csv(MODEL_DIR / "model_comparison.csv"), use_container_width=True)

# ================= FORECAST =================
elif page == "🔮 Forecast":
    st.title("Demand Forecast")
    if not (MODEL_DIR / "best_model.pkl").exists():
        st.warning("Train a model first (Model Training page).")
    else:
        feature_path = DATA_DIR / "retail_sales_features.csv"
        if not feature_path.exists():
            st.warning("Run Model Training first to generate the feature dataset.")
            st.stop()
        hist = pd.read_csv(feature_path)

        c1, c2, c3 = st.columns(3)
        product_id = c1.selectbox("Product", sorted(hist["Product_ID"].unique()))
        store_id = c2.selectbox("Store", sorted(hist["Store_ID"].unique()))
        horizon_label = c3.selectbox("Horizon", list(HORIZONS.keys()))

        if st.button("Generate Forecast"):
            model, feature_cols = load_artifacts()
            horizon_days = HORIZONS[horizon_label]
            fc = recursive_forecast(hist, model, feature_cols, product_id, store_id, horizon_days)
            st.session_state["last_forecast"] = fc

            st.plotly_chart(
                px.line(fc, x="Date", y="Predicted_Sales_Quantity",
                        title=f"{horizon_label} Forecast — {product_id} @ {store_id}"),
                use_container_width=True
            )
            st.dataframe(fc, use_container_width=True)
            st.download_button("Download Forecast (CSV)", fc.to_csv(index=False),
                                file_name=f"forecast_{product_id}_{store_id}.csv")

# ================= INVENTORY RECOMMENDATIONS =================
elif page == "📦 Inventory Recommendations":
    st.title("Inventory Recommendation Engine")
    if "last_forecast" not in st.session_state:
        st.warning("Generate a forecast first (Forecast page).")
    else:
        clean_path = DATA_DIR / "retail_sales_clean.csv"
        if clean_path.exists():
            hist = pd.read_csv(clean_path)
            recs = compute_recommendations(hist, st.session_state["last_forecast"])
            st.dataframe(recs, use_container_width=True)

            for _, r in recs.iterrows():
                if r["Alert"] == "STOCKOUT RISK":
                    st.error(f"🔴 {r['Product_ID']} @ {r['Store_ID']}: STOCKOUT RISK — restock "
                             f"{r['Recommended_Restock_Qty']} units")
                elif r["Alert"] == "OVERSTOCK WARNING":
                    st.warning(f"🟡 {r['Product_ID']} @ {r['Store_ID']}: OVERSTOCK WARNING")
                elif r["Alert"] == "REORDER SOON":
                    st.info(f"🔵 {r['Product_ID']} @ {r['Store_ID']}: Reorder point approaching")

# ================= BUSINESS INSIGHTS =================
elif page == "💡 Business Insights":
    st.title("Automated Business Insights")
    clean_path = DATA_DIR / "retail_sales_clean.csv"
    if not clean_path.exists():
        st.warning("Run Data Cleaning first.")
    else:
        hist = pd.read_csv(clean_path)
        insights = generate_business_insights(hist)

        c1, c2 = st.columns(2)
        with c1:
            st.subheader("🏆 Best Selling Products")
            st.dataframe(pd.DataFrame(insights["best_selling"]), use_container_width=True)
        with c2:
            st.subheader("📉 Worst Selling Products")
            st.dataframe(pd.DataFrame(insights["worst_selling"]), use_container_width=True)

        st.subheader(f"🔥 Fastest-moving category: **{insights['top_category']}**")

        c3, c4 = st.columns(2)
        with c3:
            st.subheader("⚠️ Lowest Performing Stores")
            st.dataframe(pd.DataFrame(insights["low_performing_stores"]), use_container_width=True)
        with c4:
            st.subheader("💰 Highest Revenue Products")
            st.dataframe(pd.DataFrame(insights["high_revenue_products"]), use_container_width=True)

# ================= REPORTS =================
elif page == "📄 Reports":
    st.title("Reports")
    clean_path = DATA_DIR / "retail_sales_clean.csv"
    if clean_path.exists():
        df = pd.read_csv(clean_path)
        st.download_button("Download Cleaned Dataset (CSV)", df.to_csv(index=False),
                            file_name="retail_sales_clean.csv")
    if (MODEL_DIR / "model_comparison.csv").exists():
        comp = pd.read_csv(MODEL_DIR / "model_comparison.csv")
        st.download_button("Download Model Comparison Report (CSV)", comp.to_csv(index=False),
                            file_name="model_comparison_report.csv")
    st.info("PDF report export can be added via the `pdf` skill / reportlab — see reports/README.md")
