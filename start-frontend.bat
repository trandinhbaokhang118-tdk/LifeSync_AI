@echo off
echo ========================================
echo   TimeManager - Starting Frontend
echo ========================================
echo.
cd /d "%~dp0frontend"
echo Starting frontend static server...
echo Frontend will run at: http://localhost:5173/
echo.
echo Press Ctrl+C to stop frontend
echo ========================================
serve -s dist -l 5173
