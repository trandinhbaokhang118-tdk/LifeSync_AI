# 📱 Manual Testing Guide - LifeSync AI

**Comprehensive manual testing across all platforms**

---

## 🎯 **Testing Overview**

This guide covers:
- ✅ Web (Desktop browsers)
- ✅ Web (Mobile browsers)
- ✅ Android app (Capacitor)
- ✅ All features and user flows

**Time required:** ~2 hours for complete testing

---

## 🚀 **Pre-Testing Setup**

### 1. Start the application
```bash
# Start Docker & MySQL
start-mysql-docker.bat

# Start backend & frontend
start-app.bat

# Or manually:
# Terminal 1: cd backend && npm run start:dev
# Terminal 2: cd frontend && npm run dev
```

### 2. Verify services running
- ✅ Backend: http://localhost:3000/health
- ✅ Frontend: http://localhost:5173
- ✅ Database: docker ps (should show lifesync_ai_mysql)

### 3. Create test accounts
```bash
# Create admin (if not exists)
cd backend
npm run create-admin

# Use these credentials:
Admin:
- Email: admin@lifesyncai.com
- Password: (your chosen password)

User (create via Register):
- Email: user@test.com  
- Password: Test123!@#
```

---

## 📋 **TEST MATRIX**

### ✅ = Pass | ❌ = Fail | ⚠️ = Issue | ⬜ = Not Tested

---

## 🖥️ **PART 1: WEB DESKTOP TESTING**

### Test Environment
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)

---

### 1.1 Authentication Flow

#### Register Page (/register)
- [ ] ✅ Page loads without errors
- [ ] ✅ Form validation works
  - [ ] Empty fields show errors
  - [ ] Invalid email shows error
  - [ ] Weak password shows error
  - [ ] Password mismatch shows error
- [ ] ✅ Register button disabled when invalid
- [ ] ✅ Success registration redirects to login
- [ ] ✅ "Already have account" link works
- [ ] ✅ Dark/Light theme toggle works

**Test Data:**
```
Name: Test User
Email: user@test.com
Password: Test123!@#
Confirm: Test123!@#
```

#### Login Page (/login)
- [ ] ✅ Page loads without errors
- [ ] ✅ Form validation works
- [ ] ✅ Wrong credentials show error
- [ ] ✅ Correct credentials login successfully
- [ ] ✅ Redirects to dashboard after login
- [ ] ✅ "Remember me" checkbox present
- [ ] ✅ "Forgot password" link present
- [ ] ✅ "Create account" link works

**Test Data:**
```
Email: user@test.com
Password: Test123!@#
```

---

### 1.2 Dashboard (/dashboard)

#### Page Load
- [ ] ✅ Dashboard loads quickly (< 2s)
- [ ] ✅ Stats cards display correctly
  - [ ] Total tasks count
  - [ ] Completed tasks count
  - [ ] Pending tasks count
  - [ ] Focus time count
- [ ] ✅ Charts render without errors
  - [ ] Task status chart
  - [ ] Activity chart
  - [ ] Productivity chart
- [ ] ✅ Recent tasks list shows
- [ ] ✅ Quick actions work
  - [ ] "Add Task" button
  - [ ] "Start Focus" button

#### Interactions
- [ ] ✅ Click on stats cards navigates correctly
- [ ] ✅ Hover effects work
- [ ] ✅ Loading states display properly
- [ ] ✅ Empty states show when no data
- [ ] ✅ Refresh data works

---

### 1.3 Tasks Page (/tasks)

#### Task List
- [ ] ✅ Page loads all tasks
- [ ] ✅ Tasks display in correct format
  - [ ] Title visible
  - [ ] Description truncated
  - [ ] Priority badge shows
  - [ ] Status badge shows
  - [ ] Due date shows
- [ ] ✅ Empty state shows when no tasks

