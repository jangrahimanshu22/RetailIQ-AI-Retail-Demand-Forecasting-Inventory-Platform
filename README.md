# RetailIQ — Enterprise AI Retail Demand Forecasting & Inventory Platform

> **Transforming retail analytics into a modern, commercial-grade AI SaaS intelligence suite.**

RetailIQ is an enterprise-grade AI retail demand forecasting, exploratory data analysis, and inventory optimization platform. It combines a high-performance **FastAPI** Python backend (reusing all machine learning regression models, preprocessing pipelines, and recursive forecasting engines) with a modern **React.js + Vite + Tailwind CSS** enterprise dashboard.

---

## 🌟 Platform Highlights

- **Executive Overview Dashboard**: High-level KPI telemetry (Net Revenue, Sales Quantity, Catalog SKUs, Store Throughput, Forecast Accuracy, Best Model badge) with area trends and inventory health distribution.
- **Dataset Management**: Drag-and-drop CSV upload with real-time schema validation, partition switching (Raw, Cleaned, Features), pagination, statistical profiles, and sample loaders (2023–2024 & July 2026).
- **Data Cleaning Engine**: In-depth missing value analysis with suggested imputation, duplicate purging, and IQR / Z-score outlier detection and clipping with before-and-after benchmarks.
- **Exploratory Data Analysis (EDA)**: 11 interactive visualizations including continuous daily trends, monthly revenue bars, category velocity, store efficiency, feature correlation matrix heatmap, sales frequency distributions, boxplots, and seasonal/holiday/promotion elasticity analysis.
- **Model Training & Comparison**: Full benchmarks across **7 regression algorithms**:
  1. LightGBM (Current champion: 0.786 RMSE, 0.9992 R²)
  2. XGBoost (0.791 RMSE, 0.9992 R²)
  3. Gradient Boosting (0.986 RMSE)
  4. Extra Trees (1.503 RMSE)
  5. Random Forest (1.518 RMSE)
  6. Decision Tree (2.075 RMSE)
  7. Linear Regression (4.601 RMSE)
  - Features real-time out-of-time cross validation, automated best model selection, and top feature importance rankings.
- **Recursive Demand Forecasting**: Multi-horizon predictions (7 Days, 30 Days, 90 Days, 6 Months, 1 Year) with empirical 95% confidence intervals, actual vs. predicted curves, peak demand detection, and safety buffer estimates.
- **Inventory Optimization**: Reorder point (ROP) calculation, dynamic safety stock, restock quantity recommendations, and risk categorization (Critical Stockouts, Low Stock, Healthy, Overstock).
- **Business Intelligence**: Automated diagnostics of best/worst selling items, fastest moving categories, lowest performing store locations, promotional uplift percentage, and actionable executive recommendations.
- **Reports & Export Center**: Instant one-click generation of PDF Executive Dossiers (via ReportLab), multi-tab Excel workbooks (.xlsx via OpenPyXL), and raw CSV extracts.
- **Dual Theme Experience**: Polished Dark Mode (Navy/Charcoal/Indigo) and Light Mode.

---

## 🏗️ Technology Architecture

```
retail-demand-forecasting/
│
├── frontend/                         # Modern React + Vite Enterprise Client
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, KPICards, Toasts, Skeletons
│   │   ├── pages/                    # 10 Dedicated Enterprise Dashboard Pages
│   │   ├── context/                  # AppContext (Theme, Status, Notifications)
│   │   ├── services/                 # api.js client connected to FastAPI
│   │   ├── App.jsx                   # Framer-motion animated page router
│   │   └── index.css                 # Tailwind design system & Google Fonts
│   ├── vite.config.js                # Vite config with backend proxy
│   └── package.json
│
├── backend/                          # FastAPI Microservice Backend
│   ├── api/
│   │   ├── dataset.py                # Ingestion, preview, stats, upload
│   │   ├── cleaning.py               # Preprocessing, duplicate/outlier audits
│   │   ├── eda.py                    # 11 interactive chart data feeds
│   │   ├── overview.py               # KPI aggregation & risk telemetry
│   │   ├── models.py                 # 7-model training & comparison
│   │   ├── forecast.py               # Multi-horizon recursive forecasting
│   │   ├── inventory.py              # Restock engine, safety stock, ROP
│   │   ├── insights.py               # Automated BI & promotional uplift
│   │   ├── reports.py                # PDF (ReportLab) & Excel (OpenPyXL)
│   │   └── settings.py               # Engine hyperparameters & config
│   ├── services/
│   │   └── data_manager.py           # Singleton data cache & state manager
│   └── main.py                       # FastAPI entry point with CORS
│
├── preprocessing/clean_data.py       # Preserved original data cleaning
├── feature_engineering/build_features.py # Preserved lag & rolling features
├── training/train_models.py          # Preserved 7-model training logic
├── forecasting/forecast.py           # Preserved recursive forecasting
├── utils/inventory_engine.py         # Preserved inventory & BI engine
├── data/                             # Raw, Cleaned, & Featured CSV datasets
├── models/                           # Serialized best model & metadata
├── run_enterprise_saas.bat           # 1-Click Launch for Frontend + Backend
└── README.md
```

---

## 🚀 Quick Start Guide

### Option 1: One-Click Startup (Recommended)
Simply double-click:
```bat
run_enterprise_saas.bat
```
This automatically boots the FastAPI backend on `http://127.0.0.1:8000`, the React Vite frontend on `http://127.0.0.1:5173`, and opens the dashboard in your default browser.

### Option 2: Manual Startup

**1. Start the FastAPI Backend:**
```powershell
# Using the project's Python environment
& "$env:LOCALAPPDATA\RetailDemandForecast\venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Swagger documentation is live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

**2. Start the React Frontend:**
```bash
cd frontend
npm run dev
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 📊 Preserved Core Machine Learning Models

All 7 models are directly integrated with time-series evaluation:

| Algorithm | MAE | RMSE | MSE | MAPE (%) | R² Score | CV RMSE | Train Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **LightGBM (Best)** | **0.450** | **0.786** | **0.618** | **1.52%** | **0.9992** | **1.736** | **1.07s** |
| **XGBoost** | 0.429 | 0.791 | 0.626 | 1.45% | 0.9992 | 1.781 | 1.42s |
| **Gradient Boosting** | 0.691 | 0.986 | 0.972 | 2.06% | 0.9988 | 1.109 | 33.58s |
| **Extra Trees** | 0.951 | 1.503 | 2.258 | 2.60% | 0.9971 | 1.846 | 6.02s |
| **Random Forest** | 0.708 | 1.518 | 2.305 | 2.28% | 0.9971 | 1.355 | 13.45s |
| **Decision Tree** | 1.215 | 2.075 | 4.306 | 3.48% | 0.9945 | 2.622 | 0.52s |
| **Linear Regression** | 3.331 | 4.601 | 21.167 | 11.07% | 0.9731 | 4.971 | 0.08s |

---

## 🔒 Preserved Original Streamlit Application
The original Streamlit application remains functional and untouched:
```powershell
& "$env:LOCALAPPDATA\RetailDemandForecast\venv\Scripts\python.exe" -m streamlit run app.py
```
