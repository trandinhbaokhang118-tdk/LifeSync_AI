@echo off
echo ========================================
echo   TimeManager - Starting Backend
echo ========================================
echo.
cd /d "%~dp0backend"
echo Starting backend in production mode...
echo Backend will run at: http://127.0.0.1:3000
echo API Docs at: http://127.0.0.1:3000/api-docs
echo.
echo Press Ctrl+C to stop backend
echo ========================================
npm run start:prod
