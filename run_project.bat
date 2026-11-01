@echo off
setlocal
cd /d "%~dp0"

set "ENV_DIR=%LOCALAPPDATA%\RetailDemandForecast\venv"
set "PYTHON=%ENV_DIR%\Scripts\python.exe"

if not exist "%PYTHON%" (
    set "BASE_PYTHON=%LOCALAPPDATA%\Programs\Python\Python314\python.exe"
    if not exist "%BASE_PYTHON%" (
        echo Python 3.14 was not found at "%BASE_PYTHON%".
        echo Install Python 3.14, then run this file again.
        pause
        exit /b 1
    )
    "%BASE_PYTHON%" -m venv "%ENV_DIR%"
    if errorlevel 1 goto failed
)

"%PYTHON%" -c "import streamlit, pandas, numpy" >nul 2>&1
if errorlevel 1 (
    "%PYTHON%" -m pip install -r "%~dp0requirements.txt"
    if errorlevel 1 goto failed
)

if not exist "data\retail_sales_data.csv" (
    "%PYTHON%" "data\generate_dataset.py"
    if errorlevel 1 goto failed
)

"%PYTHON%" -m streamlit run "%~dp0app.py"
if errorlevel 1 goto failed
exit /b 0

:failed
echo.
echo The project could not start. Review the error above.
pause
exit /b 1