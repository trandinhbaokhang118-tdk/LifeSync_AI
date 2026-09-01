# Entity Relationship Diagram (ERD)
# LifeSync AI Database

## Database Schema

### 1. User Table
```sql
CREATE TABLE "User" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'USER',  -- USER, ADMIN
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP DEFAULT NOW()
);
```

### 2. RefreshToken Table
```sql
CREATE TABLE "RefreshToken" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    tokenHash   VARCHAR(255) NOT NULL,
    expiresAt   TIMESTAMP NOT NULL,
    createdAt   TIMESTAMP DEFAULT NOW()
);
```

### 3. Task Table
```sql
CREATE TABLE "Task" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20) DEFAULT 'TODO',      -- TODO, IN_PROGRESS, DONE
    priority    VARCHAR(20) DEFAULT 'MEDIUM',    -- LOW, MEDIUM, HIGH
    dueAt       TIMESTAMP,
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP DEFAULT NOW()
);
```

### 4. Tag Table
```sql
CREATE TABLE "Tag" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7) DEFAULT '#3b82f6',
    createdAt   TIMESTAMP DEFAULT NOW()
);
```

### 5. TaskTag Table (Junction)
```sql
CREATE TABLE "TaskTag" (
    taskId      UUID NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
    tagId       UUID NOT NULL REFERENCES "Tag"(id) ON DELETE CASCADE,
    PRIMARY KEY (taskId, tagId)
);
```

### 6. TimeBlock Table
```sql
CREATE TABLE "TimeBlock" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    startAt     TIMESTAMP NOT NULL,
    endAt       TIMESTAMP NOT NULL,
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (startAt < endAt)
);
```

### 7. Reminder Table
```sql
CREATE TABLE "Reminder" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    triggerAt   TIMESTAMP NOT NULL,
    triggered   BOOLEAN DEFAULT FALSE,
    createdAt   TIMESTAMP DEFAULT NOW()
);
```

### 8. Notification Table
```sql
CREATE TABLE "Notification" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    readAt      TIMESTAMP,
    createdAt   TIMESTAMP DEFAULT NOW()
);
```

## ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────┐                                                           │
│  │    User      │                                                           │
│  │──────────────│                                                           │
│  │ PK id        │◀─────────────────────────────────────────────────────┐    │
│  │    email     │                                                      │    │
│  │    password  │                                                      │    │
│  │    name      │                                                      │    │
│  │    role      │                                                      │    │
│  └──────────────┘                                                      │    │
│         │                                                              │    │
│         │ 1:N                                                          │    │
│         ▼                                                              │    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │    │
│  │RefreshToken  │    │    Task      │    │     Tag      │             │    │
│  │──────────────│    │──────────────│    │──────────────│             │    │
│  │ PK id        │    │ PK id        │    │ PK id        │             │    │
│  │ FK userId    │    │ FK userId    │    │ FK userId    │             │    │
│  │    tokenHash │    │    title     │    │    name      │             │    │
│  │    expiresAt │    │    desc      │    │    color     │             │    │
│  └──────────────┘    │    status    │    └──────────────┘             │    │
│                      │    priority  │           │                      │    │
│                      │    dueAt     │           │                      │    │
│                      └──────────────┘           │                      │    │
│                             │                   │                      │    │
│                             │ 1:N               │ 1:N                  │    │
│                             ▼                   ▼                      │    │
│                      ┌──────────────────────────┐                      │    │
│                      │       TaskTag            │                      │    │
│                      │──────────────────────────│                      │    │
│                      │ PK,FK taskId             │                      │    │
│                      │ PK,FK tagId              │                      │    │
│                      └──────────────────────────┘                      │    │
│                                                                        │    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │    │
│  │  TimeBlock   │    │   Reminder   │    │ Notification │             │    │
│  │──────────────│    │──────────────│    │──────────────│             │    │
│  │ PK id        │    │ PK id        │    │ PK id        │             │    │
│  │ FK userId ───│────│ FK userId ───│────│ FK userId ───│─────────────┘    │
│  │    title     │    │    message   │    │    title     │                  │
│  │    desc      │    │    triggerAt │    │    message   │                  │
│  │    startAt   │    │    triggered │    │    readAt    │                  │
│  │    endAt     │    └──────────────┘    └──────────────┘                  │
│  └──────────────┘                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Relationships

| Parent | Child | Type | On Delete |
|--------|-------|------|-----------|
| User | RefreshToken | 1:N | CASCADE |
| User | Task | 1:N | CASCADE |
| User | Tag | 1:N | CASCADE |
| User | TimeBlock | 1:N | CASCADE |
| User | Reminder | 1:N | CASCADE |
| User | Notification | 1:N | CASCADE |
| Task | TaskTag | 1:N | CASCADE |
| Tag | TaskTag | 1:N | CASCADE |

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| User | email | UNIQUE | Fast lookup by email |
| Task | userId | INDEX | Filter tasks by user |
| Task | status | INDEX | Filter by status |
| Task | dueAt | INDEX | Sort/filter by due date |
| TimeBlock | userId | INDEX | Filter by user |
| TimeBlock | startAt | INDEX | Range queries |
| Reminder | triggerAt | INDEX | Scheduler queries |
| Notification | userId, createdAt | INDEX | List notifications |

## Constraints

1. **User.email**: Must be unique
2. **TimeBlock**: startAt < endAt (CHECK constraint)
3. **TimeBlock**: No overlapping blocks for same user (enforced in application)
4. **Task.status**: Must be one of TODO, IN_PROGRESS, DONE
5. **Task.priority**: Must be one of LOW, MEDIUM, HIGH
6. **User.role**: Must be one of USER, ADMIN
