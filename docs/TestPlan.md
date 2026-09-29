# Test Plan
# LifeSync AI Application

## 1. Test Strategy

### 1.1 Test Levels
- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints
- **E2E Tests**: Full user flows

### 1.2 Test Tools
- **Backend**: Jest, Supertest
- **Frontend**: Vitest, React Testing Library

## 2. Test Cases

### TC-01: User Registration
**Requirement**: FR-01
**Given**: User is on registration page
**When**: User submits valid email, password, name
**Then**: Account is created and user is redirected to login

**Acceptance Criteria**:
- [ ] Email must be unique
- [ ] Password minimum 6 characters
- [ ] Name is required
- [ ] Success message displayed

### TC-02: User Registration - Duplicate Email
**Requirement**: FR-01
**Given**: Email already exists in system
**When**: User tries to register with same email
**Then**: Error message "Email already exists" is shown

### TC-03: User Login - Success
**Requirement**: FR-02
**Given**: User has valid account
**When**: User enters correct email and password
**Then**: User receives tokens and is redirected to dashboard

### TC-04: User Login - Invalid Credentials
**Requirement**: FR-02
**Given**: User enters wrong password
**When**: User submits login form
**Then**: Error message "Invalid email or password" is shown

### TC-05: Token Refresh
**Requirement**: FR-03
**Given**: User has valid refresh token
**When**: Access token expires and refresh is called
**Then**: New access token and refresh token are returned

### TC-06: Token Refresh - Expired
**Requirement**: FR-03
**Given**: Refresh token is expired
**When**: User tries to refresh
**Then**: 401 error and user is redirected to login

### TC-07: User Logout
**Requirement**: FR-04
**Given**: User is logged in
**When**: User clicks logout
**Then**: Tokens are invalidated and user is redirected to login

### TC-08: Create Task
**Requirement**: FR-05
**Given**: User is authenticated
**When**: User creates task with title "Test Task"
**Then**: Task is created and appears in task list

### TC-09: Update Task Status
**Requirement**: FR-05
**Given**: Task exists with status TODO
**When**: User changes status to DONE
**Then**: Task status is updated

### TC-10: Delete Task
**Requirement**: FR-05
**Given**: Task exists
**When**: User deletes task
**Then**: Task is removed from list

### TC-11: Task Data Isolation
**Requirement**: FR-05
**Given**: User A has tasks
**When**: User B tries to access User A's tasks
**Then**: 403 Forbidden error

### TC-12: Filter Tasks by Status
**Requirement**: FR-06
**Given**: Tasks with different statuses exist
**When**: User filters by status "DONE"
**Then**: Only completed tasks are shown

### TC-13: Search Tasks
**Requirement**: FR-06
**Given**: Tasks with various titles exist
**When**: User searches for "meeting"
**Then**: Only tasks containing "meeting" are shown

### TC-14: Create Tag
**Requirement**: FR-07
**Given**: User is authenticated
**When**: User creates tag "Work" with color "#3b82f6"
**Then**: Tag is created and available for tasks

### TC-15: Assign Tag to Task
**Requirement**: FR-07
**Given**: Task and tag exist
**When**: User assigns tag to task
**Then**: Tag appears on task

### TC-16: Create Time Block
**Requirement**: FR-08
**Given**: User is on calendar page
**When**: User creates time block 9:00-11:00
**Then**: Time block appears on calendar

### TC-17: Time Block Overlap Prevention
**Requirement**: FR-08
**Given**: Time block exists 9:00-11:00
**When**: User tries to create block 10:00-12:00
**Then**: Error "Time block overlaps" is shown

### TC-18: Time Block Validation
**Requirement**: FR-08
**Given**: User creates time block
**When**: startAt > endAt
**Then**: Validation error is shown

### TC-19: Create Reminder
**Requirement**: FR-09
**Given**: User is authenticated
**When**: User creates reminder for 3:00 PM
**Then**: Reminder is created

### TC-20: Reminder Triggers Notification
**Requirement**: FR-09
**Given**: Reminder exists for current time
**When**: Scheduler runs
**Then**: Notification is created

### TC-21: List Notifications
**Requirement**: FR-10
**Given**: User has notifications
**When**: User opens notifications page
**Then**: Notifications are listed newest first

### TC-22: Mark Notification as Read
**Requirement**: FR-10
**Given**: Unread notification exists
**When**: User marks as read
**Then**: Notification readAt is set

### TC-23: Unread Count Badge
**Requirement**: FR-10
**Given**: User has 3 unread notifications
**When**: User views header
**Then**: Badge shows "3"

### TC-24: Dashboard Stats
**Requirement**: FR-11
**Given**: User has tasks
**When**: User views dashboard
**Then**: Stats show correct counts

### TC-25: Focus Time Calculation
**Requirement**: FR-11
**Given**: User has time blocks this week
**When**: User views dashboard
**Then**: Total focus time is calculated correctly

## 3. Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| Auth Service | 80% |
| Tasks Service | 80% |
| Time Blocks Service | 80% |
| Frontend Components | 60% |

## 4. Test Environment

