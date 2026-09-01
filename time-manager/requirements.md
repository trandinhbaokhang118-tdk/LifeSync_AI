# Requirements Document

## Introduction

Website Quản lý thời gian (LifeSync AI) là một ứng dụng web full-stack giúp người dùng quản lý công việc, lên lịch thời gian, và theo dõi năng suất làm việc. Hệ thống được xây dựng theo chuẩn học thuật và dự án thực tế với Node.js + React + PostgreSQL (Docker) + Prisma, bao gồm đầy đủ tài liệu, quy trình CI/CD, và kiểm thử.

## Glossary

- **Time_Manager**: Hệ thống quản lý thời gian web application
- **User**: Người dùng đã đăng ký tài khoản trong hệ thống
- **Admin**: Người dùng có quyền quản trị hệ thống
- **Task**: Công việc cần thực hiện với các thuộc tính title, description, status, priority, dueAt
- **Tag**: Nhãn phân loại công việc
- **Time_Block**: Khối thời gian được lên lịch cho một hoạt động cụ thể
- **Reminder**: Nhắc nhở được đặt cho một thời điểm cụ thể
- **Notification**: Thông báo trong ứng dụng gửi đến người dùng
- **JWT**: JSON Web Token dùng cho xác thực
- **Refresh_Token**: Token dùng để làm mới access token
- **Overlap**: Trùng lặp thời gian giữa các time block

## Requirements

### Requirement 1: Project Infrastructure Setup

**User Story:** As a developer, I want a well-structured mono-repo with Docker, PostgreSQL, and Prisma setup, so that I can develop and deploy the application consistently.

#### Acceptance Criteria

1. WHEN the developer clones the repository THEN the Time_Manager SHALL provide a mono-repo structure with backend/, frontend/, docs/, docker-compose.yml, README.md, and .gitignore
2. WHEN the developer runs docker compose up -d THEN the Time_Manager SHALL start PostgreSQL 16 container with name time_manager_postgres on port 5432 with persistent volume and healthcheck
3. WHEN the developer runs npx prisma migrate dev THEN the Time_Manager SHALL execute all database migrations successfully
4. WHEN the developer runs npx prisma studio THEN the Time_Manager SHALL open Prisma Studio for database inspection
5. WHEN the developer runs the seed command THEN the Time_Manager SHALL create one admin user with role ADMIN and one demo user

### Requirement 2: User Authentication

**User Story:** As a user, I want to register, login, and manage my session securely, so that I can access my personal data safely.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (email, password, name) THEN the Time_Manager SHALL create a new user account with hashed password using argon2 or bcrypt
2. WHEN a user submits valid login credentials THEN the Time_Manager SHALL return JWT access token and refresh token, storing hashed refresh token in refresh_tokens table
3. WHEN a user sends a valid refresh token THEN the Time_Manager SHALL return a new access token and rotate the refresh token
4. WHEN a user logs out THEN the Time_Manager SHALL invalidate the refresh token in the database
5. WHEN an unauthenticated request accesses a protected route THEN the Time_Manager SHALL return 401 Unauthorized error
6. WHEN a user attempts to access another user's data THEN the Time_Manager SHALL return 403 Forbidden error

### Requirement 3: Task Management

**User Story:** As a user, I want to create, read, update, and delete tasks with tags, so that I can organize my work effectively.

#### Acceptance Criteria

1. WHEN a user creates a task with title, description, status, priority, dueAt, and tags THEN the Time_Manager SHALL store the task and return the created task with generated ID
2. WHEN a user requests their task list THEN the Time_Manager SHALL return only tasks belonging to that user
3. WHEN a user updates a task THEN the Time_Manager SHALL modify the task and return the updated task
4. WHEN a user deletes a task THEN the Time_Manager SHALL remove the task and its associated tag relationships
5. WHEN a user filters tasks by status, priority, or date range THEN the Time_Manager SHALL return matching tasks sorted by the specified criteria
6. WHEN a user searches tasks by keyword THEN the Time_Manager SHALL return tasks with matching title or description

### Requirement 4: Tag Management

**User Story:** As a user, I want to create and manage tags, so that I can categorize my tasks efficiently.

#### Acceptance Criteria

1. WHEN a user creates a tag with name and color THEN the Time_Manager SHALL store the tag and return the created tag
2. WHEN a user assigns tags to a task THEN the Time_Manager SHALL create task_tags relationships
3. WHEN a user removes a tag from a task THEN the Time_Manager SHALL delete the corresponding task_tags relationship
4. WHEN a user deletes a tag THEN the Time_Manager SHALL remove all task_tags relationships for that tag

### Requirement 5: Time Block Management

**User Story:** As a user, I want to schedule time blocks on a calendar, so that I can plan my focused work sessions.

#### Acceptance Criteria

1. WHEN a user creates a time block with title, startAt, and endAt THEN the Time_Manager SHALL validate that startAt is before endAt and store the time block
2. WHEN a user creates a time block that overlaps with an existing block (startA < endB AND startB < endA) THEN the Time_Manager SHALL reject the creation with an overlap error
3. WHEN a user requests time blocks for a date range THEN the Time_Manager SHALL return all time blocks within that range for the user
4. WHEN a user updates a time block THEN the Time_Manager SHALL validate no overlap occurs and update the block
5. WHEN a user deletes a time block THEN the Time_Manager SHALL remove the time block from the database

