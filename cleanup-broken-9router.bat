@echo off
echo ====================================
echo Cleanup Broken 9router Installation
echo ====================================
echo.
echo This will remove the corrupted global installation
echo You can still use: npx 9router@latest
echo.
pause

echo.
echo [Step 1] Closing programs that might lock files...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM explorer.exe 2>nul
timeout /t 3 /nobreak >nul

echo [Step 2] Starting Explorer...
start explorer.exe
timeout /t 1 /nobreak >nul

echo [Step 3] Taking ownership...
takeown /F "%APPDATA%\npm\node_modules\9router" /R /D Y >nul 2>&1
icacls "%APPDATA%\npm\node_modules\9router" /grant "%USERNAME%":F /T >nul 2>&1

echo [Step 4] Removing folder...
rmdir /S /Q "%APPDATA%\npm\node_modules\9router" 2>nul

echo [Step 5] Removing npm symlink...
del "%APPDATA%\npm\9router" 2>nul
del "%APPDATA%\npm\9router.cmd" 2>nul
del "%APPDATA%\npm\9router.ps1" 2>nul

echo [Step 6] Cleaning npm cache...
call npm cache clean --force

echo.
echo ====================================
if exist "%APPDATA%\npm\node_modules\9router" (
    echo WARNING: Folder still exists!
    echo Please restart Windows and run this script again.
    echo.
    echo Or just use: npx 9router@latest
) else (
    echo SUCCESS! Corrupted installation removed.
    echo.
    echo Use 9router with npx:
    echo   npx 9router@latest --version
    echo   npx 9router@latest --help
    echo   npx 9router@latest
)
echo ====================================
pause
