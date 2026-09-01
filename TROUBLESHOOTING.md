# 🔧 Hướng dẫn Khắc phục Sự cố

## Lỗi "Không tải được dữ liệu"

### Nguyên nhân phổ biến:

1. **Chưa đăng nhập hoặc token hết hạn**
2. **Backend không chạy**
3. **Database không kết nối được**
4. **CORS issues**

---

## 🔍 Cách kiểm tra

### 1. Kiểm tra Auth Status

Mở Console (F12) và chạy:

```javascript
debugAuth()
```

Kết quả sẽ hiển thị:
- Access Token có tồn tại không
- Token đã hết hạn chưa
- Thông tin user trong token

### 2. Kiểm tra API Connection

```javascript
debugAPI()
```

Kết quả sẽ hiển thị:
- API URL đang sử dụng
- Response status từ backend
- Dữ liệu trả về

### 3. Kiểm tra Backend

```bash
# Kiểm tra backend có chạy không
curl http://localhost:3000/dashboard/stats

# Nếu lỗi 401, backend đang chạy nhưng cần auth
# Nếu connection refused, backend không chạy
```

---

## ✅ Giải pháp

### Giải pháp 1: Đăng nhập lại

1. Xóa localStorage:
```javascript
localStorage.clear()
```

2. Reload trang và đăng nhập lại với:
   - Email: `user@demo.com`
   - Password: `user123`

### Giải pháp 2: Khởi động lại Backend

```bash
cd backend
npm run dev
```

Đợi cho đến khi thấy:
```
Application is running on: http://localhost:3000
Swagger docs: http://localhost:3000/api-docs
```

### Giải pháp 3: Kiểm tra Database

```bash
# Kiểm tra Docker container
docker ps | grep postgres

# Nếu không chạy, khởi động lại
docker-compose up -d

# Kiểm tra logs
docker logs time_manager_postgres
```

### Giải pháp 4: Reset Database

```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

---

## 🐛 Debug Mode

### Bật logging chi tiết

Trong file `frontend/src/services/api.ts`, API interceptor đã log tất cả errors:

```typescript
console.error('API Error:', {
    url: originalRequest?.url,
    status: error.response?.status,
    message: error.response?.data?.error?.message || error.message,
});
```

Mở Console (F12) để xem chi tiết lỗi.

---

## 📋 Checklist Khắc phục

- [ ] Backend đang chạy trên port 3000
- [ ] Database container đang chạy
- [ ] Đã đăng nhập với tài khoản hợp lệ
- [ ] Token chưa hết hạn (< 15 phút)
- [ ] Browser console không có lỗi CORS
- [ ] Network tab shows 200 responses

---

## 🆘 Vẫn không được?

### Xóa toàn bộ và bắt đầu lại:

```bash
# 1. Stop tất cả
docker-compose down
cd backend
# Kill process nếu có
taskkill /F /IM node.exe

# 2. Xóa data
docker volume rm time_manager_postgres_data

# 3. Khởi động lại
docker-compose up -d
cd backend
npm run dev

# 4. Reset database
npx prisma migrate reset
npx prisma db seed

# 5. Frontend - xóa cache
cd ../frontend
rm -rf node_modules/.vite
npm run dev
```

### Trong browser:

1. Xóa localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl + Shift + R`
3. Đăng nhập lại

---

## 📞 Liên hệ

Nếu vẫn gặp vấn đề, hãy:

1. Chụp màn hình Console errors
2. Copy output từ `debugAuth()` và `debugAPI()`
3. Gửi thông tin để được hỗ trợ

---

## 🎯 Lỗi thường gặp

### "Authentication required"
→ Token hết hạn hoặc không hợp lệ
→ **Giải pháp**: Đăng nhập lại

### "Cannot connect to database"
→ PostgreSQL container không chạy
→ **Giải pháp**: `docker-compose up -d`

### "EADDRINUSE: address already in use :::3000"
→ Backend đã chạy ở process khác
→ **Giải pháp**: Kill process cũ

### "Network Error"
→ Backend không chạy
→ **Giải pháp**: `cd backend && npm run dev`

### "CORS policy"
→ Frontend port không được config trong backend
→ **Giải pháp**: Kiểm tra `backend/src/main.ts` CORS config
