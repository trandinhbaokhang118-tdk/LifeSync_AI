# 🔐 TẠO TÀI KHOẢN ADMIN CHÍNH THỨC

## 🚀 Cách 1: Script tự động (Khuyên dùng)

### Windows:
```bash
create-admin.bat
```

### Linux/Mac:
```bash
cd backend
npx ts-node scripts/create-admin.ts
```

Script sẽ hỏi:
1. **Tên của bạn**: Ví dụ: Nguyễn Văn A
2. **Email**: Ví dụ: admin@company.com
3. **Password**: Tối thiểu 6 ký tự
4. **Xác nhận password**: Nhập lại password

---

## 🔧 Cách 2: Thủ công qua phpMyAdmin

### Bước 1: Mở phpMyAdmin
```
http://localhost:8080
User: tm_user
Pass: tm_password
```

### Bước 2: Chọn database `lifesync_ai`

### Bước 3: Vào table `users`

### Bước 4: Click "Insert" và điền:
- **id**: (để trống, tự động)
- **email**: admin@yourcompany.com
- **passwordHash**: (xem bên dưới cách hash)
- **name**: Tên của bạn
- **avatar**: NULL
- **phone**: NULL
- **role**: ADMIN
- **createdAt**: CURRENT_TIMESTAMP
- **updatedAt**: CURRENT_TIMESTAMP

### Bước 5: Hash password

Chạy trong terminal:
```bash
cd backend
node -e "const argon2 = require('argon2'); argon2.hash('your_password').then(console.log)"
```

Copy kết quả vào field `passwordHash`

---

## 🔧 Cách 3: Qua API (Nếu đã có admin)

### Endpoint:
```
POST http://localhost:3000/admin/users
```

### Headers:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

### Body:
```json
{
  "email": "newadmin@company.com",
  "password": "secure_password",
  "name": "New Admin",
  "role": "ADMIN"
}
```

---

## 🔐 Bảo mật

### Password mạnh:
- ✅ Tối thiểu 8 ký tự
- ✅ Có chữ hoa, chữ thường
- ✅ Có số
- ✅ Có ký tự đặc biệt

### Ví dụ password mạnh:
```
Admin@2026!
MySecure#Pass123
LifeSyncAI$2026
```

### Không nên:
- ❌ admin123
- ❌ password
- ❌ 123456
- ❌ Tên công ty

---

## 📝 Quản lý Admin

### Xem tất cả admin:
```sql
SELECT id, email, name, role, createdAt 
FROM users 
WHERE role = 'ADMIN';
```

### Đổi user thành admin:
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';
```

### Xóa quyền admin:
```sql
UPDATE users 
SET role = 'USER' 
WHERE email = 'admin@example.com';
```

---

## 🎯 Quyền của Admin

Admin có thể:
- ✅ Truy cập Admin Panel
- ✅ Xem tất cả users
- ✅ Thay đổi role của users
- ✅ Xóa users
- ✅ Xem activity logs
- ✅ Backup database
- ✅ Xem thống kê hệ thống

---

## 🔄 Reset password admin

### Nếu quên password:

#### Cách 1: Qua phpMyAdmin
1. Vào table `users`
2. Tìm admin cần reset
3. Hash password mới:
```bash
node -e "const argon2 = require('argon2'); argon2.hash('new_password').then(console.log)"
```
4. Update field `passwordHash`

#### Cách 2: Qua script
```bash
cd backend
npx ts-node scripts/reset-admin-password.ts
```

---

## 📊 Kiểm tra

### Sau khi tạo admin:

1. **Đăng nhập**: http://localhost:5173
2. **Vào Admin Panel**: Click avatar → Admin
3. **Kiểm tra quyền**: Xem được danh sách users

---

## 💡 Tips

1. **Tạo nhiều admin**: Có thể có nhiều admin
2. **Backup thông tin**: Lưu email/password an toàn
3. **Đổi password định kỳ**: Mỗi 3-6 tháng
4. **2FA**: Sẽ thêm trong version sau

---

## 🆘 Troubleshooting

### Lỗi: "Email đã tồn tại"
```bash
# Xóa user cũ
cd backend
npx prisma studio
# Tìm và xóa user trong GUI
```

### Lỗi: "Cannot hash password"
```bash
# Cài lại argon2
cd backend
npm install argon2
```

### Lỗi: "Database connection failed"
```bash
# Kiểm tra MySQL
docker-compose ps
docker-compose restart mysql
```

---

**Tạo admin thành công!** 🎉

Date: January 23, 2026  
Version: 1.0.0
