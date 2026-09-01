# Software Design Document (SDD)
# LifeSync AI Application

## 1. System Architecture

### 1.1 Overview
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│  React + Vite   │     │     NestJS      │     │    Database     │
│   Port: 5173    │     │   Port: 3000    │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1.2 Technology Stack
- **Frontend**: React 19, TypeScript, Vite, TanStack Query, Zustand, React Router
- **Backend**: NestJS, TypeScript, Prisma ORM, JWT, Swagger
- **Database**: PostgreSQL 16 (Docker)
- **Authentication**: JWT + Refresh Token

## 2. Backend Architecture

### 2.1 Module Structure
```
backend/src/
├── app.module.ts          # Root module
├── main.ts                # Entry point
├── auth/                  # Authentication module
├── users/                 # User management
├── tasks/                 # Task CRUD
├── tags/                  # Tag management
├── time-blocks/           # Time block management
├── reminders/             # Reminder management
├── notifications/         # Notification system
├── dashboard/             # Statistics
├── scheduler/             # Cron jobs
├── prisma/                # Database service
├── common/                # Shared utilities
│   ├── dto/
│   ├── filters/
│   └── interceptors/
└── health/                # Health check
```

### 2.2 Module Dependencies
```
AppModule
├── ConfigModule (global)
├── PrismaModule
├── AuthModule
│   ├── UsersModule
│   └── JwtModule
├── TasksModule
├── TagsModule
├── TimeBlocksModule
├── RemindersModule
├── NotificationsModule
├── DashboardModule
└── SchedulerModule
```

## 3. API Design

### 3.1 Response Format
**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### 3.2 Authentication Flow
```
1. Register: POST /auth/register
   └─▶ Create user with hashed password

2. Login: POST /auth/login
   └─▶ Verify credentials
   └─▶ Generate JWT access token (15m)
   └─▶ Generate refresh token (7d)
   └─▶ Store hashed refresh token in DB

3. Refresh: POST /auth/refresh
   └─▶ Verify refresh token
   └─▶ Delete old token (rotation)
   └─▶ Generate new tokens

4. Logout: POST /auth/logout
   └─▶ Delete refresh token from DB
```

## 4. Database Design

### 4.1 Entity Relationship Diagram
```
┌──────────────┐       ┌──────────────┐
│    User      │───────│RefreshToken  │
│──────────────│  1:N  │──────────────│
│ id           │       │ id           │
│ email        │       │ userId       │
│ passwordHash │       │ tokenHash    │
│ name         │       │ expiresAt    │
│ role         │       └──────────────┘
└──────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Task      │───────│   TaskTag    │───────│     Tag      │
│──────────────│  1:N  │──────────────│  N:1  │──────────────│
│ id           │       │ taskId       │       │ id           │
│ userId       │       │ tagId        │       │ userId       │
│ title        │       └──────────────┘       │ name         │
│ description  │                              │ color        │
│ status       │                              └──────────────┘
│ priority     │
│ dueAt        │
└──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  TimeBlock   │       │   Reminder   │       │ Notification │
│──────────────│       │──────────────│       │──────────────│
│ id           │       │ id           │       │ id           │
│ userId       │       │ userId       │       │ userId       │
│ title        │       │ message      │       │ title        │
│ description  │       │ triggerAt    │       │ message      │
│ startAt      │       │ triggered    │       │ readAt       │
│ endAt        │       └──────────────┘       └──────────────┘
└──────────────┘
```

### 4.2 Indexes
- `User.email` - UNIQUE
- `Task.userId` - INDEX
- `Task.status` - INDEX
- `TimeBlock.userId` - INDEX
- `TimeBlock.startAt` - INDEX
- `Reminder.triggerAt` - INDEX

## 5. Frontend Architecture

### 5.1 Folder Structure
```
frontend/src/
├── app/
│   ├── router.tsx         # Route definitions
│   └── queryClient.ts     # TanStack Query config
├── components/
│   └── auth/
│       └── PrivateRoute.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Tasks.tsx
│   ├── Calendar.tsx
│   ├── Reminders.tsx
│   └── Notifications.tsx
├── services/
│   ├── api.ts             # Axios instance
│   ├── tasks.service.ts
│   ├── tags.service.ts
│   ├── time-blocks.service.ts
│   ├── reminders.service.ts
│   ├── notifications.service.ts
│   └── dashboard.service.ts
├── store/
│   └── auth.store.ts      # Zustand store
├── types/
│   └── index.ts           # TypeScript types
└── App.tsx
```

### 5.2 State Management
- **Server State**: TanStack Query (caching, refetching)
- **Client State**: Zustand (auth state)
- **Token Storage**: localStorage

## 6. Security Considerations

### 6.1 Authentication
- JWT với expiration ngắn (15 phút)
- Refresh token rotation
- Password hashing với argon2

### 6.2 Authorization
- User chỉ truy cập data của mình
- JwtAuthGuard bảo vệ protected routes
- @CurrentUser decorator để lấy user từ request

### 6.3 Input Validation
- class-validator cho DTOs
- ValidationPipe global
- Whitelist unknown properties

## 7. Sequence Diagrams

### 7.1 Login Flow
```
User        Frontend       Backend        Database
 │             │              │              │
 │─Login Form─▶│              │              │
 │             │─POST /login─▶│              │
 │             │              │─Find User───▶│
 │             │              │◀────User─────│
 │             │              │─Verify Pass──│
 │             │              │─Gen Tokens───│
 │             │              │─Save Token──▶│
 │             │◀───Tokens────│              │
 │◀─Dashboard──│              │              │
```

### 7.2 Create Task Flow
```
User        Frontend       Backend        Database
 │             │              │              │
 │─Task Form──▶│              │              │
 │             │─POST /tasks─▶│              │
 │             │              │─Validate────▶│
 │             │              │─Create Task─▶│
 │             │              │◀───Task──────│
 │             │◀───Task──────│              │
 │◀─Task List──│              │              │
```
