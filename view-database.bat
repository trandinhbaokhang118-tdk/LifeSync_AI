@echo off
echo ========================================
echo   XEM CO SO DU LIEU MYSQL
echo ========================================
echo.
echo Dang ket noi vao database: lifesync_ai
echo Username: tm_user
echo.

mysql -u tm_user -ptm_password -h localhost lifesync_ai

pause
