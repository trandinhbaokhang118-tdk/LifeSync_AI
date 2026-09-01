@echo off
echo ============================================
echo   LIFESYNC AI - FULL PLATFORM TESTING
echo ============================================
echo.

echo [1/10] Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo [OK] Docker is running

echo.
echo [2/10] Checking MySQL container...
docker ps | findstr timemanager-mysql >nul
if %errorlevel% neq 0 (
    echo [WARN] MySQL container not running. Starting...
    docker-compose up -d
    timeout /t 10 /nobreak >nul
)
echo [OK] MySQL container is running

echo.
echo [3/10] Checking backend dependencies...
cd backend
if not exist node_modules (
    echo [WARN] Backend dependencies not installed. Installing...
    call npm install
)
echo [OK] Backend dependencies ready

echo.
echo [4/10] Running backend E2E tests...
call npm run test:e2e > ../test-backend-result.txt 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Some backend tests failed. Check test-backend-result.txt
) else (
    echo [OK] All backend tests passed
)

echo.
echo [5/10] Checking backend TypeScript...
call npx tsc --noEmit > ../test-backend-ts.txt 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Backend TypeScript errors found. Check test-backend-ts.txt
) else (
    echo [OK] Backend TypeScript clean
)

echo.
echo [6/10] Checking frontend dependencies...
cd ../frontend
if not exist node_modules (
    echo [WARN] Frontend dependencies not installed. Installing...
    call npm install
)
echo [OK] Frontend dependencies ready

echo.
echo [7/10] Checking frontend TypeScript...
call npx tsc -b --noEmit > ../test-frontend-ts.txt 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Frontend TypeScript errors found. Check test-frontend-ts.txt
) else (
    echo [OK] Frontend TypeScript clean
)

echo.
echo [8/10] Running frontend linter...
call npm run lint > ../test-frontend-lint.txt 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Frontend lint issues found. Check test-frontend-lint.txt
) else (
    echo [OK] Frontend lint clean
)

echo.
echo [9/10] Building frontend for production...
call npm run build > ../test-frontend-build.txt 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed! Check test-frontend-build.txt
) else (
    echo [OK] Frontend build successful
)

echo.
echo [10/10] Checking Capacitor Android sync...
call npx cap sync android > ../test-capacitor-sync.txt 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Capacitor sync had issues. Check test-capacitor-sync.txt
) else (
    echo [OK] Capacitor Android synced
)

cd ..
echo.
echo ============================================
echo   TESTING COMPLETE!
echo ============================================
echo.
echo Test results saved:
echo - test-backend-result.txt
echo - test-backend-ts.txt
echo - test-frontend-ts.txt
echo - test-frontend-lint.txt
echo - test-frontend-build.txt
echo - test-capacitor-sync.txt
echo.
echo Next steps:
echo 1. Review test results above
echo 2. Start app: start-app.bat
echo 3. Test manually: http://localhost:5173
echo 4. Build Android: npx cap open android
echo.
pause
