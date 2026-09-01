@echo off
echo ========================================
echo   EMERGENCY SECURITY FIX SCRIPT
echo ========================================
echo.
echo WARNING: This script will help you fix critical security issues.
echo.
echo Critical Issues Found:
echo  1. API Keys exposed in .env
echo  2. Weak JWT secret
echo  3. Weak database password
echo.
echo ========================================
echo STEP 1: Revoke Old API Keys
echo ========================================
echo.
echo Please revoke these keys immediately:
echo.
echo OpenAI:  https://platform.openai.com/api-keys
echo Gemini:  https://aistudio.google.com/apikey
echo.
pause
echo.
echo ========================================
echo STEP 2: Generate New Secrets
echo ========================================
echo.
echo Generating new JWT secret...
cd backend
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" > new-secrets.txt
echo.
echo Generating new database password...
node -e "console.log('DB_PASSWORD=' + require('crypto').randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g,''))" >> new-secrets.txt
echo.
echo Secrets saved to: backend\new-secrets.txt
echo.
pause
echo.
echo ========================================
echo STEP 3: Manual Actions Required
echo ========================================
echo.
echo Please do the following:
echo.
echo 1. Get new API keys:
echo    - OpenAI: https://platform.openai.com/api-keys
echo    - Gemini: https://aistudio.google.com/apikey
echo.
echo 2. Open backend\.env file
echo.
echo 3. Replace these values with new secrets from backend\new-secrets.txt
echo.
echo 4. Update database password in MySQL:
echo    mysql -u root -p
echo    ALTER USER 'tm_user'@'localhost' IDENTIFIED BY 'new_password';
echo    FLUSH PRIVILEGES;
echo.
echo 5. Delete backend\new-secrets.txt after copying
echo.
pause
echo.
echo ========================================
echo STEP 4: Verify .gitignore
echo ========================================
echo.
echo Checking if .env is in .gitignore...
findstr /C:".env" .gitignore
if %ERRORLEVEL% EQU 0 (
    echo ✓ .env is in .gitignore
) else (
    echo ✗ WARNING: .env is NOT in .gitignore!
    echo Adding .env to .gitignore...
    echo .env >> .gitignore
    echo backend/.env >> .gitignore
)
echo.
pause
echo.
echo ========================================
echo STEP 5: Check Git Status
echo ========================================
echo.
cd ..
git status
echo.
echo Make sure .env file is NOT listed above!
echo.
pause
echo.
echo ========================================
echo   SECURITY FIX COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Test your application locally
echo 2. Read SECURITY_AUDIT_REPORT.md for details
echo 3. Follow CLOUDFLARE_QUICK_CHECKLIST.md
echo 4. Deploy to production
echo.
echo Remember:
echo - NEVER commit .env file
echo - Use strong, unique passwords
echo - Revoke old API keys
echo - Monitor for suspicious activity
echo.
pause
