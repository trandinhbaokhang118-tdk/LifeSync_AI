# API Documentation
# LifeSync AI Backend

Base URL: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api-docs`

## Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2025-01-12T00:00:00.000Z"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    }
  }
}
```

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### POST /auth/logout
Logout and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Tasks Endpoints

### GET /tasks
List tasks with filtering and pagination.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| status | string | Filter by status (TODO, IN_PROGRESS, DONE) |
| priority | string | Filter by priority (LOW, MEDIUM, HIGH) |
| search | string | Search in title/description |
| startDate | string | Filter by dueAt >= startDate |
| endDate | string | Filter by dueAt <= endDate |
| sortBy | string | Sort field (dueAt, createdAt, priority) |
| sortOrder | string | Sort order (asc, desc) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Description",
      "status": "TODO",
      "priority": "HIGH",
      "dueAt": "2025-01-15T00:00:00.000Z",
      "tags": [
        { "id": "uuid", "name": "Work", "color": "#3b82f6" }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Task title",
  "description": "Description",
  "status": "TODO",
  "priority": "HIGH",
  "dueAt": "2025-01-15T00:00:00.000Z",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

### GET /tasks/:id
Get task by ID.

### PATCH /tasks/:id
Update task.

### DELETE /tasks/:id
Delete task.

---

## Tags Endpoints

### GET /tags
List all user tags.

**Response (200):**
```json
{
  "data": [
    { "id": "uuid", "name": "Work", "color": "#3b82f6" },
    { "id": "uuid", "name": "Personal", "color": "#10b981" }
  ]
}
```

### POST /tags
Create a new tag.

**Request Body:**
```json
{
  "name": "Work",
  "color": "#3b82f6"
}
```

### DELETE /tags/:id
Delete tag.

---

## Time Blocks Endpoints

### GET /time-blocks
List time blocks by date range.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| startDate | string | Yes | Start of range (ISO 8601) |
| endDate | string | Yes | End of range (ISO 8601) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Focus time",
      "description": "Working on project",
      "startAt": "2025-01-12T09:00:00.000Z",
      "endAt": "2025-01-12T11:00:00.000Z"
    }
  ]
}
```

### POST /time-blocks
Create a new time block.

**Request Body:**
```json
{
  "title": "Focus time",
  "description": "Working on project",
  "startAt": "2025-01-12T09:00:00.000Z",
  "endAt": "2025-01-12T11:00:00.000Z"
}
```

**Error (409 - Overlap):**
```json
{
  "error": {
    "code": "TIME_BLOCK_OVERLAP",
    "message": "Time block overlaps with existing block"
  }
}
```

### PATCH /time-blocks/:id
Update time block.

### DELETE /time-blocks/:id
Delete time block.

---

## Reminders Endpoints

### GET /reminders
List all user reminders.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "message": "Meeting at 3pm",
      "triggerAt": "2025-01-12T15:00:00.000Z",
      "triggered": false
    }
  ]
}
```

### POST /reminders
Create a new reminder.

**Request Body:**
```json
{
  "message": "Meeting at 3pm",
  "triggerAt": "2025-01-12T15:00:00.000Z"
}
```

### DELETE /reminders/:id
Delete reminder.

---

## Notifications Endpoints

### GET /notifications
List notifications with pagination.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Reminder",
      "message": "Meeting at 3pm",
      "readAt": null,
      "createdAt": "2025-01-12T15:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### GET /notifications/unread-count
Get count of unread notifications.

**Response (200):**
```json
{
  "data": {
    "count": 3
  }
}
```

### PATCH /notifications/:id/read
Mark notification as read.

---

## Dashboard Endpoints

### GET /dashboard/stats
Get task statistics.

**Response (200):**
```json
{
  "data": {
    "tasksDueToday": 5,
    "tasksOverdue": 2,
    "tasksCompletedThisWeek": 10
  }
}
```

### GET /dashboard/focus-time
Get weekly focus time.

**Response (200):**
```json
{
  "data": {
    "totalMinutes": 480,
    "totalHours": 8
  }
}
```

---

## Health Endpoint

### GET /health
Health check endpoint.

**Response (200):**
```json
{
  "ok": true
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Invalid email or password |
| AUTH_REFRESH_INVALID | 401 | Invalid or expired refresh token |
| AUTH_UNAUTHORIZED | 401 | Missing or invalid access token |
| RESOURCE_NOT_FOUND | 404 | Resource not found |
| RESOURCE_FORBIDDEN | 403 | Access denied |
| TIME_BLOCK_OVERLAP | 409 | Time block overlaps |
| VALIDATION_ERROR | 400 | Invalid input data |