#### Create Task
- [ ] ✅ "Add Task" button opens modal
- [ ] ✅ Form fields present:
  - [ ] Title (required)
  - [ ] Description (optional)
  - [ ] Priority (dropdown)
  - [ ] Status (dropdown)
  - [ ] Category (dropdown/input)
  - [ ] Due date (date picker)
- [ ] ✅ Form validation works
- [ ] ✅ Submit creates task successfully
- [ ] ✅ Task appears in list immediately
- [ ] ✅ Toast notification shows

**Test Data:**
```
Title: Test Task 1
Description: This is a test task
Priority: High
Status: Todo
Category: Work
Due Date: Tomorrow
```

#### Edit Task
- [ ] ✅ Click task opens detail/edit
- [ ] ✅ All fields pre-filled
- [ ] ✅ Edit form works
- [ ] ✅ Save updates task
- [ ] ✅ Changes reflect immediately
- [ ] ✅ Cancel button works

#### Delete Task
- [ ] ✅ Delete button shows
- [ ] ✅ Confirmation dialog appears
- [ ] ✅ Cancel works
- [ ] ✅ Confirm deletes task
- [ ] ✅ Task removed from list
- [ ] ✅ Toast notification shows

#### Filters & Search
- [ ] ✅ Filter by status works
  - [ ] All
  - [ ] Todo
  - [ ] In Progress
  - [ ] Completed
- [ ] ✅ Filter by priority works
  - [ ] All
  - [ ] Low
  - [ ] Medium
  - [ ] High
- [ ] ✅ Search by title works
- [ ] ✅ Multiple filters combine correctly
- [ ] ✅ Clear filters button works

#### Drag & Drop
- [ ] ✅ Tasks are draggable
- [ ] ✅ Drop zones highlight
- [ ] ✅ Reorder tasks works
- [ ] ✅ Status changes when dropped
- [ ] ✅ Smooth animations
- [ ] ✅ Changes persist after refresh

---

### 1.4 Calendar Page (/calendar)

#### Calendar Views
- [ ] ✅ Month view loads
- [ ] ✅ Week view works
- [ ] ✅ Day view works
- [ ] ✅ Navigation buttons work
  - [ ] Previous period
  - [ ] Today
  - [ ] Next period
- [ ] ✅ Date picker works

#### Events Display
- [ ] ✅ Tasks show on calendar
- [ ] ✅ Time blocks show correctly
- [ ] ✅ Color coding works
- [ ] ✅ Hover shows details
- [ ] ✅ Click opens event

#### Create Event
- [ ] ✅ Click date/time opens form
- [ ] ✅ Drag to create time block
- [ ] ✅ All fields work
- [ ] ✅ Save creates event
- [ ] ✅ Event appears immediately

#### Edit/Delete Event
- [ ] ✅ Click event opens edit
- [ ] ✅ Resize event works
- [ ] ✅ Drag to move works
- [ ] ✅ Delete works with confirmation

---

### 1.5 Focus Mode (/focus)

#### Timer Setup
- [ ] ✅ Page loads correctly
- [ ] ✅ Default 25min shows
- [ ] ✅ Task selection works
- [ ] ✅ Timer displays clearly
- [ ] ✅ Settings button works

#### Timer Controls
- [ ] ✅ Start button works
- [ ] ✅ Timer counts down
- [ ] ✅ Pause button works
- [ ] ✅ Resume works
- [ ] ✅ Reset works
- [ ] ✅ Skip button works

#### Timer Completion
- [ ] ✅ Notification shows at 0:00
- [ ] ✅ Sound plays (if enabled)
- [ ] ✅ Auto-start break (if enabled)
- [ ] ✅ Stats update
- [ ] ✅ Task marked completed

#### Settings
- [ ] ✅ Work duration adjustable
- [ ] ✅ Break duration adjustable
- [ ] ✅ Long break settings
- [ ] ✅ Sound toggle works
- [ ] ✅ Auto-start toggle works
- [ ] ✅ Save settings persists

