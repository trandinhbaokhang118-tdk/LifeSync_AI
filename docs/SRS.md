# Software Requirements Specification (SRS)
# LifeSync AI Application

## 1. Introduction

### 1.1 Purpose
Tài liệu này mô tả các yêu cầu chức năng và phi chức năng cho ứng dụng LifeSync AI - một hệ thống quản lý thời gian và công việc.

### 1.2 Scope
LifeSync AI là ứng dụng web full-stack cho phép người dùng:
- Quản lý công việc (tasks) với tags và priorities
- Lập lịch time blocks trên calendar
- Đặt reminders và nhận notifications
- Xem dashboard thống kê

### 1.3 Definitions
- **Task**: Công việc cần thực hiện
- **Time Block**: Khối thời gian được lên lịch
- **Reminder**: Nhắc nhở theo thời gian
- **Tag**: Nhãn phân loại công việc

## 2. Functional Requirements

### FR-01: User Registration
- **Description**: Người dùng có thể đăng ký tài khoản mới
- **Input**: Email, password, name
- **Output**: Tài khoản được tạo
- **Acceptance Criteria**:
  - Email phải unique
  - Password tối thiểu 6 ký tự
  - Password được hash bằng argon2

### FR-02: User Login
- **Description**: Người dùng đăng nhập vào hệ thống
- **Input**: Email, password
- **Output**: Access token + Refresh token
- **Acceptance Criteria**:
  - Trả về JWT access token (15 phút)
  - Trả về refresh token (7 ngày)
  - Sai credentials trả về 401

### FR-03: Token Refresh
- **Description**: Làm mới access token
- **Input**: Refresh token
- **Output**: New access token + new refresh token
- **Acceptance Criteria**:
  - Token rotation (old token bị invalidate)
  - Expired token trả về 401

### FR-04: User Logout
- **Description**: Đăng xuất khỏi hệ thống
- **Input**: Refresh token
- **Output**: Token bị invalidate
- **Acceptance Criteria**:
  - Refresh token bị xóa khỏi database

### FR-05: Task CRUD
- **Description**: Tạo, đọc, sửa, xóa tasks
- **Acceptance Criteria**:
  - User chỉ truy cập được tasks của mình
  - Task có: title, description, status, priority, dueAt
  - Status: TODO, IN_PROGRESS, DONE
  - Priority: LOW, MEDIUM, HIGH

### FR-06: Task Filtering & Search
- **Description**: Lọc và tìm kiếm tasks
- **Acceptance Criteria**:
  - Filter by status, priority, date range
  - Search by keyword (title/description)
  - Sort by dueAt, createdAt, priority

### FR-07: Tag Management
- **Description**: Quản lý tags cho tasks
- **Acceptance Criteria**:
  - CRUD tags (name, color)
  - Gán/gỡ tags cho tasks
  - User chỉ truy cập tags của mình

### FR-08: Time Block Management
- **Description**: Quản lý time blocks trên calendar
- **Acceptance Criteria**:
  - CRUD time blocks (title, startAt, endAt)
  - startAt < endAt
  - Không cho phép overlap time blocks
  - Query by date range

### FR-09: Reminder Management
- **Description**: Đặt reminders
- **Acceptance Criteria**:
  - Tạo reminder với message và triggerAt
  - Scheduler tự động trigger khi đến giờ
  - Tạo notification khi trigger

### FR-10: Notification System
- **Description**: Hệ thống thông báo in-app
- **Acceptance Criteria**:
  - List notifications với pagination
  - Đếm số unread
  - Mark as read

### FR-11: Dashboard Statistics
- **Description**: Thống kê trên dashboard
- **Acceptance Criteria**:
  - Tasks due today
  - Overdue tasks
  - Tasks completed this week
  - Focus time (tổng thời gian time blocks trong tuần)

## 3. Non-Functional Requirements

### NFR-01: Performance
- API response time < 500ms
- Support 100 concurrent users

### NFR-02: Security
- Password hashing với argon2
- JWT authentication
- CORS configuration
- Input validation

### NFR-03: Reliability
- Health check endpoint
- Error handling với consistent format
- Logging

### NFR-04: Maintainability
- TypeScript cho type safety
- ESLint + Prettier
- Modular architecture

## 4. Use Cases

### UC-01: Đăng ký tài khoản
**Actor**: Guest
**Precondition**: Chưa có tài khoản
**Flow**:
1. Nhập email, password, name
2. Submit form
3. Hệ thống validate và tạo tài khoản
4. Redirect đến login

### UC-02: Quản lý công việc
**Actor**: Authenticated User
**Flow**:
1. Xem danh sách tasks
2. Tạo task mới với title, description, priority
3. Gán tags cho task
4. Cập nhật status khi hoàn thành
5. Xóa task không cần thiết

### UC-03: Lập lịch time block
**Actor**: Authenticated User
**Flow**:
1. Mở calendar view
2. Chọn ngày và giờ
3. Tạo time block với title
4. Hệ thống kiểm tra overlap
5. Lưu time block

### UC-04: Đặt reminder
**Actor**: Authenticated User
**Flow**:
1. Tạo reminder với message
2. Chọn thời gian trigger
3. Khi đến giờ, scheduler tạo notification
4. User nhận notification

## 5. Data Requirements

### Entity: User
- id (UUID)
- email (unique)
- passwordHash
- name
- role (USER/ADMIN)
- createdAt, updatedAt

### Entity: Task
- id (UUID)
- userId (FK)
- title, description
- status, priority
- dueAt
- createdAt, updatedAt

### Entity: Tag
- id (UUID)
- userId (FK)
- name, color
- createdAt

### Entity: TimeBlock
- id (UUID)
- userId (FK)
- title, description
- startAt, endAt
- createdAt, updatedAt

### Entity: Reminder
- id (UUID)
- userId (FK)
- message
- triggerAt
- triggered (boolean)
- createdAt

### Entity: Notification
- id (UUID)
- userId (FK)
- title, message
- readAt
- createdAt
