# Hướng dẫn Admin Panel

## Truy cập Admin Panel

### Yêu cầu
- Tài khoản có quyền ADMIN
- Đã đăng nhập vào hệ thống

### URL
```
http://localhost:5173/admin
```

### Tài khoản Admin mặc định
```
Email: admin@lifesyncai.com
Password: admin123
```

## Các tính năng

### 1. Admin Dashboard
**URL:** `/admin`

**Chức năng:**
- Xem tổng quan hệ thống
- Thống kê người dùng (tổng, hoạt động, mới)
- Thống kê công việc
- Hoạt động gần đây
- Thao tác nhanh

**Metrics hiển thị:**
- Tổng người dùng
- Người dùng hoạt động (7 ngày gần đây)
- Tổng công việc
- Trung bình công việc/người dùng
- Người dùng mới hôm nay

### 2. Quản lý người dùng
**URL:** `/admin/users`

**Chức năng:**
- Xem danh sách tất cả người dùng
- Tìm kiếm theo tên/email
- Thay đổi quyền (USER ↔ ADMIN)
- Chỉnh sửa thông tin người dùng
- Xóa người dùng
- Thêm người dùng mới

**Thông tin hiển thị:**
- Tên, email, số điện thoại
- Quyền (USER/ADMIN)
- Ngày tạo tài khoản
- Ngày cập nhật cuối

### 3. Nhật ký hoạt động
**URL:** `/admin/activity`

**Chức năng:**
- Xem lịch sử hoạt động hệ thống
- Lọc theo loại hoạt động
- Xuất báo cáo
- Theo dõi IP address

**Loại hoạt động:**
- LOGIN - Đăng nhập
- CREATE_TASK - Tạo công việc
- UPDATE_PROFILE - Cập nhật hồ sơ
- DELETE - Xóa dữ liệu

### 4. Quản lý Database
**URL:** `/admin/database`

**Chức năng:**
- Xem thống kê database (dung lượng, bảng, bản ghi)
- Tạo bản sao lưu
- Khôi phục từ backup
- Tối ưu hóa database
- Xóa cache
- Xóa toàn bộ dữ liệu (nguy hiểm!)

**Thống kê:**
- Dung lượng sử dụng
- Số lượng bảng
- Tổng số bản ghi
- Thời gian backup cuối

### 5. Cài đặt hệ thống
**URL:** `/admin/settings`

**Cài đặt chung:**
- Tên website
- URL website
- Email admin

**Giới hạn hệ thống:**
- Số công việc tối đa/người dùng
- Thời gian timeout phiên (phút)

**Tính năng:**
- ✅/❌ Cho phép đăng ký
- ✅/❌ Thông báo email
- ✅/❌ Push notifications
- ⚠️ Chế độ bảo trì

## API Endpoints

### Admin Stats
```
GET /admin/stats
Authorization: Bearer {admin_token}
```

### Get All Users
```
GET /admin/users
Authorization: Bearer {admin_token}
```

### Update User Role
```
PATCH /admin/users/:id/role
Authorization: Bearer {admin_token}
Body: { "role": "ADMIN" | "USER" }
```

### Delete User
```
DELETE /admin/users/:id
Authorization: Bearer {admin_token}
```

### Activity Logs
```
GET /admin/activity-logs
Authorization: Bearer {admin_token}
```

### Create Backup
```
POST /admin/backup
Authorization: Bearer {admin_token}
```

## Bảo mật

### Middleware bảo vệ
- `JwtAuthGuard` - Kiểm tra token hợp lệ
- `RolesGuard` - Kiểm tra quyền ADMIN
- `@Roles('ADMIN')` decorator

### Frontend protection
- `AdminRoute` component - Chặn truy cập không có quyền
- Redirect về trang chủ nếu không phải ADMIN
- Redirect về login nếu chưa đăng nhập

## Cấu trúc thư mục

### Frontend
```
frontend/src/
├── pages/admin/
│   ├── AdminDashboard.tsx
│   ├── UserManagement.tsx
│   ├── ActivityLogs.tsx
│   ├── DatabaseManagement.tsx
│   └── SystemSettings.tsx
└── components/admin/
    ├── AdminLayout.tsx
    └── AdminRoute.tsx
```

### Backend
```
backend/src/
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
└── auth/
    ├── guards/
    │   └── roles.guard.ts
    └── decorators/
        └── roles.decorator.ts
```

## Thêm Admin mới

### Cách 1: Qua Database
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';
```

### Cách 2: Qua Admin Panel
1. Đăng nhập với tài khoản admin
2. Vào `/admin/users`
3. Tìm người dùng cần nâng quyền
4. Click icon Shield
5. Xác nhận thay đổi

## Troubleshooting

### Không truy cập được Admin Panel
- Kiểm tra role trong database: `SELECT role FROM users WHERE email = 'your@email.com'`
- Đảm bảo đã đăng nhập
- Clear cache và refresh

### API trả về 403 Forbidden
- Token không hợp lệ hoặc hết hạn
- User không có quyền ADMIN
- RolesGuard chưa được apply đúng

### Stats không hiển thị
- Kiểm tra backend logs
- Đảm bảo database có dữ liệu
- Kiểm tra API endpoint `/admin/stats`

## Best Practices

1. **Không share tài khoản admin** - Mỗi admin nên có tài khoản riêng
2. **Backup thường xuyên** - Tạo backup trước khi thay đổi lớn
3. **Kiểm tra logs** - Theo dõi hoạt động bất thường
4. **Giới hạn quyền** - Chỉ cấp ADMIN cho người cần thiết
5. **Bảo mật token** - Không lưu token trong localStorage (đã dùng secure cookie)

## Tính năng sắp tới

- [ ] Quản lý tags hệ thống
- [ ] Thống kê chi tiết theo thời gian
- [ ] Export/Import dữ liệu
- [ ] Email templates management
- [ ] System health monitoring
- [ ] Rate limiting configuration
- [ ] Scheduled tasks management
