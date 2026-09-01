@echo off
echo ========================================
echo Force Fix 9router (Kill Explorer Method)
echo ========================================
echo.
echo WARNING: This will restart Windows Explorer
echo All your open folders will be closed temporarily
echo.
pause

echo [1/6] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Killing Windows Explorer (folders will close)...
taskkill /F /IM explorer.exe 2>nul
timeout /t 2 /nobreak >nul

echo [3/6] Taking ownership of 9router folder...
takeown /F "%APPDATA%\npm\node_modules\9router" /R /D Y >nul 2>&1
icacls "%APPDATA%\npm\node_modules\9router" /grant "%USERNAME%":F /T >nul 2>&1

echo [4/6] Deleting 9router folder...
rmdir /S /Q "%APPDATA%\npm\node_modules\9router" 2>nul

echo [5/6] Restarting Windows Explorer...
start explorer.exe
timeout /t 2 /nobreak >nul

echo [6/6] Installing fresh 9router...
call npm cache clean --force
call npm i -g 9router@latest --prefer-online

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! Testing 9router...
    call 9router --version
) else (
    echo Installation may have issues. Try:
    echo   npx 9router@latest --version
)
echo ========================================
pause
