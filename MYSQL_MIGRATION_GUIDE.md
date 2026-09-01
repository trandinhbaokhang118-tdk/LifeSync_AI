# 🔄 CHUYỂN ĐỔI SANG MYSQL - HƯỚNG DẪN

## ✅ Đã hoàn thành

- ✅ Cập nhật `docker-compose.yml` (PostgreSQL → MySQL)
- ✅ Cập nhật `backend/prisma/schema.prisma` (provider: mysql)
- ✅ Cập nhật `backend/.env` (DATABASE_URL)
- ✅ Cập nhật `backend/.env.example`
- ✅ Thêm phpMyAdmin (thay pgAdmin)

## 🚀 Các bước thực hiện

### Bước 1: Dừng containers cũ
```bash
docker-compose down -v
```
**Lưu ý**: `-v` sẽ xóa volumes PostgreSQL cũ

### Bước 2: Khởi động MySQL
```bash
docker-compose up -d
```

Chờ khoảng 10-15 giây để MySQL khởi động hoàn toàn.

### Bước 3: Kiểm tra MySQL đã chạy
```bash
docker-compose ps
```

Bạn sẽ thấy:
```
lifesync_ai_mysql       Up (healthy)
lifesync_ai_phpmyadmin  Up
```

### Bước 4: Tạo database schema
```bash
cd backend
npx prisma migrate dev --name init_mysql
```

Hoặc nếu muốn reset hoàn toàn:
```bash
npx prisma migrate reset
```

### Bước 5: Generate Prisma Client
```bash
npx prisma generate
```

### Bước 6: Khởi động backend
```bash
npm run dev
```

### Bước 7: Test kết nối
Mở trình duyệt:
- Backend: http://localhost:3000
- phpMyAdmin: http://localhost:8080

## 🎯 Thông tin đăng nhập

### MySQL Database
```
Host: localhost
Port: 3306
Database: lifesync_ai
User: tm_user
Password: tm_password
```

### phpMyAdmin
```
URL: http://localhost:8080
Username: tm_user
Password: tm_password
```

### Root Access (nếu cần)
```
Username: root
Password: root_password
```

## 📊 So sánh PostgreSQL vs MySQL

### Đã thay đổi:

| Thành phần | PostgreSQL | MySQL |
|------------|------------|-------|
| **Image** | postgres:16 | mysql:8.0 |
| **Port** | 5432 | 3306 |
| **Admin Tool** | pgAdmin (port 5050) | phpMyAdmin (port 8080) |
| **Volume** | tm_pgdata | tm_mysql_data |
| **Provider** | postgresql | mysql |

### Không thay đổi:
- ✅ Code backend (NestJS)
- ✅ Code frontend (React)
- ✅ API endpoints
- ✅ Business logic
- ✅ Authentication
- ✅ Tất cả features

## 🔧 Troubleshooting

### Lỗi: "Can't connect to MySQL server"
```bash
# Kiểm tra MySQL đã chạy chưa
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Lỗi: "Access denied for user"
```bash
# Kiểm tra .env
cat backend/.env | grep DATABASE_URL

# Phải là:
DATABASE_URL="mysql://tm_user:tm_password@localhost:3306/lifesync_ai"
```

### Lỗi: "Unknown database 'lifesync_ai'"
```bash
# Tạo lại database
docker-compose exec mysql mysql -u root -proot_password -e "CREATE DATABASE IF NOT EXISTS lifesync_ai;"
```

### Lỗi: Migration failed
```bash
# Reset và tạo lại
cd backend
npx prisma migrate reset --force
npx prisma migrate dev --name init_mysql
```

## 📝 Backup & Restore

### Backup MySQL
```bash
# Backup toàn bộ database
docker-compose exec mysql mysqldump -u tm_user -ptm_password lifesync_ai > backup.sql

# Hoặc dùng phpMyAdmin: Export tab
```

### Restore MySQL
```bash
# Restore từ file
docker-compose exec -T mysql mysql -u tm_user -ptm_password lifesync_ai < backup.sql

# Hoặc dùng phpMyAdmin: Import tab
```

## 🎨 phpMyAdmin Features

Truy cập: http://localhost:8080

**Tính năng:**
- ✅ Browse tables
- ✅ Run SQL queries
- ✅ Import/Export data
- ✅ Create/Edit tables
- ✅ User management
- ✅ Visual query builder

## 🔐 Security Notes

### Production:
1. **Đổi passwords mạnh hơn**
```yaml
MYSQL_ROOT_PASSWORD: "your-strong-password-here"
MYSQL_PASSWORD: "another-strong-password"
```

2. **Không expose ports ra ngoài**
```yaml
# Chỉ dùng internal network
# Xóa phần ports nếu không cần truy cập từ host
```

3. **Disable phpMyAdmin**
```yaml
# Comment out service phpmyadmin trong production
```

## 📊 Performance Tips

### MySQL Configuration
Thêm vào `docker-compose.yml`:
```yaml
mysql:
  command: >
    --default-authentication-plugin=mysql_native_password
    --max_connections=200
    --innodb_buffer_pool_size=256M
    --innodb_log_file_size=64M
```

### Prisma Connection Pool
Trong `schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"  // Nếu cần
}
```

## 🎯 Verification Checklist

Sau khi migration, kiểm tra:

- [ ] MySQL container đang chạy
- [ ] phpMyAdmin accessible
- [ ] Backend kết nối được database
- [ ] Tạo user mới thành công
- [ ] Login/Logout hoạt động
- [ ] CRUD tasks hoạt động
- [ ] Tags, TimeBlocks hoạt động
- [ ] Notifications hoạt động
- [ ] AI Chatbot hoạt động

## 🚀 Quick Commands

```bash
# Start everything
docker-compose up -d && cd backend && npm run dev

# Stop everything
docker-compose down

# View logs
docker-compose logs -f mysql

# Access MySQL CLI
docker-compose exec mysql mysql -u tm_user -ptm_password lifesync_ai

# Reset database
cd backend && npx prisma migrate reset

# View database in browser
open http://localhost:8080
```

## 📈 Next Steps

1. ✅ Test tất cả features
2. ✅ Backup database định kỳ
3. ✅ Monitor performance
4. ✅ Optimize queries nếu cần
5. ✅ Setup replication (production)

## 💡 Tips

1. **Dùng phpMyAdmin** để xem data trực quan
2. **Backup thường xuyên** trước khi test
3. **Monitor logs** khi có lỗi
4. **Optimize indexes** cho queries phức tạp
5. **Use connection pooling** cho performance

---

**Hoàn thành migration!** 🎉

Nếu có vấn đề gì, check logs:
```bash
docker-compose logs mysql
docker-compose logs phpmyadmin
cd backend && npm run dev
```
