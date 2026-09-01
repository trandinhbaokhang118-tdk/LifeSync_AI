# Kiến trúc Hệ thống LifeSync AI

## 🏗 Tổng quan Kiến trúc

LifeSync AI sử dụng kiến trúc **Client-Server** với **RESTful API**.

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           React SPA (Vite + TypeScript)          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │   Pages    │  │ Components │  │   Hooks   │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │   Store    │  │  Services  │  │   Utils   │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                    HTTP/HTTPS (REST API)
                            │
┌─────────────────────────────────────────────────────────┐
│                      SERVER SIDE                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          NestJS API (TypeScript)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │ Controllers│  │  Services  │  │    DTOs   │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │   Guards   │  │Interceptors│  │  Filters  │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                            │
│                    Prisma ORM                           │
│                            │                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Pages, Components, UI Elements)   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│         Business Logic Layer        │
│    (Hooks, Store, Services)         │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│         Data Access Layer           │
│    (API Client, React Query)        │
└─────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Router
│   ├── Public Routes
│   │   ├── Login
│   │   ├── Register
│   │   └── AuthCallback
│   ├── Private Routes (User)
│   │   └── AppLayout
│   │       ├── Header
│   │       ├── Sidebar
│   │       └── Outlet
│   │           ├── Dashboard
│   │           ├── Tasks
│   │           ├── Calendar
│   │           ├── Planner
│   │           ├── Focus
│   │           ├── Analytics
│   │           ├── Notifications
│   │           └── Settings
│   └── Admin Routes
│       └── AdminLayout
│           ├── AdminSidebar
│           └── Outlet
│               ├── AdminDashboard
│               ├── UserManagement
│               ├── ActivityLogs
│               ├── DatabaseManagement
│               └── SystemSettings
└── Global Components
    ├── Toaster
    ├── NotificationListener
    └── ErrorBoundary
```

### State Management

**Zustand Store:**
- `authStore` - Authentication state (user, tokens)

**React Query:**
- Tasks queries & mutations
- Tags queries & mutations
- Notifications queries
- Dashboard stats
- Admin data

**Local State:**
- Component-specific state (useState)
- Form state (react-hook-form)

### Routing Strategy

**React Router v7:**
- Nested routes
- Protected routes (PrivateRoute, AdminRoute)
- Lazy loading (code splitting)
- Route-based code splitting

## 🔧 Backend Architecture

### Module Structure (NestJS)

```
AppModule
├── ConfigModule (Global)
├── PrismaModule (Global)
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   ├── JwtStrategy
│   └── Guards (JwtAuthGuard, RolesGuard)
├── UsersModule
│   ├── UsersController
│   └── UsersService
├── TasksModule
│   ├── TasksController
│   └── TasksService
├── TagsModule
├── TimeBlocksModule
├── RemindersModule
├── NotificationsModule
├── DashboardModule
├── SchedulerModule
└── AdminModule
```

### Request Flow

```
Client Request
      │
      ▼
┌─────────────┐
│  Controller │ ← Route handler
└─────────────┘
      │
      ▼
┌─────────────┐
│   Guards    │ ← Authentication & Authorization
└─────────────┘
      │
      ▼
┌─────────────┐
│Interceptors │ ← Logging, Transform
└─────────────┘
      │
      ▼
┌─────────────┐
│   Service   │ ← Business Logic
└─────────────┘
      │
      ▼
┌─────────────┐
│   Prisma    │ ← Database Access
└─────────────┘
      │
      ▼
┌─────────────┐
│  Database   │
└─────────────┘
      │
      ▼
Response (JSON)
```

### Middleware & Interceptors

**Global:**
- `HttpExceptionFilter` - Error handling
- `LoggingInterceptor` - Request/Response logging
- `TransformInterceptor` - Response transformation

**Route-specific:**
- `JwtAuthGuard` - JWT validation
- `RolesGuard` - Role-based access control

## 💾 Database Architecture

### Schema Design

**Entities:**
- User (Authentication & Profile)
- Task (Todo items)
- Tag (Task categorization)
- TaskTag (Many-to-many relation)
- TimeBlock (Calendar events)
- Reminder (Scheduled notifications)
- Notification (User notifications)
- RefreshToken (JWT refresh tokens)

**Relationships:**
```
User ──┬── Tasks (1:N)
       ├── Tags (1:N)
       ├── TimeBlocks (1:N)
       ├── Reminders (1:N)
       ├── Notifications (1:N)
       └── RefreshTokens (1:N)

