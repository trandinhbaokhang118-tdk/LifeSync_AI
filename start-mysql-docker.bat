@echo off
echo ========================================
echo   KHOI DONG MYSQL BANG DOCKER
echo ========================================
echo.

echo [1/3] Dung XAMPP MySQL (tranh conflict)...
net stop MySQL 2>nul
taskkill /F /IM mysqld.exe 2>nul

echo.
echo [2/3] Khoi dong MySQL Docker container...
docker-compose up -d mysql

echo.
echo [3/3] Cho MySQL khoi dong...
timeout /t 10 /nobreak

echo.
echo ========================================
echo   HOAN THANH!
echo ========================================
echo.
echo MySQL dang chay tai: localhost:3306
echo Username: tm_user
echo Password: tm_password
echo Database: lifesync_ai
echo.
echo Xem database:
echo - Prisma Studio: chay open-prisma-studio.bat
echo - phpMyAdmin: http://localhost:8080
echo.
pause
