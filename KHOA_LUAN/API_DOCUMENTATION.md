# API DOCUMENTATION - LIFESYNC AI

**Base URL:** `http://localhost:3000` (Development)  
**Production URL:** `https://api.lifesync.com` (To be deployed)  
**API Version:** v1.0.0  
**Content-Type:** `application/json`

---

## AUTHENTICATION

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!@#"
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**Errors:**
- 400: Invalid input
- 409: Email already exists

---

### 1.2 Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!@#"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

**Errors:**
- 401: Invalid credentials

---

### 1.3 Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1..."
}
```

---

### 1.4 Get Current User
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### 1.5 Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 2. TASKS ENDPOINTS

### 2.1 Get All Tasks
```http
GET /tasks?status=TODO&priority=HIGH&search=project
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): TODO | IN_PROGRESS | COMPLETED
- `priority` (optional): LOW | MEDIUM | HIGH
- `search` (optional): Search in title/description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Complete project proposal",
      "description": "Write and submit the final proposal",
      "status": "TODO",
      "priority": "HIGH",
      "categoryId": 2,
      "dueDate": "2026-12-31T23:59:59.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "category": {
        "id": 2,
        "name": "Work",
        "color": "#3B82F6"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "pages": 1
}
```

---

### 2.2 Get Task by ID
```http
GET /tasks/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Complete project proposal",
  "description": "Write and submit the final proposal",
  "status": "TODO",
  "priority": "HIGH",
  "categoryId": 2,
  "dueDate": "2026-12-31T23:59:59.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors:**
- 404: Task not found

---

### 2.3 Create Task
```http
POST /tasks
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and submit the final proposal",
  "status": "TODO",
  "priority": "HIGH",
  "categoryId": 2,
  "dueDate": "2026-12-31T23:59:59.000Z"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Complete project proposal",
  "description": "Write and submit the final proposal",
  "status": "TODO",
  "priority": "HIGH",
  "categoryId": 2,
  "dueDate": "2026-12-31T23:59:59.000Z",
  "userId": 1,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

---

### 2.4 Update Task
```http
PATCH /tasks/:id
Authorization: Bearer <access_token>
```

**Request Body (partial update):**
```json
{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Complete project proposal",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "updatedAt": "2026-01-02T00:00:00.000Z"
}
```

---

### 2.5 Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Task deleted successfully"
}
```

---

## 3. CALENDAR & TIME BLOCKS