---

### 1.6 AI Chatbot

#### Chat Interface
- [ ] ✅ Chatbot button visible
- [ ] ✅ Click opens chat panel
- [ ] ✅ Chat history shows
- [ ] ✅ Input field works
- [ ] ✅ Send button works
- [ ] ✅ Enter key sends message

#### AI Responses
- [ ] ✅ Message sends successfully
- [ ] ✅ Loading indicator shows
- [ ] ✅ AI response appears
- [ ] ✅ Response is relevant
- [ ] ✅ Markdown formatting works
- [ ] ✅ Error handling works

**Test Messages:**
```
1. "Hello, what can you help me with?"
2. "What tasks do I have today?"
3. "Create a task for tomorrow"
4. "Show my productivity stats"
```

#### Chat Features
- [ ] ✅ Scroll to latest message
- [ ] ✅ Timestamps show
- [ ] ✅ Clear chat works
- [ ] ✅ Close button works
- [ ] ✅ Minimize/maximize works

---

### 1.7 Admin Panel (/admin) - ADMIN ROLE ONLY

#### Dashboard
- [ ] ✅ Only accessible with ADMIN role
- [ ] ✅ System stats display
  - [ ] Total users
  - [ ] Active users
  - [ ] Total tasks
  - [ ] System health
- [ ] ✅ Charts render correctly
- [ ] ✅ Activity logs show

#### User Management (/admin/users)
- [ ] ✅ User list displays
- [ ] ✅ Search users works
- [ ] ✅ Filter by role works
- [ ] ✅ Pagination works
- [ ] ✅ User details clickable

#### Edit User
- [ ] ✅ Edit button opens modal
- [ ] ✅ Can change user role
  - [ ] USER
  - [ ] MODERATOR (NEW)
  - [ ] ADMIN
- [ ] ✅ Can activate/deactivate user
- [ ] ✅ Save updates user
- [ ] ✅ Changes reflect immediately

#### Delete User
- [ ] ✅ Delete button shows
- [ ] ✅ Confirmation required
- [ ] ✅ Cannot delete self
- [ ] ✅ User removed successfully

#### Activity Logs (/admin/activity)
- [ ] ✅ Logs display correctly
- [ ] ✅ Filter by user works
- [ ] ✅ Filter by action works
- [ ] ✅ Filter by date works
- [ ] ✅ Export logs works

#### Admin Theme
- [ ] ✅ Dark glass theme applied
- [ ] ✅ Text contrast is clear (WCAG AA)
- [ ] ✅ Buttons visible
- [ ] ✅ Forms readable
- [ ] ✅ No white-on-white text

---

### 1.8 UI/UX General

#### Navigation
- [ ] ✅ Sidebar toggles
- [ ] ✅ All menu items work
- [ ] ✅ Active route highlighted
- [ ] ✅ Breadcrumbs show (if present)
- [ ] ✅ Back button works

#### Header
- [ ] ✅ Logo present
- [ ] ✅ Search works (if present)
- [ ] ✅ Notifications icon works
- [ ] ✅ User menu works
  - [ ] Profile
  - [ ] Settings
  - [ ] Logout
- [ ] ✅ Theme toggle works

#### Command Palette (Ctrl+K / Cmd+K)
- [ ] ✅ Keyboard shortcut opens
- [ ] ✅ Search works
- [ ] ✅ Navigation works
- [ ] ✅ Actions work
- [ ] ✅ ESC closes

#### Notifications
- [ ] ✅ Notification icon shows count
- [ ] ✅ Click opens panel
- [ ] ✅ List displays correctly
- [ ] ✅ Mark as read works
- [ ] ✅ Clear all works
- [ ] ✅ Real-time updates (WebSocket)

#### Theme Toggle
- [ ] ✅ Light theme works
- [ ] ✅ Dark theme works
- [ ] ✅ Smooth transition
- [ ] ✅ Persists after refresh
- [ ] ✅ All components styled correctly
- [ ] ✅ Contrast ratios good (WCAG AA)

