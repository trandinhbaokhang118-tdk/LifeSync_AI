# 📊 Hướng dẫn xem Database

## 🚀 Cách nhanh nhất (1 click)

### Bước 1: Chạy file
```bash
xem-database.bat
```

### Bước 2: Đăng nhập phpMyAdmin
Trình duyệt sẽ tự động mở: **http://localhost:8080**

**Thông tin đăng nhập:**
- **Username:** `tm_user`
- **Password:** `tm_password`
- **Database:** `lifesync_ai`

---

## 📋 Các bảng trong database

Sau khi đăng nhập, bạn sẽ thấy các bảng:

### 1. **User** - Người dùng
- id, email, name, password, role
- createdAt, updatedAt

### 2. **Task** - Công việc
- id, title, description, status, priority
- dueDate, userId, categoryId
- createdAt, updatedAt

### 3. **Category** - Danh mục
- id, name, color, userId
- createdAt, updatedAt

### 4. **Event** - Sự kiện lịch
- id, title, description, startTime, endTime
- userId, createdAt, updatedAt

### 5. **Notification** - Thông báo
- id, title, message, type, isRead
- userId, createdAt

### 6. **FocusSession** - Phiên Focus
- id, duration, taskId, userId
- startedAt, completedAt

### 7. **AIChatMessage** - Tin nhắn AI
- id, role, content, userId
- createdAt

---

## 🎯 Các thao tác trong phpMyAdmin

### Xem dữ liệu
1. Click vào database `lifesync_ai` (bên trái)
2. Click vào tên bảng (VD: `User`)
3. Click tab "Browse" để xem dữ liệu

### Tìm kiếm
1. Click tab "Search"
2. Nhập điều kiện tìm kiếm
3. Click "Go"

### Thêm dữ liệu
1. Click tab "Insert"
2. Điền thông tin
3. Click "Go"

### Sửa dữ liệu
1. Click tab "Browse"
2. Click icon "Edit" (bút chì)
3. Sửa thông tin
4. Click "Go"

### Xóa dữ liệu
1. Click tab "Browse"
2. Click icon "Delete" (thùng rác)
3. Xác nhận

### Chạy SQL query
1. Click tab "SQL"
2. Nhập query (VD: `SELECT * FROM User WHERE role = 'ADMIN'`)
3. Click "Go"

---

## 🔧 Các lệnh SQL hữu ích

### Xem tất cả users
```sql
SELECT * FROM User;
```

### Xem admin accounts
```sql
SELECT id, email, name, role FROM User WHERE role = 'ADMIN';
```

### Xem tasks chưa hoàn thành
```sql
SELECT * FROM Task WHERE status != 'COMPLETED';
```

### Đếm số tasks theo status
```sql
SELECT status, COUNT(*) as count 
FROM Task 
GROUP BY status;
```

### Xem thông báo chưa đọc
```sql
SELECT * FROM Notification WHERE isRead = 0;
```

### Xem focus sessions trong 7 ngày
```sql
SELECT * FROM FocusSession 
WHERE startedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

---

## 🛑 Dừng Docker

Khi xong, dừng containers:
```bash
stop-mysql-docker.bat
```

Hoặc:
```bash
docker-compose down
```

---

## 🔄 Khởi động lại

Nếu cần khởi động lại:
```bash
xem-database.bat
```

---

## 💡 Tips

1. **Backup database trước khi sửa:**
   - Click database `lifesync_ai`
   - Click tab "Export"
   - Click "Go"

2. **Import database:**
   - Click database `lifesync_ai`
   - Click tab "Import"
   - Chọn file .sql
   - Click "Go"

3. **Xem cấu trúc bảng:**
   - Click vào tên bảng
   - Click tab "Structure"

4. **Xem quan hệ giữa các bảng:**
   - Click database `lifesync_ai`
   - Click tab "Designer"

---

## ⚠️ Lưu ý

- **Không xóa dữ liệu quan trọng** trong production
- **Backup trước khi thay đổi** cấu trúc database
- **Dùng transactions** khi update nhiều bảng
- **Test trên local** trước khi deploy

---

## 🆘 Troubleshooting

### Port 8080 đã được sử dụng
Sửa trong `docker-compose.yml`:
```yaml
phpmyadmin:
  ports:
    - "8081:80"  # Đổi 8080 thành 8081
```

### Không kết nối được MySQL
```bash
# Kiểm tra containers
docker ps

# Xem logs
docker logs lifesync_ai_mysql
docker logs lifesync_ai_phpmyadmin

# Restart
docker-compose restart
```

### Quên mật khẩu
Xem trong file `backend/.env`:
```
DATABASE_URL="mysql://tm_user:tm_password@localhost:3306/lifesync_ai"
```
