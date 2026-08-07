# ⏰ LifeSync_AI - Ứng dụng Quản lý Thời gian Thông minh

LifeSync_AI là web quản lý thời gian và công việc, hỗ trợ đăng ký/đăng nhập, quản lý Tasks, Tags, Calendar/Planner với time block và kéo thả, nhắc nhở/thông báo và thống kê. Ứng dụng dùng React + TypeScript, backend NestJS REST API, ORM Prisma và CSDL MySQL, xác thực JWT + Refresh Token.

![LifeSync_AI](https://img.shields.io/badge/React-18.3-blue) ![NestJS](https://img.shields.io/badge/NestJS-10.0-red) ![MySQL](https://img.shields.io/badge/MySQL-8.0-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Tính năng

### 🎯 Core Features
- ✅ **Quản lý Công việc** - Tạo, sắp xếp, theo dõi tasks với drag & drop
- 📅 **Lịch Thông minh** - Time blocking và calendar view
- ⏱️ **Focus Mode** - Pomodoro timer tích hợp
- 🤖 **AI Assistant** - Chatbot AI hỗ trợ 24/7
- 📊 **Thống kê & Báo cáo** - Analytics chi tiết về năng suất
- 🔔 **Thông báo Real-time** - WebSocket notifications

### 🎨 UI/UX
- 🌓 **Dark/Light Mode** - Chuyển đổi theme mượt mà
- 🎨 **Galaxy Theme** - Gradient đẹp mắt
- 📱 **Responsive Design** - Hoạt động tốt trên mọi thiết bị
- ⚡ **Command Palette** - Điều hướng nhanh (Cmd/Ctrl + K)

### 🔐 Bảo mật
- 🔒 **JWT Authentication** - Access & Refresh tokens
- 🔑 **OAuth2** - Đăng nhập Google, Facebook
- 👥 **Role-based Access** - Admin & User roles
- 🛡️ **Security Best Practices** - CORS, Rate limiting, Helmet

## 🚀 Tech Stack

### Frontend
- **React 18.3** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management
- **React Router** - Routing
- **Lucide Icons** - Icon library

### Backend
- **NestJS 10** + **TypeScript**
- **Prisma ORM** - Database toolkit
- **MySQL 8.0** - Database
- **JWT** - Authentication
- **OpenAI API** - AI Chatbot
- **WebSocket** - Real-time notifications

### DevOps
- **Docker** + **Docker Compose**
- **phpMyAdmin** - Database management
- **Prisma Studio** - Database GUI

## 📦 Cài đặt

### Yêu cầu
- Node.js 18+
- Docker Desktop
- Git

### 1. Clone repository
```bash
git clone https://github.com/trandinhbaokhang118-tdk/TimeManager_React.git
cd TimeManager_React
```

### 2. Cài đặt dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Cấu hình môi trường
```bash
# Copy file .env.example
cd backend
copy .env.example .env

# Sửa các biến môi trường trong .env
```

### 4. Khởi động database (Docker)
```bash
# Quay về thư mục root
cd ..

# Khởi động MySQL + phpMyAdmin
docker-compose up -d

# Hoặc dùng script
start-mysql-docker.bat
```

### 5. Chạy migrations
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 6. Tạo admin account
```bash
# Chạy script
create-admin.bat

# Hoặc
cd backend
npm run create-admin
```

### 7. Khởi động ứng dụng
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Hoặc dùng script
start-app.bat
```

## 🌐 Truy cập

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **phpMyAdmin:** http://localhost:8080
- **Prisma Studio:** http://localhost:5555 (chạy `npx prisma studio`)

## 📚 Tài liệu

- [Hướng dẫn cài đặt MySQL](./QUICK_START_MYSQL.md)
- [Tạo Admin Account](./CREATE_YOUR_ADMIN.md)
- [Hướng dẫn xem Database](./HUONG_DAN_XEM_DATABASE.md)
- [Cấu hình OpenAI API](./SETUP_OPENAI_API.md)
- [Testing Guide](./TESTING_GUIDE.md)

## 🎯 Scripts hữu ích

### Windows
```bash
start-app.bat              # Khởi động toàn bộ ứng dụng
stop-app.bat               # Dừng ứng dụng
create-admin.bat           # Tạo admin account
xem-database.bat           # Mở phpMyAdmin
open-prisma-studio.bat     # Mở Prisma Studio
start-mysql-docker.bat     # Khởi động MySQL Docker
stop-mysql-docker.bat      # Dừng MySQL Docker
```

### Linux/Mac
```bash
./migrate-to-mysql.sh      # Migration script
```

## 🔧 Cấu hình

### Database
```env
DATABASE_URL="mysql://tm_user:tm_password@localhost:3306/time_manager"
```

### JWT
```env
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

### OpenAI (Optional)
```env
OPENAI_API_KEY="sk-..."
```

## 📱 Screenshots

### Landing Page
- Trang chủ hiện đại với giới thiệu tính năng
- Section "Tải ứng dụng" cho iOS/Android (sắp có)

### Dashboard
- Tổng quan công việc và thống kê
- Quick actions và shortcuts

### Tasks Management
- Drag & drop tasks
- Filter theo status, priority, category
- Quick add modal

### Calendar View
- Time blocking
- Event management
- Drag to create events

### Focus Mode
- Pomodoro timer
- Task selection
- Break reminders

### AI Chatbot
- Chat với AI assistant
- Tự động sắp xếp lịch
- Gợi ý công việc

## 🤝 Đóng góp

Contributions, issues và feature requests đều được chào đón!

1. Fork repository
2. Tạo branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Trần Đình Bảo Khang**
- GitHub: [@trandinhbaokhang118-tdk](https://github.com/trandinhbaokhang118-tdk)

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/)

---

⭐ Nếu project này hữu ích, hãy cho một star nhé!
