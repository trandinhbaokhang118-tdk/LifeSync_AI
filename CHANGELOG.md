# Changelog - LifeSync AI UI/UX Upgrade

## [2.1.0] - 2026-01-16

### ✨ Tính năng mới

#### 1. Trang Cài đặt (Settings) Hoàn chỉnh
- ✅ **Upload Avatar**: Tải ảnh đại diện lên (JPG, PNG, GIF, tối đa 5MB)
- ✅ **Cập nhật Profile**: Thay đổi tên và email
- ✅ **Đổi mật khẩu**: Form đổi mật khẩu với validation
- ✅ **Tùy chỉnh giao diện**: Toggle dark mode, timezone, tuần bắt đầu
- ✅ **Thông tin tài khoản**: Hiển thị ID, ngày tạo, lần đăng nhập cuối

#### 2. Backend API Mới
- ✅ **GET /users/profile**: Lấy thông tin profile
- ✅ **PATCH /users/profile**: Cập nhật profile (name, email)
- ✅ **PATCH /users/change-password**: Đổi mật khẩu
- ✅ **POST /users/avatar**: Upload ảnh đại diện
- ✅ **PATCH /notifications/read-all**: Đánh dấu tất cả thông báo đã đọc

#### 3. Cải thiện Dark Mode
- ✅ **Tăng contrast**: Chữ rõ ràng hơn trong dark mode
- ✅ **Background tối hơn**: Từ `rgb(3 7 18)` sang `rgb(17 24 39)`
- ✅ **Card background**: Từ `rgb(17 24 39)` sang `rgb(31 41 55)`
- ✅ **Input text color**: Thêm màu text rõ ràng cho input
- ✅ **Caption color**: Tăng độ sáng từ `rgb(156 163 175)` sang `rgb(209 213 219)`

### 🐛 Sửa lỗi
- ✅ **Lỗi không tải dữ liệu**: Thêm endpoint `markAllAsRead` cho notifications
- ✅ **Input component**: Hỗ trợ hiển thị error message
- ✅ **Avatar component**: Thêm size `xl` (24x24)

### 🎨 Cải tiến UI/UX
- ✅ **Settings page**: Giao diện hiện đại với sections rõ ràng
- ✅ **Form validation**: Real-time validation với error messages
- ✅ **Avatar upload**: Preview ảnh trước khi upload
- ✅ **Loading states**: Loading spinner khi submit forms
- ✅ **Toast notifications**: Thông báo thành công/lỗi rõ ràng

### 🔧 Technical Updates
- ✅ **Prisma schema**: Thêm field `avatar` vào User model
- ✅ **Multer**: Cài đặt `@nestjs/platform-express` cho file upload
- ✅ **Static files**: Serve uploaded files từ `/uploads/`
- ✅ **Migration**: `add_user_avatar` migration

---

## [2.0.0] - 2026-01-16

### ✨ Tính năng mới

#### 1. Logic Thông báo & Đồng bộ
- ✅ **Notification Store**: Quản lý state thông báo với Zustand
- ✅ **Real-time Polling**: Tự động fetch thông báo mới mỗi 30 giây
- ✅ **Notification Listener**: Component lắng nghe và hiển thị toast cho thông báo mới
- ✅ **Mark as Read**: Đánh dấu đã đọc từng thông báo hoặc tất cả
- ✅ **Unread Count**: Badge hiển thị số thông báo chưa đọc trên header
- ✅ **Tabs Filter**: Lọc thông báo theo "Tất cả" và "Chưa đọc"

#### 2. Dark Mode Cải tiến
- ✅ **useDarkMode Hook**: Custom hook quản lý dark mode
- ✅ **System Preference**: Tự động detect theme từ hệ thống
- ✅ **Smooth Transition**: Chuyển đổi mượt mà với CSS transitions (0.3s)
- ✅ **Persistent**: Lưu preference vào localStorage
- ✅ **Auto Sync**: Đồng bộ với system preference khi chưa có manual setting

#### 3. Thống kê Dựa trên Dữ liệu Thật
- ✅ **Real Task Data**: Tính toán từ tasks thực tế thay vì mock data
- ✅ **Weekly Progress**: Biểu đồ cột hiển thị tasks hoàn thành theo ngày
- ✅ **Status Distribution**: Biểu đồ tròn phân bố trạng thái tasks
- ✅ **Completion Rate**: Tỷ lệ hoàn thành tính từ dữ liệu thật
- ✅ **Peak Hours**: Phân tích giờ làm việc hiệu quả nhất
- ✅ **Focus Time**: Ước tính thời gian focus dựa trên tasks completed

### 🎨 Cải tiến UI/UX

#### Design System
- Modern color palette với primary blue
- Consistent spacing (8px grid)
- Smooth animations và transitions
- Glass morphism effects
- Responsive design (mobile-first)

#### Components
- **Button**: 7 variants (default, destructive, outline, secondary, ghost, link, success)
- **Badge**: Status và priority badges với colors
- **Card**: Hover effects và shadows
- **Skeleton**: Loading states cho tất cả pages
- **Empty States**: Friendly messages khi không có data
- **Toast**: Custom notifications với icons

#### Dark Mode
- Smooth color transitions
- Proper contrast ratios
- Consistent across all components
- System preference detection

### 📊 Analytics Dashboard

#### Metrics
- Total completed tasks
- Focus hours
- Completion rate
- Overdue tasks

#### Charts
- Weekly progress (Bar chart)
- Status distribution (Pie chart)
- Focus time (Bar chart)
- Peak productivity hours (Line chart)

### 🔔 Notification System

#### Features
- Real-time notifications
- Mark as read/unread
- Mark all as read
- Unread count badge
- Toast notifications for new items
- Filter by read status

### 🎯 Dashboard

#### Sections
- Greeting with user name
- Stats cards (Today, Overdue, Completed, Focus)
- Today's plan (upcoming tasks)
- Quick actions
- Productivity tips

### 🛠️ Technical Stack

#### Frontend
- React 19
- TypeScript
- TailwindCSS v4
- Radix UI (shadcn/ui)
- TanStack Query
- Zustand
- React Hook Form + Zod
- Recharts
- Lucide Icons

#### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- JWT Authentication

### 📱 Responsive Design
- Desktop: Full sidebar + header
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation + drawer

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K`: Command palette
- `Ctrl/Cmd + D`: Toggle dark mode
- `Ctrl/Cmd + N`: New task
- `Ctrl/Cmd + F`: Start focus

### 🚀 Performance
- Code splitting
- Lazy loading
- Optimistic updates
- Query caching
- Hot module replacement

### 🔐 Security
- JWT with refresh tokens
- CORS configuration
- Input validation
- XSS protection

---

## Cách sử dụng

### Khởi động ứng dụng

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev

# Database (Docker)
docker-compose up -d

# Prisma Studio
cd backend
npx prisma studio
```

### URLs
- Frontend: http://localhost:5174
- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Prisma Studio: http://localhost:5555

### Demo Accounts
- User: `demo@lifesyncai.com` / `demo123`
- Admin: `admin@lifesyncai.com` / `admin123`

---

## Roadmap

### Phase 1 (Completed) ✅
- Design system
- Core UI components
- Authentication
- Task management
- Notifications
- Analytics
- Dark mode

### Phase 2 (Next)
- [ ] Drag & drop calendar
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Export/Import data
- [ ] Advanced filters
- [ ] Custom themes
- [ ] Integrations (Google Calendar, Slack)

---

## Contributors
- AI Assistant (Kiro)
- Development Team

## License
MIT