Task ──── TaskTags ──── Tag (M:N)
```

### Indexing Strategy

**Primary Indexes:**
- All `id` fields (UUID)

**Secondary Indexes:**
- `users.email` (unique)
- `users.phone` (unique)
- `tasks.userId`
- `tasks.status`
- `tasks.priority`
- `tasks.startAt`
- `tasks.dueAt`
- `refreshTokens.tokenHash`

## 🔐 Security Architecture

### Authentication Flow

```
1. User Login
   ├── Email/Password
   ├── Google OAuth
   ├── Facebook OAuth
   └── Phone OTP
        │
        ▼
2. Backend Validation
   ├── Verify credentials
   └── Generate tokens
        │
        ▼
3. Token Response
   ├── Access Token (JWT, 15min)
   └── Refresh Token (7 days)
        │
        ▼
4. Store Tokens
   ├── Frontend: Memory/Store
   └── Backend: Database (hashed)
```

### Authorization Levels

**Roles:**
- `USER` - Standard user
- `ADMIN` - Administrator

**Guards:**
- `JwtAuthGuard` - Validates JWT token
- `RolesGuard` - Checks user role
- `@Roles('ADMIN')` - Decorator for admin-only routes

### Data Protection

**Password:**
- Hashed with Argon2
- Never stored in plain text

**Tokens:**
- JWT signed with secret
- Refresh tokens hashed (SHA-256)
- Stored in database with expiry

**API:**
- CORS enabled
- Rate limiting (recommended)
- Input validation (class-validator)
- SQL injection prevention (Prisma)

## 🚀 Deployment Architecture

### Development

```
Developer Machine
├── Frontend (Vite Dev Server) :5173
├── Backend (NestJS) :3000
└── PostgreSQL (Docker) :5432
```

### Production (Recommended)

```
┌─────────────────────────────────────┐
│          Load Balancer              │
│         (Nginx/Cloudflare)          │
└─────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐        ┌─────▼────┐
│Frontend│        │ Backend  │
│ (CDN)  │        │(Node.js) │
└────────┘        └──────────┘
                       │
                  ┌────▼─────┐
                  │PostgreSQL│
                  │(Managed) │
                  └──────────┘
```

### Docker Deployment

```yaml
services:
  frontend:
    - Build: Vite production build
    - Serve: Nginx
    - Port: 80/443
  
  backend:
    - Runtime: Node.js
    - Port: 3000
    - Env: Production
  
  database:
    - Image: postgres:15
    - Volume: Persistent storage
    - Port: 5432
```

## 📊 Performance Optimization

### Frontend

**Code Splitting:**
- Route-based splitting
- Lazy loading components
- Dynamic imports

**Caching:**
- React Query cache
- Service Worker (PWA)
- Browser cache headers

**Optimization:**
- Tree shaking (Vite)
- Minification
- Image optimization
- CSS purging (TailwindCSS)

### Backend

**Database:**
- Connection pooling (Prisma)
- Query optimization
- Proper indexing
- Pagination

**Caching:**
- Redis (recommended)
- In-memory cache
- Query result caching

**API:**
- Response compression
- Efficient serialization
- Batch operations

## 🔄 Data Flow Examples

### Create Task Flow

```
User Action (Frontend)
      │
      ▼
Form Submission
      │
      ▼
React Hook Form Validation
      │
      ▼
API Call (axios)
      │
      ▼
Backend Controller
      │
      ▼
DTO Validation
      │
      ▼
Service Layer
      │
      ▼
Prisma Create
      │
      ▼
Database Insert
      │
      ▼
Response
      │
      ▼
React Query Cache Update
      │
      ▼
UI Update
```

### Real-time Notification Flow

```
Scheduled Job (Cron)
      │
      ▼
Check Reminders
      │
      ▼
Create Notification
      │
      ▼
Database Insert
      │
      ▼
(Future: WebSocket Push)
      │
      ▼
Frontend Poll/Fetch
      │
      ▼
Display Toast
```

## 🧪 Testing Strategy

**Frontend:**
- Unit tests (Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright/Cypress)

**Backend:**
- Unit tests (Jest)
- Integration tests
- E2E tests (Supertest)

**Database:**
- Migration tests
- Seed data tests