#### Responsive Design (Desktop)
- [ ] ✅ 1920x1080 (Full HD)
- [ ] ✅ 1366x768 (Laptop)
- [ ] ✅ 1280x720 (Small laptop)
- [ ] ✅ Sidebar collapses appropriately
- [ ] ✅ No horizontal scroll
- [ ] ✅ Images scale correctly

---

## 📱 **PART 2: WEB MOBILE TESTING**

### Test Environment
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile

### Test Sizes
- [ ] iPhone 12/13 (390x844)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] iPad (768x1024)

---

### 2.1 Mobile Layout

#### General
- [ ] ✅ All pages responsive
- [ ] ✅ No horizontal scroll
- [ ] ✅ Text readable (min 16px body)
- [ ] ✅ Buttons tap-friendly (min 44x44px)
- [ ] ✅ Forms usable
- [ ] ✅ Modals full screen or appropriate
- [ ] ✅ Navigation adapted (hamburger menu)

#### Sidebar
- [ ] ✅ Becomes drawer/slide-in
- [ ] ✅ Overlay works
- [ ] ✅ Close button visible
- [ ] ✅ Swipe to close works

#### Touch Interactions
- [ ] ✅ Tap works everywhere
- [ ] ✅ Swipe gestures work
- [ ] ✅ Pull to refresh (if implemented)
- [ ] ✅ No accidental taps
- [ ] ✅ Touch feedback visible

#### Forms on Mobile
- [ ] ✅ Keyboard appears correctly
- [ ] ✅ Input types correct (email, tel, etc.)
- [ ] ✅ Autocomplete works
- [ ] ✅ Submit on Enter works
- [ ] ✅ Validation clear

---

## 🤖 **PART 3: ANDROID APP TESTING**

### Build & Install

#### Build Process
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

- [ ] ✅ Build completes without errors
- [ ] ✅ No Gradle errors
- [ ] ✅ APK generated successfully
- [ ] ✅ APK installs on device/emulator
- [ ] ✅ App icon shows correctly

---

### 3.1 App Launch

- [ ] ✅ Splash screen shows
- [ ] ✅ Correct app name
- [ ] ✅ Correct logo
- [ ] ✅ Smooth transition to app
- [ ] ✅ No crashes on launch

---

### 3.2 Native Features

#### Permissions
- [ ] ✅ App requests necessary permissions
- [ ] ✅ Works if permissions denied
- [ ] ✅ Can enable permissions later

#### Notifications
- [ ] ✅ Push notifications work (if implemented)
- [ ] ✅ Local notifications work
- [ ] ✅ Notification tap opens app
- [ ] ✅ Notification actions work

#### Status Bar
- [ ] ✅ Status bar styled correctly
- [ ] ✅ Status bar color matches theme
- [ ] ✅ Status bar icons visible

#### Hardware
- [ ] ✅ Back button works
- [ ] ✅ Home button works
- [ ] ✅ App switcher works
- [ ] ✅ Vibration works (if implemented)

---

### 3.3 Performance

- [ ] ✅ App launches quickly (< 3s)
- [ ] ✅ Navigation smooth (60fps)
- [ ] ✅ Scrolling smooth
- [ ] ✅ Animations smooth
- [ ] ✅ No lag on interactions
- [ ] ✅ Battery usage reasonable
- [ ] ✅ Memory usage reasonable

---

### 3.4 Offline Functionality

- [ ] ✅ App opens offline
- [ ] ✅ Cached data shows
- [ ] ✅ Offline message clear
- [ ] ✅ Syncs when online
- [ ] ✅ No crashes offline

---

### 3.5 Device Testing

