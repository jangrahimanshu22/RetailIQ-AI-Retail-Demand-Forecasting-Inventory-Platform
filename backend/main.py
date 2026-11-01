"""
main.py
FastAPI Entry Point for RetailIQ — Enterprise Retail Demand Forecasting & Inventory SaaS Platform
"""
import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api import (
    dataset,
    cleaning,
    eda,
    overview,
    models,
    forecast,
    inventory,
    insights,
    reports,
    settings,
)

app = FastAPI(
    title="RetailIQ — Enterprise AI Demand Forecasting API",
    description="Enterprise-grade retail analytics, machine learning demand forecasting, and inventory optimization engine.",
    version="2.4.0",
)

# Configure CORS for local development and production frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(dataset.router)
app.include_router(cleaning.router)
app.include_router(eda.router)
app.include_router(overview.router)
app.include_router(models.router)
app.include_router(forecast.router)
app.include_router(inventory.router)
app.include_router(insights.router)
app.include_router(reports.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "platform": "RetailIQ Enterprise AI SaaS",
        "status": "operational",
        "version": "2.4.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