### Requirement 6: Reminder and Notification System

**User Story:** As a user, I want to set reminders and receive in-app notifications, so that I never miss important deadlines.

#### Acceptance Criteria

1. WHEN a user creates a reminder with triggerAt timestamp THEN the Time_Manager SHALL store the reminder associated with the user
2. WHEN the scheduler detects a reminder's triggerAt time has passed THEN the Time_Manager SHALL create a notification for the user
3. WHEN a user requests their notifications THEN the Time_Manager SHALL return all notifications sorted by creation time descending
4. WHEN a user marks a notification as read THEN the Time_Manager SHALL update the notification's read status
5. WHEN a user views the notification badge THEN the Time_Manager SHALL display the count of unread notifications

### Requirement 7: Dashboard and Analytics

**User Story:** As a user, I want to view my productivity statistics, so that I can track my progress and improve my time management.

#### Acceptance Criteria

1. WHEN a user requests dashboard statistics THEN the Time_Manager SHALL return tasks due today, overdue tasks count, and tasks completed this week
2. WHEN a user requests focus time analytics THEN the Time_Manager SHALL return total time blocked for the current week
3. WHEN a user views the dashboard THEN the Time_Manager SHALL display statistics in cards and a simple chart

### Requirement 8: API Standards and Documentation

**User Story:** As a developer, I want consistent API responses and documentation, so that I can integrate and maintain the system easily.

#### Acceptance Criteria

1. WHEN an API request succeeds THEN the Time_Manager SHALL return response in format { data, meta? }
2. WHEN an API request fails THEN the Time_Manager SHALL return error in format { error: { code, message, details? } }
3. WHEN the developer accesses /api-docs or /swagger THEN the Time_Manager SHALL display OpenAPI/Swagger documentation
4. WHEN the developer accesses /health endpoint THEN the Time_Manager SHALL return { ok: true }
5. WHEN any API request is processed THEN the Time_Manager SHALL log request method, path, status, and response time

### Requirement 9: Frontend Application Structure

**User Story:** As a user, I want a responsive web interface, so that I can manage my time from any device.

#### Acceptance Criteria

1. WHEN an unauthenticated user accesses a private route THEN the Time_Manager SHALL redirect to the login page
2. WHEN an authenticated user accesses the application THEN the Time_Manager SHALL display the dashboard as the default view
3. WHEN the frontend makes API calls THEN the Time_Manager SHALL use axios with baseURL from VITE_API_URL environment variable
4. WHEN the frontend fetches data THEN the Time_Manager SHALL use TanStack Query for caching and state management

### Requirement 10: Code Quality and CI/CD

**User Story:** As a developer, I want automated code quality checks and CI pipeline, so that I can maintain high code standards.

#### Acceptance Criteria

1. WHEN code is committed THEN the Time_Manager SHALL enforce ESLint and Prettier rules for both frontend and backend
2. WHEN a pull request is created THEN the Time_Manager SHALL run GitHub Actions workflow: install → lint → test → build
3. WHEN CI checks fail THEN the Time_Manager SHALL block the pull request from merging
4. WHEN the developer checks .env files THEN the Time_Manager SHALL have .env.example committed but .env ignored

### Requirement 11: Documentation

**User Story:** As a stakeholder, I want comprehensive documentation, so that I can understand, use, and maintain the system.

#### Acceptance Criteria

1. WHEN the project is delivered THEN the Time_Manager SHALL include SRS.md with functional and non-functional requirements, use-cases, and acceptance criteria
2. WHEN the project is delivered THEN the Time_Manager SHALL include SDD.md with architecture, modules, sequence diagrams, and data design
3. WHEN the project is delivered THEN the Time_Manager SHALL include ERD.md with database tables, relationships, and important indexes
4. WHEN the project is delivered THEN the Time_Manager SHALL include API.md with endpoint documentation and sample requests/responses
5. WHEN the project is delivered THEN the Time_Manager SHALL include TestPlan.md with test cases mapped to requirements
6. WHEN the project is delivered THEN the Time_Manager SHALL include UserManual.md with usage instructions
7. WHEN the project is delivered THEN the Time_Manager SHALL include Deployment.md with local and Docker deployment instructions
8. WHEN the project is delivered THEN the Time_Manager SHALL include ProjectPlan.md with 30-day Gantt chart

### Requirement 12: Database Schema

**User Story:** As a developer, I want a well-designed database schema, so that I can store and query data efficiently.

#### Acceptance Criteria

1. WHEN the database is initialized THEN the Time_Manager SHALL have tables: users, refresh_tokens, tasks, tags, task_tags, time_blocks, reminders, notifications
2. WHEN a time_block is created THEN the Time_Manager SHALL enforce constraint that startAt is less than endAt
3. WHEN querying user data THEN the Time_Manager SHALL use appropriate indexes for performance optimization