#### Screen Sizes
- [ ] Small phone (< 5.5")
- [ ] Medium phone (5.5" - 6.5")
- [ ] Large phone (> 6.5")
- [ ] Tablet (7"+)

#### Android Versions
- [ ] Android 12+
- [ ] Android 11
- [ ] Android 10 (if target)

#### Orientations
- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Rotation smooth

---

## 🔒 **PART 4: SECURITY TESTING**

### Authentication
- [ ] ✅ Cannot access protected routes without login
- [ ] ✅ Token expiry works
- [ ] ✅ Token refresh works
- [ ] ✅ Logout clears session
- [ ] ✅ Multiple tabs sync

### Authorization
- [ ] ✅ USER cannot access ADMIN routes
- [ ] ✅ MODERATOR has correct permissions
- [ ] ✅ ADMIN has full access
- [ ] ✅ API returns 403 for unauthorized

### Input Validation
- [ ] ✅ SQL injection prevented
- [ ] ✅ XSS prevented
- [ ] ✅ CSRF protection
- [ ] ✅ File upload validated
- [ ] ✅ URL parameters validated

### Data Privacy
- [ ] ✅ Passwords not visible
- [ ] ✅ Tokens not in URL
- [ ] ✅ Sensitive data not in console
- [ ] ✅ HTTPS ready
- [ ] ✅ Secure cookies (production)

---

## ⚡ **PART 5: PERFORMANCE TESTING**

### Load Times
- [ ] ✅ Initial load < 3s
- [ ] ✅ Route changes < 500ms
- [ ] ✅ API calls < 200ms
- [ ] ✅ Images load progressively

### Bundle Size
- [ ] ✅ Main bundle < 500KB gzipped
- [ ] ✅ Code splitting implemented
- [ ] ✅ Lazy loading works

### Network
- [ ] ✅ Works on 3G
- [ ] ✅ Works on 4G
- [ ] ✅ Works on WiFi
- [ ] ✅ Offline handling

---

## ♿ **PART 6: ACCESSIBILITY TESTING**

### Keyboard Navigation
- [ ] ✅ Tab order logical
- [ ] ✅ Focus indicators visible
- [ ] ✅ Escape closes modals
- [ ] ✅ Enter submits forms
- [ ] ✅ Arrow keys navigate lists

### Screen Reader
- [ ] ✅ Images have alt text
- [ ] ✅ Buttons have labels
- [ ] ✅ Forms have labels
- [ ] ✅ ARIA attributes correct
- [ ] ✅ Landmarks present

### Visual
- [ ] ✅ Contrast ratios WCAG AA
- [ ] ✅ Text resizable to 200%
- [ ] ✅ No color-only indicators
- [ ] ✅ Focus indicators clear

---

## 🐛 **BUG REPORT TEMPLATE**

When you find a bug, document it:

```
**Bug Title:** [Short description]

**Severity:** Critical | High | Medium | Low

**Platform:** Web Desktop | Web Mobile | Android | iOS

**Browser/Device:** [Chrome 120 / Samsung Galaxy S21]

**Steps to Reproduce:**
1. Go to [page]
2. Click on [element]
3. Enter [data]
4. Click [button]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste any errors]

**Additional Info:**
[Any other relevant info]
```

---

## ✅ **TESTING COMPLETION**

### Summary
- **Total Tests:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Skipped:** [Number]

### Critical Issues
- [ ] List any critical bugs here

### High Priority Issues
- [ ] List high priority issues

### Notes
- [Any additional observations]

---

## 📊 **FINAL SIGN-OFF**

- [ ] ✅ All critical features tested
- [ ] ✅ No critical bugs remain
- [ ] ✅ Performance acceptable
- [ ] ✅ Security verified
- [ ] ✅ Accessibility checked
- [ ] ✅ Documentation updated

**Tested By:** [Your Name]  
**Date:** [Date]  
**Version:** 1.0.0  
**Status:** ✅ APPROVED FOR PRODUCTION

---

**Good luck with testing! 🚀**
