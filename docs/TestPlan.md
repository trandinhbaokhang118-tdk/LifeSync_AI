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
## Calendar regression verification — 2026-09-29

- Backend: `node node_modules/jest/bin/jest.js --runInBand tasks time-blocks planning` — 6 suites / 38 tests passed. Covers task vs fixed-block and task vs task rejection, ownership-scoped overlap query, self exclusion, partial time updates, adjacent bounds, public-source missing config, invalid ranges, pagination, exclusive all-day dates and sanitized provider failure.
- Frontend and backend production builds passed. Targeted ESLint passed for CalendarBoard, ScheduleEditor, TaskCard, Planner, calendar-dates and calendar-sources.service.
- Tabbit browser verification used a local component harness with mocked API responses (no production task writes): edit conflict disabled Save; adjacent time allowed Save; drag to empty day persisted; drop onto another task opened the occupied-day editor; changing the time updated the Calendar view. Priority badge stayed inside a 162px task card.
- Calendar agenda checked at 320, 375, 414, 768 and 1440px: no document horizontal overflow, all seven date headings visible with explicit foreground color. Lunar sanity checks: 2026-02-17 => 1/1; 2026-09-25 => 15/8; 2026-09-29 => 19/8.
- Google live API was not tested: deployment credentials/calendar ID are required. Browser missing-configuration state and backend mocked provider paths were tested. Concurrent requests from multiple clients are not covered by these unit/UI checks.
- Release verification: isolated checkout based on LifeSync_AI/main (71a9716), with only the calendar changes and existing manual planner. Generated Prisma Client from the remote schema; frontend/backend builds, targeted ESLint and all 21 task/time-block tests passed. No database migration added.

## Calendar integrations verification — 2026-09-29

- Backend: `node node_modules/jest/bin/jest.js --runInBand calendar-integrations tasks time-blocks` — 31 tests passed. Google OAuth state ownership/replay, encrypted verifier/token storage, provider errors, strict overlap boundaries, disconnect cleanup, weather configuration/DTO validation and task reminder synchronization covered.
- Native scheduling logic: Node 22 `node --experimental-strip-types --experimental-test-module-mocks --test frontend/tests/task-reminders.test.mjs` — 4 tests passed with Capacitor mocks (reschedule, completion/deletion cancellation, unrelated reminder preservation, capacity, stale account and permissions). These are not real-device delivery tests.
- Frontend/backend builds and targeted ESLint passed. Prisma schema diff was checked against the previous schema; generated changes match the additive migration. Migration has not been applied to a real database in this task.
- Tabbit local browser harness with mocked APIs: city selection/hourly forecast, Google busy conflict blocks save, disconnect clears busy entries, upstream failure blocks schedule save, OAuth callback executes once and removes code/state from URL. No runtime JS errors; no horizontal document overflow at 320/375/414/768/1440px.
- Live Google consent/token refresh and paid Open-Meteo calls remain unverified until deployment credentials exist. Physical Android/iOS background notifications remain unverified.

## Manual planner date targeting — 2026-09-29

- Date-only pointer collision detection replaces nearest-centre targeting; each drop zone carries its own local date, independent of task IDs and column indexes.
- Moves preserve local start hour and duration. Past calendar dates and elapsed start times today show a modal without issuing a mutation. Manual planner schedule editor also blocks past start times at submit.
- Added month overview with the actual 28–31 day count, one priority-colored dot per task, month navigation and click-through to the selected week. Planner card grip decoration removed; surface remains draggable.
- `node frontend/scripts/test-planner-scheduling.cjs` passed under Asia/Ho_Chi_Minh and America/Los_Angeles; validates Sep 29 targeting, hour/duration, month boundary, yesterday and elapsed same-day rejection.
- Tabbit mocked API and clock: drag from Sep 30 to the right edge of Sep 29 saved Sep 29 15:00 local; subsequent drop on Sep 28 showed the invalid-date dialog with no second mutation. Occupied-day editor rejected a past start and disabled Save.
- Month Sep showed 30 days and exactly three priority dots on Sep 30 after moving the fourth task away; October showed 31 days. Light/dark at 320, 375, 414, 768px had no document horizontal overflow. Desktop overview and invalid-date modal visually inspected.
- Targeted ESLint passed. No production task writes or deployment in this verification.

## Planner feedback and simultaneous tasks — 2026-09-29

- Drag saves optimistically update cached task lists immediately and show a saving indicator. Failed requests restore the moved task; successful saves refresh calendar/dashboard data in the background. The drop-overlay return animation is disabled.
- A populated day alone no longer requires a form; actual overlaps do. Task overlaps require an explicit checkbox; changing dates or conflicting tasks clears confirmation. Fixed-block conflicts remain blocked. Update DTO validates optional boolean `allowTaskOverlap`; service strips it before Prisma and only bypasses task conflicts after ownership/fixed-block checks. No database migration needed for this request flag.
- Planner card priority uses neutral text/surface and a muted colored icon. Both start and end times are labeled, including the end date when spanning days.
- Calendar defaults to week timetable for overall time review. Planner explains its role in task breakdown and schedule arrangement and links to Calendar.
- Frontend/backend builds, targeted lint and 19 backend tests passed. Explicit true/false overlap and fixed-block protection tested.
- Tabbit synthetic delayed API: card reached target day before response; 500 response restored original day. Same-time drop disabled Save until checkbox confirmation; changing end time cleared consent; confirmed PATCH carried `allowTaskOverlap: true`. UI fixtures only, no production changes.
- Responsive task cards checked at 320/375/414/768px without document overflow; light/dark visuals inspected. Each of four cards had two time elements.
- Follow-up Calendar fixture check: default week timetable rendered all seven date headers and hourly slots; sample task displayed 09:00–10:00 in Sep 30 column. Initial navigation assertion was retried with a fresh mock API fixture after test-session cleanup; no production data used.

