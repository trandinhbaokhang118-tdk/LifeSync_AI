@echo off
title LifeSync AI - Khởi động dự án
color 0B

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        🚀 LIFESYNC AI - KHỞI ĐỘNG DỰ ÁN            ║
echo ╚══════════════════════════════════════════════════════╝
echo.

echo [Bước 1/3] Kiểm tra Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Docker Desktop CHƯA CHẠY!
    echo.
    echo 📋 Vui lòng:
    echo    1. Mở Docker Desktop từ Start Menu
    echo    2. Đợi icon Docker màu xanh ^(30-60 giây^)
    echo    3. Chạy lại script này
    echo.
    pause
    exit /b 1
)
echo ✅ Docker đang chạy

echo.
echo [Bước 2/3] Kiểm tra MySQL container...
docker ps | findstr timemanager-mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MySQL container chưa chạy. Đang khởi động...
    docker-compose up -d
    echo ⏳ Đợi MySQL khởi động... ^(15 giây^)
    timeout /t 15 /nobreak >nul
    echo ✅ MySQL container đã khởi động
) else (
    echo ✅ MySQL container đang chạy
)

echo.
echo [Bước 3/3] Kiểm tra services...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Backend đang chạy trên port 3000
) else (
    echo ℹ️  Backend chưa chạy
)

netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Frontend đang chạy trên port 5173
) else (
    echo ℹ️  Frontend chưa chạy
)

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              ✅ SẴN SÀNG KHỞI ĐỘNG                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 📝 Chọn phương thức khởi động:
echo.
echo [1] Tự động - Mở 2 terminal mới ^(Recommended^)
echo [2] Thủ công - Hướng dẫn từng bước
echo [3] Kiểm tra trạng thái
echo [4] Thoát
echo.
set /p choice="Nhập lựa chọn (1-4): "

if "%choice%"=="1" goto auto
if "%choice%"=="2" goto manual
if "%choice%"=="3" goto status
if "%choice%"=="4" exit
goto end

:auto
echo.
echo 🚀 Đang khởi động...
echo.
echo ✅ Terminal 1: Backend ^(NestJS^)
start "LifeSync - Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 2 /nobreak >nul

echo ✅ Terminal 2: Frontend ^(React^)
start "LifeSync - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              🎉 ĐÃ KHỞI ĐỘNG!                       ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo 📱 Truy cập ứng dụng:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3000
echo.
echo ⏳ Đợi 10-15 giây để services khởi động xong
echo.
echo 💡 Tips:
echo    - Xem logs trong 2 terminal vừa mở
echo    - Nhấn Ctrl+C trong terminal để dừng
echo    - Hoặc chạy: stop-app.bat
echo.
timeout /t 15 /nobreak
echo.
echo 🌐 Mở browser...
start http://localhost:5173
goto end

:manual
echo.
echo 📋 HƯỚNG DẪN KHỞI ĐỘNG THỦ CÔNG:
echo.
echo Terminal 1 - Backend:
echo    cd backend
echo    npm run start:dev
echo.
echo Terminal 2 - Frontend:
echo    cd frontend  
echo    npm run dev
echo.
echo Sau đó truy cập: http://localhost:5173
echo.
pause
goto end

:status
echo.
call check-status.bat
goto end

:end
pause
