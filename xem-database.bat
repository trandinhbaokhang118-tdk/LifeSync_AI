@echo off
echo ========================================
echo   XEM DATABASE - DOCKER + PHPMYADMIN
echo ========================================
echo.

echo [1/4] Dung XAMPP MySQL (tranh conflict)...
net stop MySQL 2>nul
taskkill /F /IM mysqld.exe 2>nul

echo.
echo [2/4] Khoi dong MySQL Docker...
docker-compose up -d mysql
timeout /t 8 /nobreak

echo.
echo [3/4] Khoi dong phpMyAdmin...
docker-compose up -d phpmyadmin
timeout /t 5 /nobreak

echo.
echo [4/4] Mo phpMyAdmin tren trinh duyet...
start http://localhost:8080

echo.
echo ========================================
echo   HOAN THANH!
echo ========================================
echo.
echo phpMyAdmin: http://localhost:8080
echo Username: tm_user
echo Password: tm_password
echo Database: lifesync_ai
echo.
echo Nhan phim bat ky de dong cua so nay...
pause
