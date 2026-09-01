# 🚀 Hướng Dẫn Chạy LifeSync AI App

## ⚠️ LƯU Ý QUAN TRỌNG
Máy của bạn chỉ có ~1GB RAM trống nên **KHÔNG THỂ** chạy dev mode (npm run dev).
Phải chạy ở **production mode** (đã build sẵn).

## 📋 Các Bước Chạy App

### 1. Khởi động MySQL Database
```cmd
docker-compose up -d
```
Kiểm tra: `docker ps` - phải thấy container `lifesync_ai_mysql` status `healthy`

### 2. Khởi động Backend (Production Mode)
```cmd
cd backend
npm run start:prod
```
Backend sẽ chạy tại: http://127.0.0.1:3000
API Docs: http://127.0.0.1:3000/api-docs

### 3. Khởi động Frontend (Served Static Files)
**Mở terminal mới:**
```cmd
cd frontend
serve -s dist -l 5173
```
Frontend sẽ chạy tại: http://localhost:5173/

## 🌐 Truy Cập App
Mở trình duyệt và vào: **http://localhost:5173/**

## 🔄 Khi Nào Cần Build Lại Frontend?
Chỉ khi bạn sửa code frontend, chạy lệnh sau **TRƯỚC** khi start lại:
```cmd
cd frontend
set NODE_OPTIONS=--max-old-space-size=512
npm run build
```

## 🛑 Dừng App
1. Backend: Ctrl+C trong terminal backend
2. Frontend: Ctrl+C trong terminal frontend  
3. Database: `docker-compose down`

## ✅ Kiểm Tra Trạng Thái

### Backend Health Check
```powershell
curl http://127.0.0.1:3000/health
```
Phải trả về 200 OK với JSON response

### Frontend Check
```powershell
curl http://localhost:5173/
```
Phải trả về 200 OK

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: Port 3000 đã được sử dụng
```cmd
# Tìm process đang dùng port
netstat -ano | findstr :3000
# Kill process (thay PID bằng số tìm được)
taskkill /PID <PID> /F
```

### Lỗi: Frontend không kết nối được backend
Kiểm tra file `frontend/.env`:
```
VITE_API_URL="http://127.0.0.1:3000"
```
**CHÚ Ý**: Phải dùng `127.0.0.1` chứ KHÔNG phải `localhost` (do conflict với Docker)

### Lỗ: Out of Memory khi build frontend
Dùng lệnh với giới hạn RAM thấp:
```cmd
set NODE_OPTIONS=--max-old-space-size=512
npm run build
```

## 📊 Tài Khoản Mặc Định

### Admin Account
- Email: admin@lifesyncai.com
- Password: Admin@123

### Test User
Tự đăng ký tại: http://localhost:5173/register

## 📝 Log Files
- Backend logs: `backend/backend-prod.out.log` và `backend/backend-prod.err.log`
- Frontend: Không có log file (static serve)
- Database logs: `docker logs lifesync_ai_mysql`

## 🔧 Công Cụ Quản Lý Database
```cmd
# Mở Prisma Studio
npm run prisma:studio --prefix backend
```
Truy cập: http://localhost:5555

---

**Ngày tạo:** 16/06/2026
**Phiên bản:** 1.0.0 (Stable Release)
