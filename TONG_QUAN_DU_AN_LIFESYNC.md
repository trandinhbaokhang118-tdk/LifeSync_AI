# 📘 TÀI LIỆU TỔNG QUAN DỰ ÁN — LIFESYNC AI

> Tài liệu kỹ thuật mô tả kiến trúc, cấu trúc mã nguồn và tổng thể hệ thống của ứng dụng **LifeSync AI** — nền tảng quản lý thời gian, công việc và sức khỏe tích hợp Trợ lý AI.

**Phiên bản:** 1.0.0
**Cập nhật:** Tháng 7, 2026
**Tác giả:** Trần Đình Bảo Khang

---

## MỤC LỤC

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Công nghệ sử dụng (Tech Stack)](#3-công-nghệ-sử-dụng-tech-stack)
4. [Cấu trúc thư mục dự án](#4-cấu-trúc-thư-mục-dự-án)
5. [Kiến trúc Backend (NestJS)](#5-kiến-trúc-backend-nestjs)
6. [Kiến trúc Frontend (React)](#6-kiến-trúc-frontend-react)
7. [Mô hình dữ liệu (Database)](#7-mô-hình-dữ-liệu-database)
8. [Kiến trúc bảo mật](#8-kiến-trúc-bảo-mật)
9. [Luồng hoạt động chính](#9-luồng-hoạt-động-chính)
10. [Kiểm thử (Testing)](#10-kiểm-thử-testing)
11. [Triển khai (Deployment)](#11-triển-khai-deployment)
12. [Tổng kết](#12-tổng-kết)

---

## 1. GIỚI THIỆU TỔNG QUAN

### 1.1. Mô tả dự án

**LifeSync AI** là một ứng dụng full-stack đa nền tảng (web + mobile) giúp người dùng quản lý toàn diện cuộc sống cá nhân: công việc, thời gian, lịch trình và sức khỏe. Điểm nổi bật của ứng dụng là tích hợp **Trợ lý AI** hỗ trợ 24/7, có khả năng tự động sắp xếp công việc, đưa ra lời khuyên về năng suất và trả lời các câu hỏi của người dùng.

### 1.2. Đối tượng người dùng

- **Người dùng cá nhân (USER):** quản lý công việc, lịch, tập trung (Pomodoro), theo dõi sức khỏe.
- **Quản trị viên (ADMIN):** quản lý người dùng, xem thống kê hệ thống, quản lý cơ sở dữ liệu.
- **Điều hành viên (MODERATOR):** vai trò trung gian (mở rộng trong tương lai).

### 1.3. Các nhóm tính năng chính

| Nhóm | Mô tả |
|------|-------|
| **Quản lý công việc** | Tạo/sửa/xóa tasks, phân loại theo độ ưu tiên, trạng thái, tags, kéo thả |
| **Lịch & Time Blocking** | Xem lịch tháng/tuần/ngày, tạo khối thời gian, kéo thả sự kiện |
| **Focus Mode** | Đồng hồ Pomodoro, theo dõi phiên tập trung |
| **Trợ lý AI** | Chatbot AI tư vấn năng suất, tự tạo task, gợi ý lịch trình |
| **Sức khỏe & Thể chất** | Theo dõi bài tập, hồ sơ fitness, kết nối thiết bị, GPS tracking |
| **Thống kê & Phân tích** | Biểu đồ năng suất, thời gian tập trung, hoạt động |
| **Thông báo & Nhắc nhở** | Nhắc nhở công việc, thông báo real-time, push mobile |
| **Gói dịch vụ** | FREE/PRO/PLUS, thanh toán (Stripe, VNPay, MoMo, ZaloPay) |
| **Quản trị** | Quản lý người dùng, phân quyền, log hoạt động, quản lý DB |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Mô hình kiến trúc tổng thể

LifeSync AI áp dụng kiến trúc **Client-Server** với giao tiếp qua **RESTful API**, tách biệt rõ ràng giữa tầng trình bày (frontend), tầng xử lý nghiệp vụ (backend) và tầng dữ liệu (database).

```
┌───────────────────────────────────────────────────────────┐
│                       CLIENT (Client Layer)                │
│  ┌──────────────────┐         ┌────────────────────────┐  │
│  │   Web Browser    │         │   Mobile App (Android) │  │
│  │  React SPA       │         │   Capacitor Shell      │  │
│  └──────────────────┘         └────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
                            │
                    HTTPS / REST API (JSON)
                            │
┌───────────────────────────────────────────────────────────┐
│                    SERVER (Application Layer)              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              NestJS API (17 Modules)                │  │
│  │  Controllers → Guards → Services → Prisma           │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
                            │
                      Prisma ORM
                            │
┌───────────────────────────────────────────────────────────┐
│                    DATA (Data Layer)                       │
│  ┌──────────────────┐         ┌────────────────────────┐  │
│  │   MySQL 8.0      │         │  Redis (OTP - optional)│  │
│  │  (13 bảng)       │         │  AI Provider (9router) │  │
│  └──────────────────┘         └────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 2.2. Nguyên tắc thiết kế

- **Separation of Concerns:** mỗi tầng đảm nhận một trách nhiệm riêng biệt.
- **Modular Architecture:** backend chia thành các module NestJS độc lập.
- **Contract-first API:** frontend và backend giao tiếp qua hợp đồng API nhất quán.
- **SOLID & DRY:** tái sử dụng service, DTO, component; dễ mở rộng.

---

## 3. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

### 3.1. Frontend

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **React** | 19.2 | Thư viện UI, xây dựng giao diện SPA |
| **TypeScript** | 5.9 | Ngôn ngữ lập trình có kiểu tĩnh |
| **Vite** | 7.2 | Công cụ build & dev server tốc độ cao |
| **TailwindCSS** | 4.1 | Framework CSS tiện ích |
| **TanStack React Query** | 5.90 | Quản lý data fetching & caching |
| **Zustand** | 5.0 | Quản lý state toàn cục (auth) |
| **React Router** | 7.11 | Định tuyến (routing) |
| **React Hook Form + Zod** | 7.71 / 4.3 | Quản lý & validate form |
| **Framer Motion** | 12.38 | Hiệu ứng chuyển động |
| **Radix UI** | — | Bộ component accessible (dialog, dropdown...) |
| **Recharts** | 2.15 | Vẽ biểu đồ thống kê |
| **Lucide React** | — | Bộ icon |
| **dnd-kit** | 6.3 | Kéo thả (drag & drop) |

### 3.2. Backend

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **NestJS** | 10.4 | Framework backend Node.js |
| **TypeScript** | 5.7 | Ngôn ngữ lập trình |
| **Prisma ORM** | 5.22 | ORM truy vấn cơ sở dữ liệu |
| **MySQL** | 8.0 | Hệ quản trị cơ sở dữ liệu |
| **JWT (@nestjs/jwt)** | 10.2 | Xác thực bằng token |
| **Passport** | 0.7 | Middleware xác thực |
| **Argon2** | 0.41 | Băm mật khẩu |
| **class-validator** | 0.14 | Validate dữ liệu đầu vào |
| **Helmet** | 8.x | Security headers |
| **express-rate-limit** | 7.5 | Giới hạn tần suất request |
| **ioredis** | 5.11 | Kết nối Redis (OTP store) |
| **node-cron** | 3.0 | Lập lịch tác vụ định kỳ |
| **Swagger** | 8.1 | Tài liệu API tự động |

### 3.3. Mobile & DevOps

| Công nghệ | Vai trò |
|-----------|---------|
| **Capacitor** 8.0 | Đóng gói web app thành ứng dụng Android/iOS native |
| **Docker + Docker Compose** | Container hóa MySQL & dịch vụ |
| **Git / GitHub** | Quản lý mã nguồn |
| **GitHub Actions** | CI/CD (kiểm thử tự động) |
| **9router** | Proxy AI cục bộ tương thích OpenAI |

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN

### 4.1. Cấu trúc gốc (Root)

```
LifeSync AI/
├── backend/              # Mã nguồn API (NestJS)
├── frontend/             # Mã nguồn giao diện (React + Capacitor)
├── assets/               # Tài nguyên tĩnh (css, icons, images, videos)
├── .github/workflows/    # Cấu hình CI/CD (ci.yml)
├── docs/                 # Tài liệu dự án
├── docker-compose.yml    # Cấu hình container (MySQL, phpMyAdmin)
├── *.md                  # Các tài liệu hướng dẫn
└── *.bat                 # Scripts tiện ích (Windows)
```

### 4.2. Cấu trúc Backend

```
backend/
├── src/
│   ├── main.ts                 # Điểm khởi động ứng dụng (bootstrap)
│   ├── app.module.ts           # Module gốc, tập hợp toàn bộ module con
│   │
│   ├── auth/                   # Xác thực & phân quyền
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── guards/             # JwtAuthGuard, RolesGuard
│   │   ├── strategies/         # JwtStrategy (Passport)
│   │   ├── decorators/         # @Roles, @Public
│   │   └── otp/                # OTP store (in-memory / Redis)
│   │
│   ├── users/                  # Quản lý người dùng & hồ sơ
│   ├── tasks/                  # Quản lý công việc
│   ├── tags/                   # Nhãn phân loại công việc
│   ├── time-blocks/            # Khối thời gian (calendar)
│   ├── reminders/              # Nhắc nhở
│   ├── notifications/          # Thông báo
│   ├── dashboard/              # Thống kê tổng quan
│   ├── scheduler/              # Tác vụ định kỳ (cron)
│   ├── admin/                  # Chức năng quản trị
│   ├── ai-chat/                # Trợ lý AI (chatbot)
│   ├── payments/               # Thanh toán & gói dịch vụ
│   ├── fitness/                # Sức khỏe & thể chất
│   ├── gps/                    # Theo dõi GPS bài tập
│   ├── health/                 # Health check endpoint
│   ├── prisma/                 # PrismaService (kết nối DB)
│   └── common/                 # Dùng chung
│       ├── filters/            # HttpExceptionFilter
│       ├── interceptors/       # Logging, Transform
│       ├── decorators/         # @CurrentUser, @RealIp
│       ├── middleware/         # Rate limiting
│       └── dto/                # ApiResponse DTO
│
├── prisma/
│   ├── schema.prisma           # Định nghĩa mô hình dữ liệu
│   ├── migrations/             # Lịch sử migration
│   └── seed.ts                 # Dữ liệu mẫu
│
├── test/                       # Kiểm thử E2E
│   ├── auth.e2e-spec.ts
│   ├── auth-otp.e2e-spec.ts
│   ├── auth-session.e2e-spec.ts
│   ├── security.e2e-spec.ts
│   ├── tasks.e2e-spec.ts
│   ├── time-blocks.e2e-spec.ts
│   ├── admin.e2e-spec.ts
│   ├── health.e2e-spec.ts
│   └── utils/                  # Helper cho test
│
├── .env                        # Biến môi trường (KHÔNG commit)
├── .env.example                # Mẫu biến môi trường
└── package.json
```

### 4.3. Cấu trúc Frontend

```
frontend/
├── src/
│   ├── main.tsx                # Điểm khởi động React
│   ├── App.tsx                 # Component gốc (ErrorBoundary, Providers)
│   │
│   ├── app/
│   │   └── router.tsx          # Cấu hình định tuyến (React Router)
│   │
│   ├── pages/                  # Các trang (26 trang)
│   │   ├── Landing.tsx         # Trang giới thiệu
│   │   ├── Login/Register.tsx  # Đăng nhập/Đăng ký
│   │   ├── Dashboard.tsx       # Bảng điều khiển
│   │   ├── Tasks.tsx           # Quản lý công việc
│   │   ├── Calendar/Planner.tsx# Lịch & Kế hoạch
│   │   ├── Focus.tsx           # Chế độ tập trung
│   │   ├── Analytics.tsx       # Thống kê
│   │   ├── Fitness*.tsx        # Nhóm trang sức khỏe
│   │   ├── GpsTracking.tsx     # Theo dõi GPS
│   │   ├── Settings.tsx        # Cài đặt
│   │   ├── Subscription/Pricing# Gói dịch vụ
│   │   ├── NotFound.tsx        # Trang 404
│   │   ├── RouteError.tsx      # Trang lỗi route
│   │   └── admin/              # Nhóm trang quản trị
│   │
│   ├── components/             # Component tái sử dụng
│   │   ├── ui/                 # Nút, input, dialog, toast...
│   │   ├── layout/             # AppLayout, Header, Sidebar
│   │   ├── auth/               # PrivateRoute
│   │   ├── admin/              # AdminRoute, AdminLayout
│   │   └── ErrorBoundary.tsx   # Bắt lỗi render
│   │
│   ├── services/               # Gọi API (axios)
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand store (auth)
│   ├── lib/                    # Tiện ích (api-config, auth)
│   ├── cache/                  # Cấu hình React Query
│   ├── types/                  # Định nghĩa TypeScript types
│   ├── i18n/                   # Đa ngôn ngữ
│   └── assets/                 # Tài nguyên
│
├── android/                    # Dự án Capacitor Android
├── public/                     # File tĩnh công khai
├── capacitor.config.ts         # Cấu hình Capacitor
├── vite.config.ts              # Cấu hình Vite
└── package.json
```

---

## 5. KIẾN TRÚC BACKEND (NESTJS)

### 5.1. Mô hình module

Backend được tổ chức thành **17 module** độc lập, mỗi module đóng gói một miền nghiệp vụ (domain). Module gốc `AppModule` tập hợp tất cả:

```
AppModule (gốc)
├── ConfigModule        # Cấu hình biến môi trường (global)
├── PrismaModule        # Kết nối cơ sở dữ liệu (global)
├── AuthModule          # Đăng nhập, đăng ký, JWT, OTP, OAuth
├── UsersModule         # Hồ sơ người dùng, đổi mật khẩu
├── TasksModule         # CRUD công việc
├── TagsModule          # Nhãn phân loại
├── TimeBlocksModule    # Khối thời gian lịch
├── RemindersModule     # Nhắc nhở
├── NotificationsModule # Thông báo
├── DashboardModule     # Thống kê tổng quan
├── SchedulerModule     # Cron jobs (nhắc nhở tự động)
├── AdminModule         # Quản trị hệ thống
├── AIChatModule        # Trợ lý AI
├── PaymentsModule      # Thanh toán, gói dịch vụ
├── FitnessModule       # Sức khỏe, bài tập
├── GpsModule           # Theo dõi GPS
└── HealthController    # Kiểm tra tình trạng server
```

### 5.2. Luồng xử lý một request

Mỗi request đi qua một chuỗi thành phần (pipeline) theo thứ tự:

```
Client Request
      │
      ▼
[Middleware]      → Rate Limiting (giới hạn tần suất)
      │
      ▼
[Guards]          → JwtAuthGuard (kiểm tra token)
      │             RolesGuard (kiểm tra vai trò)
      ▼
[Interceptors]    → LoggingInterceptor (ghi log)
      │
      ▼
[Pipes]           → ValidationPipe (validate DTO)
      │
      ▼
[Controller]      → Định tuyến, nhận tham số
      │
      ▼
[Service]         → Xử lý nghiệp vụ (business logic)
      │
      ▼
[Prisma]          → Truy vấn cơ sở dữ liệu
      │
      ▼
[Interceptor]     → TransformInterceptor (chuẩn hóa response)
      │
      ▼
[Filter]          → HttpExceptionFilter (xử lý lỗi)
      │
      ▼
Response (JSON chuẩn hóa)
```

### 5.3. Các thành phần dùng chung (common)

| Thành phần | Chức năng |
|-----------|-----------|
| `HttpExceptionFilter` | Chuẩn hóa toàn bộ lỗi thành `{ error: { code, message } }` |
| `LoggingInterceptor` | Ghi log request/response |
| `TransformInterceptor` | Bọc dữ liệu trả về thành `{ data: ... }` |
| `@CurrentUser()` | Decorator lấy thông tin user từ token |
| `@RealIp()` | Decorator lấy IP thật (hỗ trợ Cloudflare) |
| `RateLimitMiddleware` | Chống brute-force, DoS |

### 5.4. Chuẩn hóa API Response

Toàn bộ API trả về theo định dạng nhất quán:

```jsonc
// Thành công
{ "data": { /* nội dung */ } }

// Lỗi
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "..." } }
```

---

## 6. KIẾN TRÚC FRONTEND (REACT)

### 6.1. Phân tầng kiến trúc

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (Pages, Components, UI Elements)   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│      Business Logic Layer           │
│  (Hooks, Zustand Store, Services)   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│      Data Access Layer              │
│  (Axios Client, React Query)        │
└─────────────────────────────────────┘
```

### 6.2. Cây định tuyến (Routing)

Frontend sử dụng **React Router v7** với các tầng bảo vệ route:

```
Router
├── Public Routes (không cần đăng nhập)
│   ├── /                → Landing
│   ├── /login           → Login
│   ├── /register        → Register
│   ├── /admin/login     → AdminLogin
│   └── /auth/callback   → AuthCallback (OAuth)
│
├── Private Routes (cần đăng nhập — PrivateRoute)
│   └── /app             → AppLayout
│       ├── (index)      → Dashboard
│       ├── tasks        → Tasks
│       ├── calendar     → Calendar
│       ├── planner      → Planner
│       ├── focus        → Focus
│       ├── analytics    → Analytics
│       ├── reminders    → Reminders
│       ├── notifications→ Notifications
│       ├── settings     → Settings
│       ├── subscription → Subscription
│       ├── pricing      → Pricing
│       ├── fitness/*    → Fitness (profile, devices, history, workouts)
│       └── gps-tracking → GpsTracking
│
├── Admin Routes (cần quyền ADMIN — AdminRoute)
│   └── /admin           → AdminLayout
│       ├── (index)      → AdminDashboard
│       ├── users        → UserManagement
│       ├── activity     → ActivityLogs
│       ├── database     → DatabaseManagement
│       └── settings     → SystemSettings
│
└── Error Routes
    ├── /404             → NotFound
    ├── errorElement     → RouteError (lỗi route/chunk)
    └── *                → Chuyển hướng về /404
```

### 6.3. Quản lý trạng thái (State Management)

| Loại state | Công cụ | Dùng cho |
|-----------|---------|----------|
| **Auth state** | Zustand | user, token, trạng thái đăng nhập |
| **Server state** | React Query | tasks, tags, notifications, dashboard |
| **Local state** | useState | trạng thái riêng của component |
| **Form state** | React Hook Form | dữ liệu & validate form |

### 6.4. Cơ chế bảo vệ lỗi (3 tầng)

1. **ErrorBoundary** — bắt lỗi render React, hiển thị màn hình lỗi + nút "Về trang chủ".
2. **RouteError** — bắt lỗi cấp route (lazy-load chunk thất bại, lỗi loader), có thông báo cụ thể + nút tải lại/về trang chủ.
3. **NotFound (404)** — trang không tồn tại, có nút quay lại/về Dashboard.

---

## 7. MÔ HÌNH DỮ LIỆU (DATABASE)

### 7.1. Tổng quan

Cơ sở dữ liệu **MySQL 8.0**, quản lý qua **Prisma ORM**. Gồm **13 bảng** chia thành 4 nhóm: Người dùng & Xác thực, Quản lý công việc, Gói dịch vụ, Sức khỏe.

### 7.2. Sơ đồ quan hệ thực thể (ERD)

```
                          ┌──────────────┐
                          │     User     │
                          │ (users)      │
                          └──────┬───────┘
                                 │ 1
          ┌──────────────────────┼──────────────────────────┐
          │ N                    │ N                         │ N
   ┌──────▼──────┐      ┌────────▼────────┐         ┌────────▼─────────┐
   │RefreshToken │      │      Task       │         │       Tag        │
   │(refresh_    │      │    (tasks)      │◄───────►│     (tags)       │
   │  tokens)    │      └────────┬────────┘  M:N    └──────────────────┘
   └─────────────┘               │            (qua TaskTag)
                                 │
   ┌─────────────┐      ┌────────▼────────┐         ┌──────────────────┐
   │  TimeBlock  │      │    Reminder     │         │  Notification    │
   │(time_blocks)│      │  (reminders)    │         │ (notifications)  │
   └─────────────┘      └─────────────────┘         └──────────────────┘

   ┌─────────────────┐  ┌──────────────────┐        ┌──────────────────┐
   │  Subscription   │  │ FitnessProfile   │        │   DailyActivity  │
   │(subscriptions)  │  │(fitness_profiles)│        │(daily_activities)│
   └─────────────────┘  └──────────────────┘        └──────────────────┘
                                 │ 1
                          ┌──────▼───────┐  1:1   ┌──────────────────┐
                          │   Exercise   │◄──────►│    GpsRoute      │
                          │ (exercises)  │        │  (gps_routes)    │
                          └──────────────┘        └──────────────────┘

   ┌─────────────────────┐
   │  SubscriptionPlan   │  (bảng độc lập - định nghĩa các gói)
   │(subscription_plans) │
   └─────────────────────┘
```

### 7.3. Mô tả các bảng chính

| Bảng | Mô tả | Quan hệ |
|------|-------|---------|
| **users** | Thông tin người dùng, mật khẩu (băm), vai trò | Gốc — 1:N tới hầu hết bảng |
| **refresh_tokens** | Token làm mới (băm SHA-256), có hạn dùng | User 1:N |
| **tasks** | Công việc: tiêu đề, mô tả, trạng thái, ưu tiên, thời hạn | User 1:N, Tag M:N |
| **tags** | Nhãn phân loại công việc (tên, màu) | User 1:N |
| **task_tags** | Bảng trung gian nối Task ↔ Tag | M:N |
| **time_blocks** | Khối thời gian trên lịch | User 1:N |
| **reminders** | Nhắc nhở theo thời điểm | User 1:N |
| **notifications** | Thông báo cho người dùng | User 1:N |
| **subscriptions** | Gói đăng ký của người dùng (tier, trạng thái) | User 1:1 |
| **subscription_plans** | Định nghĩa các gói FREE/PRO/PLUS | Độc lập |
| **fitness_profiles** | Hồ sơ sức khỏe (chiều cao, cân nặng, mục tiêu) | User 1:1 |
| **exercises** | Bản ghi bài tập (loại, thời lượng, calo) | User 1:N, GpsRoute 1:1 |
| **gps_routes** | Lộ trình GPS của bài tập | Exercise 1:1 |
| **daily_activities** | Hoạt động hằng ngày (bước chân, calo, giấc ngủ) | User 1:N |

### 7.4. Các kiểu liệt kê (Enums)

| Enum | Giá trị |
|------|---------|
| `Role` | USER, MODERATOR, ADMIN |
| `TaskStatus` | TODO, IN_PROGRESS, DONE |
| `TaskPriority` | LOW, MEDIUM, HIGH |
| `SubscriptionTier` | FREE, PRO, PLUS |
| `SubscriptionStatus` | ACTIVE, CANCELED, PAST_DUE, TRIALING |
| `PaymentProvider` | STRIPE, VNPAY, MOMO, ZALOPAY |

### 7.5. Chiến lược đánh chỉ mục (Indexing)

- **Khóa chính:** tất cả bảng dùng UUID.
- **Chỉ mục duy nhất:** `users.email`, `users.phone`, `tags(userId, name)`.
- **Chỉ mục phụ:** `tasks.userId`, `tasks.status`, `tasks.priority`, `tasks.startAt`, `tasks.dueAt`, `refresh_tokens.tokenHash`, `reminders.triggerAt`... để tối ưu truy vấn.
- **Xóa dây chuyền (Cascade):** khi xóa User, toàn bộ dữ liệu liên quan tự động bị xóa.

---

## 8. KIẾN TRÚC BẢO MẬT

### 8.1. Xác thực (Authentication)

LifeSync AI hỗ trợ **4 phương thức đăng nhập**:

1. **Email + Mật khẩu** — mật khẩu băm bằng **Argon2** (thuật toán mạnh, chống rainbow-table).
2. **OTP qua số điện thoại** — mã 6 chữ số sinh bằng `crypto.randomInt()` (an toàn mật mã), có hạn 5 phút.
3. **Google OAuth 2.0** — đăng nhập qua tài khoản Google.
4. **Facebook OAuth** — đăng nhập qua tài khoản Facebook.

### 8.2. Cơ chế JWT & Refresh Token

```
Đăng nhập thành công
      │
      ├─→ Access Token (JWT, hết hạn 15 phút) — dùng cho mỗi request
      └─→ Refresh Token (hết hạn 7 ngày)      — dùng để làm mới access token
                │
                └─→ Lưu trong DB dưới dạng băm SHA-256 (không lưu plain text)

Làm mới token (Token Rotation):
      Refresh Token cũ → tạo cặp token mới → XÓA token cũ (chống tái sử dụng)
```

### 8.3. Phân quyền (Authorization)

- **RBAC (Role-Based Access Control):** phân quyền theo vai trò USER / MODERATOR / ADMIN.
- **Guards:** `JwtAuthGuard` (kiểm tra token) + `RolesGuard` (kiểm tra vai trò).
- **Decorator `@Roles('ADMIN')`:** đánh dấu route chỉ dành cho admin.
- **Tách biệt cổng truy cập:** admin chỉ vào được `/admin`, user chỉ vào được `/app`.

### 8.4. Các lớp phòng thủ bảo mật

| Lớp | Biện pháp |
|-----|-----------|
| **Chống brute-force** | Rate limiting: login 5 lần/15 phút, đăng ký 3 lần/giờ, OTP 3 lần/giờ |
| **Chống đoán OTP** | Giới hạn 5 lần thử sai mỗi mã, sau đó hủy mã |
| **Bảo vệ session** | Đổi mật khẩu → thu hồi toàn bộ refresh token đang hoạt động |
| **Security headers** | Helmet (X-Frame-Options, HSTS, X-Content-Type-Options...) |
| **Chống SQL Injection** | Prisma ORM dùng truy vấn tham số hóa |
| **Validate đầu vào** | class-validator + ValidationPipe (whitelist, forbid non-whitelisted) |
| **CORS** | Danh sách origin cho phép, hỗ trợ header Cloudflare |
| **Ẩn IP server** | Cloudflare proxy (DDoS protection, WAF, Bot Fight Mode) |
| **Bảo vệ log** | Mask IP trong log, không log token/mật khẩu |

### 8.5. Lưu trữ OTP linh hoạt (tối ưu theo môi trường)

Hệ thống dùng lớp trừu tượng `OtpStore` tự chọn backend:

- **In-Memory Store** (mặc định, 1 server/dev): lưu trong RAM + tự dọn mã hết hạn mỗi phút (chống rò rỉ bộ nhớ).
- **Redis Store** (production, nhiều instance): kích hoạt khi có `REDIS_URL`, dùng TTL tự hết hạn, chia sẻ giữa nhiều server, sống sót qua restart.
- **Fail-safe:** nếu Redis lỗi → tự động fallback về in-memory.

---

## 9. LUỒNG HOẠT ĐỘNG CHÍNH

### 9.1. Luồng đăng nhập (Email/Password)

```
Người dùng nhập email/mật khẩu
      │
      ▼
Frontend validate (React Hook Form + Zod)
      │
      ▼
POST /auth/login  ──→ [Rate Limiter: tối đa 5 lần/15 phút]
      │
      ▼
AuthService: tìm user theo email
      │
      ▼
Argon2.verify(mật khẩu) ──→ Sai? → 401 AUTH_INVALID_CREDENTIALS
      │ Đúng
      ▼
Sinh Access Token + Refresh Token
      │
      ▼
Lưu Refresh Token (băm) vào DB
      │
      ▼
Trả về { accessToken, refreshToken, user, access }
      │
      ▼
Frontend lưu token → chuyển hướng theo vai trò (/app hoặc /admin)
```

### 9.2. Luồng tạo công việc (Create Task)

```
Người dùng điền form task
      │
      ▼
POST /tasks (kèm Bearer token)
      │
      ▼
JwtAuthGuard xác thực token → RolesGuard kiểm tra quyền
      │
      ▼
ValidationPipe kiểm tra DTO (tiêu đề, thời hạn...)
      │
      ▼
TasksService.create() → Prisma insert vào DB
      │
      ▼
TransformInterceptor bọc kết quả → { data: task }
      │
      ▼
Frontend: React Query cập nhật cache → UI hiển thị task mới
```

### 9.3. Luồng Trợ lý AI (AI Chat)

```
Người dùng gửi tin nhắn
      │
      ▼
POST /ai-chat (kèm token)
      │
      ▼
AIChatService: lấy context (10 task gần nhất của user)
      │
      ▼
Tạo system prompt (kèm quy tắc bảo mật chống lộ mã nguồn)
      │
      ▼
Gọi AI Provider (9router local → fallback OpenAI cloud)
      │
      ▼
Nhận phản hồi → sanitize (loại bỏ code/thông tin kỹ thuật)
      │
      ▼
Trích xuất actions (tạo task, cập nhật task nếu có)
      │
      ▼
Trả về { message, suggestions, actions }
```

### 9.4. Luồng nhắc nhở tự động (Scheduler)

```
SchedulerModule (node-cron) chạy định kỳ
      │
      ▼
Kiểm tra reminders có triggerAt <= hiện tại và chưa triggered
      │
      ▼
Tạo Notification cho user tương ứng
      │
      ▼
Đánh dấu reminder đã triggered
      │
      ▼
Frontend polling/fetch → hiển thị thông báo (toast + push mobile)
```

---

## 10. KIỂM THỬ (TESTING)

### 10.1. Chiến lược kiểm thử

Dự án áp dụng **kiểm thử E2E (End-to-End)** với Jest + Supertest, chạy trên ứng dụng NestJS đầy đủ (mô phỏng môi trường thật), kết nối cơ sở dữ liệu thực.

### 10.2. Bộ kiểm thử hiện có

| Suite | Số test | Phạm vi |
|-------|---------|---------|
| `auth.e2e-spec.ts` | 8 | Đăng ký, đăng nhập, /me, refresh token rotation |
| `auth-otp.e2e-spec.ts` | 6 | Luồng OTP: gửi, xác thực, sai mã, lockout |
| `auth-session.e2e-spec.ts` | 3 | Đổi mật khẩu thu hồi session, chống no-op |
| `security.e2e-spec.ts` | 4 | Rate limiting (brute-force, đăng ký, OTP), không lộ dữ liệu |
| `tasks.e2e-spec.ts` | — | CRUD công việc |
| `time-blocks.e2e-spec.ts` | — | Quản lý khối thời gian |
| `admin.e2e-spec.ts` | — | Phân quyền admin |
| `health.e2e-spec.ts` | — | Health check |
| `in-memory-otp.store.spec.ts` (unit) | 4 | Lưu/lấy/xóa OTP, auto-cleanup |
| **Tổng** | **38+ tests** | ✅ Tất cả PASS |

### 10.3. Điểm nổi bật về kiểm thử bảo mật

- **Kiểm chứng brute-force thực sự:** dùng cờ `RATE_LIMIT_FORCE` bật lại rate limiter trong test để chứng minh nó chặn được tấn công.
- **Cô lập bộ đếm rate-limit:** mỗi test dùng IP giả riêng (header `CF-Connecting-IP`) → kết quả ổn định, không phụ thuộc thứ tự.
- **Tối ưu tốc độ:** bật `isolatedModules` giúp test chạy nhanh hơn ~4 lần.

### 10.4. CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`) tự động chạy kiểm thử khi push code.

---

## 11. TRIỂN KHAI (DEPLOYMENT)

### 11.1. Môi trường phát triển (Development)

```
Máy phát triển
├── Frontend (Vite dev server)  :5173
├── Backend (NestJS)            :3000
├── MySQL (Docker)              :3306
└── phpMyAdmin (Docker)         :8080
```

### 11.2. Môi trường sản xuất (Production - khuyến nghị)

```
┌─────────────────────────────────────┐
│          Cloudflare                 │
│  (CDN, WAF, DDoS Protection, SSL)   │
└─────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐        ┌─────▼────┐
│Frontend│        │ Backend  │
│(Vercel/│        │(Railway/ │
│Netlify)│        │ Render)  │
└────────┘        └────┬─────┘
                       │
                  ┌────▼─────┐    ┌──────────┐
                  │  MySQL   │    │  Redis   │
                  │(Managed) │    │(OTP-opt) │
                  └──────────┘    └──────────┘
```

### 11.3. Nền tảng hỗ trợ

- **Frontend:** Vercel, Netlify (hoặc CDN tĩnh).
- **Backend:** Railway, Render (hoặc VPS + Docker).
- **Database:** PlanetScale, MySQL managed.
- **Mobile:** Build APK/AAB qua Capacitor → Google Play.

### 11.4. Biến môi trường quan trọng

| Biến | Mô tả |
|------|-------|
| `DATABASE_URL` | Chuỗi kết nối MySQL |
| `JWT_SECRET` | Khóa ký JWT (128 ký tự ngẫu nhiên) |
| `REDIS_URL` | Kết nối Redis cho OTP (tùy chọn) |
| `FRONTEND_URL` | URL frontend (cho CORS) |
| `PRODUCTION_FRONTEND_URL` | URL production (Cloudflare domain) |
| `AI_BASE_URL` / `AI_MODEL` | Cấu hình AI provider |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth Google |
| `FACEBOOK_APP_ID/SECRET` | OAuth Facebook |

---

## 12. TỔNG KẾT

### 12.1. Điểm mạnh của kiến trúc

- **Tách biệt rõ ràng:** frontend, backend, database độc lập, dễ bảo trì và mở rộng.
- **Modular hóa cao:** backend chia 17 module theo domain, mỗi module tự chứa.
- **Bảo mật nhiều lớp:** từ Cloudflare (biên) → rate limiting + JWT + RBAC (ứng dụng) → Prisma (dữ liệu).
- **Type-safe toàn diện:** TypeScript ở cả frontend và backend, giảm lỗi runtime.
- **Đa nền tảng:** một mã nguồn chạy trên web và mobile (Capacitor).
- **Kiểm thử đầy đủ:** 38+ E2E tests bao phủ các luồng nghiệp vụ và bảo mật quan trọng.
- **Tối ưu theo môi trường:** OTP store tự chọn in-memory hoặc Redis tùy nhu cầu.

### 12.2. Thống kê dự án

```
┌────────────────────────────────────────────┐
│           THỐNG KÊ LIFESYNC AI             │
├────────────────────────────────────────────┤
│  Module Backend:        17                  │
│  Trang Frontend:        26                  │
│  Bảng dữ liệu:          13                  │
│  Phương thức đăng nhập: 4                   │
│  E2E Tests:             38+ (PASS)           │
│  Vai trò người dùng:    3 (USER/MOD/ADMIN)  │
│  Phương thức thanh toán:4 (Stripe/VNPay/... │
│  Nền tảng:              Web + Android + iOS  │
└────────────────────────────────────────────┘
```

### 12.3. Các nhóm chức năng theo module

| Nhóm | Module liên quan |
|------|------------------|
| **Xác thực & Người dùng** | auth, users |
| **Năng suất** | tasks, tags, time-blocks, reminders, dashboard |
| **Trợ lý thông minh** | ai-chat |
| **Sức khỏe** | fitness, gps |
| **Hệ thống** | notifications, scheduler, health |
| **Quản trị & Kinh doanh** | admin, payments |

### 12.4. Hướng phát triển tương lai

- **Real-time đầy đủ:** thay polling thông báo bằng WebSocket.
- **2FA:** xác thực hai lớp (Google Authenticator).
- **Xác minh email:** khi đăng ký tài khoản.
- **Account lockout:** khóa tài khoản ở tầng DB sau nhiều lần đăng nhập sai.
- **Mở rộng AI:** ghi nhớ ngữ cảnh dài hạn, tích hợp nhiều mô hình.
- **Caching nâng cao:** Redis cho cả session, query cache.
- **Đa ngôn ngữ hoàn chỉnh:** mở rộng hệ thống i18n.

---

## PHỤ LỤC

### A. Tài liệu liên quan trong dự án

| Tài liệu | Nội dung |
|----------|----------|
| `README.md` | Hướng dẫn cài đặt & khởi động |
| `ARCHITECTURE.md` | Kiến trúc hệ thống (chi tiết kỹ thuật) |
| `CLOUDFLARE_SECURITY_SETUP.md` | Hướng dẫn thiết lập bảo mật Cloudflare |
| `CLOUDFLARE_QUICK_CHECKLIST.md` | Checklist bảo mật nhanh |
| `SECURITY_AUDIT_REPORT.md` | Báo cáo kiểm tra bảo mật |
| `SECURITY_ARCHITECTURE.md` | Kiến trúc bảo mật chi tiết |
| `AGENTS.md` | Hướng dẫn quy tắc phát triển |

### B. Lệnh thường dùng

```bash
# Backend
cd backend
npm run start:dev          # Chạy dev server
npm run build              # Build production
npm run test:e2e           # Chạy kiểm thử E2E
npx prisma migrate dev     # Chạy migration
npx prisma studio          # Mở GUI xem database

# Frontend
cd frontend
npm run dev                # Chạy dev server
npm run build              # Build production
npm run lint               # Kiểm tra code style
```

### C. Cổng dịch vụ (Development)

| Dịch vụ | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |
| phpMyAdmin | http://localhost:8080 |
| Prisma Studio | http://localhost:5555 |

---

**© 2026 LifeSync AI — Trần Đình Bảo Khang**
*Tài liệu tổng quan kiến trúc & cấu trúc dự án — Phiên bản 1.0.0*
