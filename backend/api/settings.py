"""
settings.py
API router for application and model system settings.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# Global application settings state
app_settings = {
    "default_horizon": "30 Days",
    "default_lead_time_days": 7,
    "default_service_level": 0.95,
    "theme": "dark",
    "enable_auto_retrain": False,
    "platform_name": "RetailIQ AI SaaS Enterprise",
    "api_version": "2.4.0",
}

class SettingsUpdate(BaseModel):
    default_horizon: Optional[str] = None
    default_lead_time_days: Optional[int] = None
    default_service_level: Optional[float] = None
    theme: Optional[str] = None
    enable_auto_retrain: Optional[bool] = None

@router.get("/config")
def get_settings():
    return app_settings

@router.post("/config")
def update_settings(update: SettingsUpdate):
    for k, v in update.model_dump(exclude_unset=True).items():
        if v is not None:
            app_settings[k] = v
    return {"status": "success", "settings": app_settings}