### 4.1 Backend Tests
```bash
cd backend
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

### 4.2 Frontend Tests
```bash
cd frontend
npm run test        # Unit tests
npm run test:cov    # Coverage report
```

## 5. Acceptance Criteria Checklist

### Authentication
- [ ] User can register with valid data
- [ ] User cannot register with duplicate email
- [ ] User can login with correct credentials
- [ ] User receives error for wrong credentials
- [ ] Access token expires after 15 minutes
- [ ] Refresh token works correctly
- [ ] Logout invalidates tokens

### Tasks
- [ ] User can create task
- [ ] User can update task
- [ ] User can delete task
- [ ] User can only see own tasks
- [ ] Filter by status works
- [ ] Filter by priority works
- [ ] Search works
- [ ] Pagination works

### Time Blocks
- [ ] User can create time block
- [ ] Overlap is prevented
- [ ] startAt < endAt is enforced
- [ ] Calendar displays blocks correctly

### Reminders & Notifications
- [ ] User can create reminder
- [ ] Scheduler triggers reminders
- [ ] Notifications are created
- [ ] User can mark as read
- [ ] Unread count is accurate

### Dashboard
- [ ] Tasks due today is correct
- [ ] Overdue tasks is correct
- [ ] Completed this week is correct
- [ ] Focus time is calculated correctly
# Login studio verification — 2026-09-21

- Frontend production build and targeted ESLint pass.
- Tabbit browser checks at 320, 375, 414, 768 and 1440 px: no horizontal overflow. Desktop and mobile screenshots inspected.
- Empty submission shows associated email/password errors.
- Mocked delayed 401 response: elapsed loading indicator remains visible, fields disabled while pending, readable error and retry enabled afterward.
- Mocked successful login with a complete synthetic User fixture: circle overlay appears, route changes to `/app`, overlay clears within five seconds; no browser page errors. Test session removed afterward. This verifies UI orchestration, not live backend authentication or OAuth.
- Reduced-motion emulation: no WebGL canvas; hero transform is `none`.
- Asset and exact generation prompt: `docs/design-dna-auth.json` (`meta.login_asset`).

## Workspace studio — 2026-09-29

- Production frontend build and ESLint on changed TSX files pass.
- Browser with isolated synthetic user/API fixtures: light/dark toggle updates root theme; pause removes WebGL canvas; movement banner opens `/app/fitness`.
- Both themes checked at 320, 375, 414 and 768 CSS px: no horizontal overflow. Desktop and mobile screenshots visually inspected.
- Reduced motion: no canvas and no image transform. Dashboard requests resolve before stagger reveal.
- Real account authentication and live backend data were not exercised. Mock values were used only in browser QA, never hardcoded in production.
- Built-in ImageGen asset `frontend/public/dashboard/studio-day.png`; complete prompt and theme profile in `docs/design-dna-workspace.json`.

## Dashboard banner fit — 2026-09-29

- Regenerated matching day/night 2172x724 images; original prompts in design-dna-workspace.json.
- Production frontend build and targeted DashboardStudio ESLint pass.
- Synthetic browser fixture: metric row bottom at 794/864, 794/900, 714/768, 666/720, 562/600 and 781/900 viewport pixels for widths 1920, 1440, 1366, 1280, 1024 and 768 respectively. No horizontal overflow.
- Light 1366x768 and dark 1024x600 screenshots inspected. Both hero action buttons remain within the hero at 1024x600.
- Mobile 375x812: no horizontal overflow; normal vertical scrolling retained for readable content.
- UI layout checks only; no live backend authentication or data changes.

## Task cards and editing — 2026-09-29

- Replace strike-through with a readable title, completion check and brief success pulse. Reopen uses the same toggle; failed requests leave the previous status intact. Reduced motion disables decorative transitions.
- Drag the card surface vertically with a mouse; hold on touch. Space and arrow keys support keyboard reordering. Buttons and menus do not initiate drag. Existing per-user local task-order persistence remains unchanged.
- Select popovers now render above dialog overlays. Description spans the form width. Small-screen action buttons wrap and date/time controls stack.
- New optional `cardColor` palette: AUTO, CYAN, VIOLET, AMBER, ROSE, GREEN. AUTO follows priority; explicit colors affect card background/edge, not text. API stores the color on Task.
- Release prerequisite: apply `backend/prisma/migrations/20260929010000_task_card_color/migration.sql` with the normal Prisma migration deployment before serving the new backend/frontend. No production database migration was run in this task.
- Workspace validation: frontend/backend builds and targeted frontend lint passed; two backend suites / 16 tests passed. Release checkout separately validates the palette suite against main.
- Tabbit synthetic API fixture: form selectors and color saved correctly, unchanged dates retain their instants; completion/reopen succeeds; delayed 500 keeps old status, reports error and enables retry; mouse and keyboard reorder verified; color/order survive reload of the fixture.
- Light/dark list checked at 320, 375, 414, 768px. Found and fixed 320px action overflow. Modal textarea width equals form width at all four sizes; no modal horizontal overflow. Desktop dark cards and light/mobile form visually inspected. No live account or database persistence test.
