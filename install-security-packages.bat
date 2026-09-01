@echo off
echo ========================================
echo Installing Cloudflare Security Packages
echo ========================================
echo.

cd backend

echo Installing express-rate-limit...
call npm install express-rate-limit@^7.1.5

echo Installing helmet...
call npm install helmet@^8.0.0

echo Installing dev dependencies...
call npm install --save-dev @types/express-rate-limit@^6.0.0

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update your .env file with PRODUCTION_FRONTEND_URL
echo 2. Follow CLOUDFLARE_SECURITY_SETUP.md to setup Cloudflare
echo 3. Use CLOUDFLARE_QUICK_CHECKLIST.md for quick setup
echo.
pause
