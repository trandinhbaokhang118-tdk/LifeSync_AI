# 🚀 CHẠY DỰ ÁN NGAY - HƯỚNG DẪN ĐƠN GIẢN

## ⚠️ DOCKER CHƯA CHẠY!

### 🎯 LÀM THEO 3 BƯỚC NÀY:

---

## **BƯỚC 1: MỞ DOCKER DESKTOP** ⭐ QUAN TRỌNG!

### Cách mở:
1. Nhấn phím **Windows** trên bàn phím
2. Gõ: **Docker Desktop**
3. Click vào ứng dụng **Docker Desktop**
4. **ĐỢI 30-60 GIÂY!**
5. Xem góc dưới bên phải màn hình (system tray)
6. Icon Docker phải màu **XANH** ✅

**LƯU Ý:** Nếu icon màu xám hoặc đang loading, đợi thêm!

---

## **BƯỚC 2: CHẠY LỆNH TRONG VS CODE**

### Trong VS Code:

1. Nhấn `Ctrl + ~` (hoặc View > Terminal) để mở Terminal
2. **COPY & PASTE** từng lệnh sau vào Terminal:

### Lệnh 1: Khởi động MySQL
```bash
docker-compose up -d
```
**Đợi 10 giây**

### Lệnh 2: Khởi động Backend
```bash
start cmd /k "cd backend && npm run start:dev"
```
**Sẽ mở terminal mới**

### Lệnh 3: Khởi động Frontend
```bash
start cmd /k "cd frontend && npm run dev"
```
**Sẽ mở terminal mới**

---

## **BƯỚC 3: MỞ BROWSER**

Sau 15-20 giây, mở browser và truy cập:

```
http://localhost:5173
```

---

## 📱 **HOẶC CÁCH NHANH HƠN - 1 LỆNH DUY NHẤT:**

Sau khi Docker màu XANH, chạy lệnh này trong VS Code Terminal:

```bash
docker-compose up -d && timeout /t 10 && start cmd /k "cd backend && npm run start:dev" && start cmd /k "cd frontend && npm run dev" && timeout /t 15 && start http://localhost:5173
```

**Lệnh này sẽ:**
- ✅ Khởi động MySQL
- ✅ Đợi 10 giây
- ✅ Mở terminal Backend
- ✅ Mở terminal Frontend
- ✅ Đợi 15 giây
- ✅ Tự động mở browser

---

## 🔍 **KIỂM TRA TRẠNG THÁI**

### Xem Docker có chạy không:
```bash docker ps
```

**Phải thấy:** `lifesync_ai_mysql`

### Xem Backend có chạy không:
```bash
netstat -ano | findstr ":3000"
```

**Có output = đang chạy**

### Xem Frontend có chạy không:
```bash
netstat -ano | findstr ":5173"
```

**Có output = đang chạy**

---

## ❌ **NẾU GẶP LỖI**

### Lỗi 1: "Port already in use"

**Backend (port 3000):**
```bash
# Tìm process
netstat -ano | findstr ":3000"

# Kill process (thay <PID> bằng số bạn thấy)
taskkill /F /PID <PID>
```

**Frontend (port 5173):**
```bash
netstat -ano | findstr ":5173"
taskkill /F /PID <PID>
```

### Lỗi 2: "Docker not found"
- Docker Desktop chưa cài đặt
- Hoặc chưa mở Docker Desktop

### Lỗi 3: "Cannot connect to database"
```bash
# Restart MySQL
docker-compose restart mysql

# Hoặc tạo lại
docker-compose down
docker-compose up -d
```

---

## 🎯 **TÓM TẮT - COPY PASTE VÀO TERMINAL:**

### 1. Mở Docker Desktop (đợi icon xanh)

### 2. Copy paste lệnh này vào VS Code Terminal:

```bash
docker-compose up -d && timeout /t 10 && start cmd /k "cd backend && npm run start:dev" && start cmd /k "cd frontend && npm run dev" && timeout /t 15 && start http://localhost:5173
```

### 3. Đợi 20-30 giây, browser sẽ tự mở!

---

## 📞 **CẦN GIÚP ĐỠ?**

### Nếu vẫn không chạy được:

1. **Check Docker:**
   - Mở Docker Desktop
   - Xem Settings > Resources
   - Đảm bảo Docker đang chạy

2. **Check Dependencies:**
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```

3. **Check Database:**
   ```bash
   docker ps
   docker logs lifesync_ai_mysql
   ```

---

## ✅ **SAU KHI CHẠY THÀNH CÔNG:**

Bạn sẽ thấy:
- 🟢 Terminal Backend hiện logs NestJS
- 🟢 Terminal Frontend hiện "Local: http://localhost:5173"
- 🟢 Browser mở trang login/register

**Tạo tài khoản hoặc đăng nhập!**

---

**Chúc bạn thành công! 🚀**
