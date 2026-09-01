# ⚡ Quick Restart Guide

Hướng dẫn khởi động lại dự án LifeSync AI sau khi tắt máy hoặc khởi động mới.

---

## 🚀 Khởi động nhanh (3 bước)

### Bước 1: Khởi động Docker Desktop
```
1. Mở Docker Desktop từ Start Menu
2. Đợi Docker khởi động hoàn tất (icon Docker trong system tray không còn loading)
3. Kiểm tra: Icon Docker màu xanh = sẵn sàng
```

### Bước 2: Khởi động Database
```bash
# Click đúp file này:
start-mysql-docker.bat

# Hoặc chạy lệnh:
docker-compose up -d
```

**Kiểm tra database đã chạy:**
```bash
docker ps
# Phải thấy container: lifesync_ai_mysql
```

### Bước 3: Khởi động ứng dụng
```bash
# Click đúp file này:
start-app.bat

# Hoặc mở 2 terminal riêng:

# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## 🌐 Truy cập ứng dụng

Sau khi khởi động, truy cập:

- 🎨 **Frontend:** http://localhost:5173
- 🔧 **Backend API:** http://localhost:3000
- 💾 **phpMyAdmin:** http://localhost:8080
- 🗄️ **Prisma Studio:** `npx prisma studio` (port 5555)

---

## 🔍 Kiểm tra trạng thái

### Backend đang chạy?
```bash
netstat -ano | findstr ":3000"
# Nếu có output = đang chạy
```

### Frontend đang chạy?
```bash
netstat -ano | findstr ":5173"
# Nếu có output = đang chạy
```

### Database đang chạy?
```bash
docker ps
# Phải thấy: lifesync_ai_mysql
```

---

## 🛑 Dừng ứng dụng

### Dừng backend/frontend
- Nhấn `Ctrl + C` trong terminal đang chạy

### Dừng database
```bash
docker-compose down
```

### Dừng toàn bộ
```bash
# Click đúp file:
stop-app.bat
```

---

## ⚠️ Xử lý lỗi thường gặp

### 1. Port 3000 đã được dùng
```bash
# Tìm process đang dùng port 3000
netstat -ano | findstr ":3000"

# Kill process (thay <PID> bằng số process ID)
taskkill /PID <PID> /F

# Hoặc dùng script tự động
kill-port-3000.bat
```

### 2. Port 5173 đã được dùng
```bash
netstat -ano | findstr ":5173"
taskkill /PID <PID> /F
```

### 3. Docker không khởi động
```
- Mở Docker Desktop
- Đợi 30-60 giây
- Nếu vẫn lỗi: Restart Docker Desktop
- Nếu vẫn lỗi: Restart máy tính
```

### 4. Database connection error
```bash
# Khởi động lại MySQL container
docker-compose restart mysql

# Nếu vẫn lỗi, xóa và tạo lại
docker-compose down
docker-compose up -d
```

### 5. Prisma Client out of sync
```bash
cd backend
npx prisma generate
npm run start:dev
```

---

## 🔐 Tài khoản Admin mặc định

Nếu chưa có admin, tạo bằng:
```bash
cd backend
npm run create-admin

# Hoặc click đúp:
create-admin.bat
```

**Default admin:**
- Email: admin@lifesyncai.com
- Password: (bạn nhập khi chạy script)

---

## 📦 Scripts hữu ích

### Windows Batch Files (click đúp để chạy)
```
start-app.bat              - Khởi động toàn bộ app
stop-app.bat               - Dừng toàn bộ app
start-mysql-docker.bat     - Chỉ khởi động database
stop-mysql-docker.bat      - Chỉ dừng database
create-admin.bat           - Tạo tài khoản admin
xem-database.bat           - Mở phpMyAdmin
open-prisma-studio.bat     - Mở Prisma Studio
```

### NPM Scripts
```bash
# Backend
npm run start:dev          - Development mode
npm run start:prod         - Production mode
npm run build              - Build for production
npm run test               - Unit tests
npm run test:e2e           - E2E tests
npm run lint               - Lint code
npm run create-admin       - Tạo admin

# Frontend
npm run dev                - Development server
npm run build              - Build for production
npm run preview            - Preview production build
npm run lint               - Lint code
```

---

## 🧪 Testing

### Chạy E2E tests (Backend)
```bash
cd backend

# Đảm bảo database đang chạy
docker ps

# Chạy tests
npm run test:e2e
```

**Kết quả mong đợi:**
```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
```

---

## 📱 Build Android App

### Yêu cầu
- Android Studio installed
- Java JDK 17+

### Build steps
```bash
cd frontend

# Sync Capacitor
npx cap sync android

# Mở Android Studio
npx cap open android

# Trong Android Studio:
# Build > Make Project
# Run > Run 'app'
```

---

## 🚀 Deploy Production

### Backend (Railway/Render)
```bash
cd backend
npm run build
npm run start:prod
```

**Environment variables cần set:**
- `DATABASE_URL` - Production MySQL URL
- `JWT_SECRET` - Random strong secret
- `REFRESH_TOKEN_SECRET` - Different from JWT_SECRET
- `OPENAI_API_KEY` - For AI chatbot
- `FRONTEND_URL` - For CORS

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy folder 'dist'
```

**Environment variables:**
- `VITE_API_URL` - Backend API URL

---

## 📚 Tài liệu thêm

- [FINAL_RELEASE_STATUS.md](./FINAL_RELEASE_STATUS.md) - Báo cáo release đầy đủ
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Kiến trúc hệ thống
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Hướng dẫn testing
- [README.md](./README.md) - Tài liệu chính

---

## 🆘 Cần giúp đỡ?

1. Kiểm tra logs trong terminal
2. Xem file `.codex-logs/` cho chi tiết
3. Mở GitHub Issues
4. Đọc tài liệu trong thư mục project

---

**🎯 Mục tiêu:** Khởi động trong 2-3 phút!

1. Docker Desktop → 2. `start-mysql-docker.bat` → 3. `start-app.bat` → ✅ Done!