### 3.1 Get Time Blocks
```http
GET /time-blocks?start=2026-01-01&end=2026-01-31
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `start` (required): Start date (ISO format)
- `end` (required): End date (ISO format)

**Response (200 OK):**
```json
{
  "timeBlocks": [
    {
      "id": 1,
      "title": "Team Meeting",
      "start": "2026-01-15T09:00:00.000Z",
      "end": "2026-01-15T10:00:00.000Z",
      "taskId": 5,
      "userId": 1,
      "task": {
        "id": 5,
        "title": "Prepare meeting agenda"
      }
    }
  ]
}
```

---

### 3.2 Create Time Block
```http
POST /time-blocks
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "start": "2026-01-15T09:00:00.000Z",
  "end": "2026-01-15T10:00:00.000Z",
  "taskId": 5
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "Team Meeting",
  "start": "2026-01-15T09:00:00.000Z",
  "end": "2026-01-15T10:00:00.000Z",
  "taskId": 5,
  "userId": 1
}
```

---

### 3.3 Delete Time Block
```http
DELETE /time-blocks/:id
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Time block deleted successfully"
}
```

---

## 4. FOCUS MODE

### 4.1 Start Focus Session
```http
POST /focus/sessions
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "taskId": 1,
  "duration": 1500
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "taskId": 1,
  "duration": 1500,
  "startTime": "2026-01-15T10:00:00.000Z",
  "userId": 1
}
```

---

### 4.2 Get Focus Stats
```http
GET /focus/stats
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "totalSessions": 25,
  "totalMinutes": 625,
  "todaySessions": 3,
  "todayMinutes": 75,
  "weekSessions": 15,
  "weekMinutes": 375
}
```

---

## 5. AI CHATBOT

### 5.1 Send Message
```http
POST /ai-chat/message
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "message": "What tasks do I have today?",
  "context": {
    "userId": 1,
    "currentPage": "dashboard"
  }
}
```

**Response (200 OK):**
```json
{
  "response": "You have 3 tasks scheduled for today:\n1. Complete project proposal (High priority)\n2. Team meeting at 2 PM\n3. Code review\n\nWould you like me to help you prioritize them?",
  "timestamp": "2026-01-15T10:00:00.000Z"
}
```

**Errors:**
- 400: Invalid message
- 503: AI service unavailable

---

## 6. NOTIFICATIONS

### 6.1 Get Notifications
```http
GET /notifications?page=1&limit=50
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Task Due Soon",
      "message": "Complete project proposal is due in 2 hours",
      "type": "TASK_DUE",
      "read": false,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "total": 10,
  "unread": 5
}
```

---

### 6.2 Mark as Read
```http
PATCH /notifications/:id/read
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Notification marked as read"
}
```

---

## 7. ADMIN ENDPOINTS

**Note:** Requires ADMIN or MODERATOR role

### 7.1 Get All Users
```http
GET /admin/users?role=USER&search=john
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastLogin": "2026-01-15T10:00:00.000Z"
    }
  ],
  "total": 100
}
```

---

### 7.2 Update User Role
```http
PATCH /admin/users/:id/role
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "role": "MODERATOR"
}
```

**Response (200 OK):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": 1,
    "role": "MODERATOR"
  }
}
```

---

### 7.3 Get System Stats
```http
GET /admin/stats
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "users": {
    "total": 1000,
    "active": 750,
    "new_this_month": 50
  },
  "tasks": {
    "total": 5000,
    "completed": 3000,
    "in_progress": 1500,
    "todo": 500
  },
  "focus_sessions": {
    "total": 2500,
    "total_minutes": 62500
  }
}
```

---

### 7.4 Get Activity Logs
```http
GET /admin/activity-logs?userId=1&action=LOGIN&limit=100
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": 1,
      "userId": 1,
      "action": "LOGIN",
      "details": "User logged in from Chrome",
      "ip": "192.168.1.1",
      "timestamp": "2026-01-15T10:00:00.000Z"
    }
  ],
  "total": 500
}
```

---

## 8. CATEGORIES

### 8.1 Get Categories
```http
GET /categories
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Work",
      "color": "#3B82F6",
      "userId": 1
    },
    {
      "id": 2,
      "name": "Personal",
      "color": "#10B981",
      "userId": 1
    }
  ]
}
```

---

### 8.2 Create Category
```http
POST /categories
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Health",
  "color": "#EF4444"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Health",
  "color": "#EF4444",
  "userId": 1
}
```

---

## 9. DASHBOARD

### 9.1 Get Dashboard Data
```http
GET /dashboard
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "stats": {
    "totalTasks": 50,
    "completedTasks": 30,
    "pendingTasks": 15,
    "inProgressTasks": 5,
    "focusTime": 1250
  },
  "recentTasks": [...],
  "upcomingEvents": [...],
  "productivity": {
    "thisWeek": 85,
    "lastWeek": 78,
    "trend": "up"
  }
}
```

---

## ERROR RESPONSES

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down

---

## RATE LIMITING

- **Default:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per minute
- **Headers:**
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset timestamp

---

## PAGINATION

**Standard pagination format:**
```
GET /tasks?page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "pages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## TESTING

**Postman Collection:** Available at `/docs/postman_collection.json`  
**Swagger UI:** Available at `/api-docs` (when running)

---

**Last Updated:** June 20, 2026  
**Version:** 1.0.0
