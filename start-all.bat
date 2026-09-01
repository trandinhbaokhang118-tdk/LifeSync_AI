@echo off
echo ========================================
echo   TimeManager - Starting All Services
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/3] Starting MySQL Database...
cd /d "%~dp0"
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start database!
    pause
    exit /b 1
)
echo [OK] Database started successfully
echo.

echo [2/3] Starting Backend...
start "TimeManager Backend" cmd /k "%~dp0start-backend.bat"
timeout /t 5 /nobreak >nul
echo [OK] Backend started in new window
echo.

echo [3/3] Starting Frontend...
start "TimeManager Frontend" cmd /k "%~dp0start-frontend.bat"
timeout /t 3 /nobreak >nul
echo [OK] Frontend started in new window
echo.

echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:3000
echo Frontend: http://localhost:5173/
echo API Docs: http://127.0.0.1:3000/api-docs
echo.
echo Opening app in browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173/
echo.
echo To stop all services:
echo 1. Close Backend window
echo 2. Close Frontend window
echo 3. Run: docker-compose down
echo.
pause

