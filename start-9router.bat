@echo off
setlocal

echo ====================================
echo Starting 9Router Server
echo ====================================
echo.
echo 9Router is an AI API Router & Proxy
echo Default URL: http://localhost:20128
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

REM Add Node.js to PATH if not already there
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

REM Start 9router with logging
npx -y 9router@latest --log

pause
endlocal
