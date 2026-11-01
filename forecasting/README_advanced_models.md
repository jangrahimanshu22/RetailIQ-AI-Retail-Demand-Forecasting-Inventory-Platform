# Advanced Forecasting Models — Extension Guide

The core system (`training/train_models.py`) ships with 7 working, tested
regression models (Linear Regression, Decision Tree, Random Forest, Extra
Trees, Gradient Boosting, XGBoost, LightGBM). The models below are common
"industry standard" additions — here's how to plug each one in.

## CatBoost
```python
from catboost import CatBoostRegressor
model = CatBoostRegressor(iterations=300, depth=6, verbose=0)
# add to get_model_zoo() in training/train_models.py — handles categoricals natively,
# so you can pass Product_ID/Store_ID as cat_features instead of label-encoding them.
```

## ARIMA / SARIMA (statsmodels)
Best suited to a *single* product-store series (not the full panel dataset).
```python
from statsmodels.tsa.statespace.sarimax import SARIMAX
series = df[(df.Product_ID=="P001") & (df.Store_ID=="S01")].set_index("Date")["Sales_Quantity"]
model = SARIMAX(series, order=(1,1,1), seasonal_order=(1,1,1,7)).fit()
forecast = model.forecast(steps=30)
```

## Prophet
```python
from prophet import Prophet
prophet_df = series.reset_index().rename(columns={"Date": "ds", "Sales_Quantity": "y"})
m = Prophet(yearly_seasonality=True, weekly_seasonality=True)
m.fit(prophet_df)
future = m.make_future_dataframe(periods=90)
forecast = m.predict(future)
```

## LSTM / GRU (TensorFlow/Keras)
Requires reshaping the series into (samples, timesteps, features) windows.
```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

model = Sequential([
    LSTM(64, input_shape=(30, 1), return_sequences=True),
    LSTM(32),
    Dense(1)
])
model.compile(optimizer="adam", loss="mse")
# X shape: (n_samples, 30_day_window, 1) built via a sliding window over Sales_Quantity
```

## SHAP Explainability
```python
import shap
explainer = shap.TreeExplainer(best_model)   # works for tree-based models
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test)
```

## Optuna Hyperparameter Tuning
```python
import optuna
def objective(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 500),
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
    }
    model = xgb.XGBRegressor(**params)
    model.fit(X_train, y_train)
    return mean_squared_error(y_test, model.predict(X_test), squared=False)

study = optuna.create_study(direction="minimize")
study.optimize(objective, n_trials=50)
```

## MLflow Experiment Tracking
```python
import mlflow
with mlflow.start_run():
    mlflow.log_params(model.get_params())
    mlflow.log_metrics({"rmse": rmse, "mae": mae, "r2": r2})
    mlflow.sklearn.log_model(model, "model")
```

## FastAPI Serving Layer
```python
from fastapi import FastAPI
import joblib, pandas as pd

app = FastAPI()
model = joblib.load("models/best_model.pkl")
feature_cols = joblib.load("models/feature_columns.pkl")

@app.post("/predict")
def predict(payload: dict):
    X = pd.DataFrame([payload])[feature_cols].fillna(0)
    return {"predicted_demand": float(model.predict(X)[0])}
```
Run with: `uvicorn deployment.api:app --reload`

## CI/CD (GitHub Actions)
See `deployment/ci_cd_pipeline.yml` for a starter workflow that installs
dependencies, runs the preprocessing/training smoke test, and builds the
Docker image on every push to `main`.
