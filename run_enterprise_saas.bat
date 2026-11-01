@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo    RetailIQ Enterprise Demand Forecasting ^& Inventory SaaS Platform
echo ======================================================================
echo.

set "ENV_DIR=%LOCALAPPDATA%\RetailDemandForecast\venv"
set "PYTHON=%ENV_DIR%\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo Python environment was not found at "%PYTHON%".
    echo Please make sure the venv is created.
    pause
    exit /b 1
)

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "RetailIQ Backend API" cmd /k "cd /d "%~dp0" && "%PYTHON%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting React Vite Frontend on http://127.0.0.1:5173 ...
start "RetailIQ Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Opening RetailIQ in your browser...
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173

echo.
echo ======================================================================
echo    RetailIQ is now running!
echo    - Frontend UI:  http://127.0.0.1:5173
echo    - Backend API:  http://127.0.0.1:8000
echo    - Swagger Docs: http://127.0.0.1:8000/docs
echo ======================================================================
echo.
pause
