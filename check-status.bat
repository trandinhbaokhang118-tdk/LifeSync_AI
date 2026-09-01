@echo off
title LifeSync AI - Status Check
color 0B

echo.
echo ========================================================
echo    LIFESYNC AI - QUICK STATUS CHECK
echo ========================================================
echo.

echo [Checking Services...]
echo.

echo Backend (Port 3000):
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ RUNNING
) else (
    echo  ❌ NOT RUNNING
)

echo.
echo Frontend (Port 5173):
netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ RUNNING
) else (
    echo  ❌ NOT RUNNING
)

echo.
echo Docker:
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ RUNNING
    docker ps | findstr timemanager-mysql >nul
    if %errorlevel% equ 0 (
        echo  ✅ MySQL container running
    ) else (
        echo  ⚠️  MySQL container not running
    )
) else (
    echo  ❌ NOT RUNNING
)

echo.
echo ========================================================
echo    BUILD STATUS
echo ========================================================
echo.

if exist backend\dist (
    echo Backend Build: ✅ EXISTS
) else (
    echo Backend Build: ❌ NOT FOUND
)

if exist frontend\dist (
    echo Frontend Build: ✅ EXISTS
) else (
    echo Frontend Build: ❌ NOT FOUND
)

if exist frontend\android (
    echo Android Project: ✅ EXISTS
) else (
    echo Android Project: ❌ NOT FOUND
)

echo.
echo ========================================================
echo    DEPENDENCIES
echo ========================================================
echo.

if exist backend\node_modules (
    echo Backend Dependencies: ✅ INSTALLED
) else (
    echo Backend Dependencies: ❌ NOT INSTALLED
)

if exist frontend\node_modules (
    echo Frontend Dependencies: ✅ INSTALLED
) else (
    echo Frontend Dependencies: ❌ NOT INSTALLED
)

echo.
echo ========================================================
echo    QUICK ACTIONS
echo ========================================================
echo.
echo [1] Start application (start-app.bat)
echo [2] Stop application (stop-app.bat)
echo [3] Run full test suite (test-all-platforms.bat)
echo [4] Complete 100%% project (complete-project-100.bat)
echo [5] View logs folder
echo [6] Open manual testing guide
echo [7] Exit
echo.
set /p choice="Choose action (1-7): "

if "%choice%"=="1" call start-app.bat
if "%choice%"=="2" call stop-app.bat
if "%choice%"=="3" call test-all-platforms.bat
if "%choice%"=="4" call complete-project-100.bat
if "%choice%"=="5" explorer .
if "%choice%"=="6" start MANUAL_TESTING_GUIDE.md
if "%choice%"=="7" exit

pause