## Shared notification contrast

- Custom toast title and description use matching semantic foreground tokens; native success/error/loading toasts use the same surface and foreground. Removed conflicting success background. Close button has an accessible name.
- Release verification: all custom toast variants and native loading inspected in both themes; info foreground/background measured as #132c38/#fafdfe (light) and #edf7f8/#10232e (dark). At 375px the toast stayed between x=16 and x=344 and the close control worked.

## Header notification popup (2026-09-29)
- Frontend build and targeted ESLint: passed.
- Browser checks with synthetic API fixtures: bell opens popup without leaving the current route; All/Unread tabs; mark one/all read updates the badge; pagination loads older messages; failed mutation keeps unread state and displays an error; Escape closes popup.
- Visual checks: desktop dark theme and mobile light theme (375 px), popup stays inside viewport; theme toggle and user avatar both measure 44 x 44 px; notification sidebar link is absent.


## Pro 1,000 VND monthly plan (2026-09-30)

- Run backend unit suites: subscription-access, payments.service, time-blocks-pro, ai-chat-pro, fitness.service and tasks-calendar.
- Free: five blocks per scheduled Vietnam calendar day; the sixth creation or a move into a full day fails before writing. Existing same-day edits remain possible after downgrade. Per-user SQL row locking serializes quota checks and writes across instances.
- Current Pro/Plus: unlimited time blocks, 40 recent chat messages and up to 100 tasks plus the next seven days of time blocks in AI context. External AI availability remains dependent on provider configuration.
- Pro manual Fitness entry saves authenticated-user exercise records; Free/expired plans cannot write workouts and Pro cannot attach a Plus-only GPS route. Existing history remains readable.
- SePay checkout persists and signs 1,000 VND for a new Pro order. Existing orders retain their recorded amount; webhook authentication and idempotency remain required. Pro Stripe checkout is disabled to avoid charging a previous configured Stripe price.
- Browser fixture checks: 1,000 VND price, no unsupported yearly toggle, pending verification followed by success refreshes access, Pro workout form saves and refreshes the journal. These checks use mocked API responses, not a real bank transfer.
- Deployment must apply migration 20260930010000_pro_1k. It updates the existing Pro catalog once, without rewriting payment orders or active subscription periods. Startup seeds missing tiers without overwriting admin catalog edits.
- Catalog now describes implemented Pro benefits; it does not promise priority support without an operational support integration.


## SePay overpayment regression (2026-09-30)

- An authenticated inbound transfer of 2,000 VND matching a 1,000 VND order activates the purchased plan once. Both bank webhook and payment-gateway IPN accept sufficient payment; the gateway order total must still match the original order.
- Persist receivedAmountVND alongside the original amountVND for reconciliation. Overpayment does not purchase additional periods automatically and this change does not issue refunds.
- Underpayments, wrong receiving accounts, unauthenticated callbacks and malformed amounts remain rejected. Replayed paid transactions must not extend the subscription twice.
- Apply migration 20260930020000_payment_received_amount before starting the updated backend. A previously rejected transaction requires an authenticated callback replay from SePay after deployment; clicking Verify only reads the persisted payment status and does not fetch bank transactions. Do not manually activate access from a screenshot or client-supplied amount.


## AI chat task and project context (2026-09-30)

Chat now retrieves user-owned tasks and planning projects, including dates, status, priority, plan details and persisted task progress. Queries can search older tasks and paginate beyond the initial 30 records. Browser timezone accompanies each message. Existing Free/Pro conversation history limits remain.

Creation and updates execute through TasksService with DTO validation, project ownership and existing calendar conflict checks. Success replies and cache refreshes are based on completed writes. Chat does not delete tasks or create/change projects. Missing required times should result in a clarification. Malformed model JSON cannot trigger writes.

Deployment requires the additive `20260920150000_planning_projects` migration and Prisma client regeneration. This reuses the existing local planning model; project lookup only finds projects actually persisted in that database. No project-management UI is introduced by this change.

Regression checks: `npm test -- --runInBand ai-chat tasks` and backend/frontend builds. Provider responses are mocked in automated tests; these tests do not establish live model accuracy.

Manual checks on a test account:
- Ask about a task older than the initial context and about tasks in a named project.
- Ask for today's tasks and project completion counts; compare with stored data.
- Send “Tạo task viết báo cáo ngày mai 9h đến 10h”; verify exactly one saved task and refreshed list.
- Send “Đổi task đó sang 14h đến 15h”; verify the same task changes.
- Request a task without times; verify clarification and no new row.
- Use duplicate task names, a busy calendar slot, or another user's project ID; verify no unintended writes.
