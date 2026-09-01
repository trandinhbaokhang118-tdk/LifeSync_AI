@echo off
echo ====================================
echo Fix 9router EBUSY Installation Error
echo ====================================
echo.

echo [1/5] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo [2/5] Cleaning npm cache...
call npm cache clean --force

echo [3/5] Removing old 9router folder...
rmdir /s /q "%APPDATA%\npm\node_modules\9router" 2>nul

echo [4/5] Waiting for file lock release...
timeout /t 2 /nobreak >nul

echo [5/5] Installing 9router@latest...
call npm i -g 9router@latest --prefer-online

echo.
echo ====================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! 9router installed successfully.
    echo Run: 9router --version
) else (
    echo FAILED! Use npx instead:
    echo   npx 9router@latest
)
echo ====================================
pause
