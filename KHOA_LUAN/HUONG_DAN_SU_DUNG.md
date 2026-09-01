# HƯỚNG DẪN SỬ DỤNG - LIFESYNC AI

**Phiên bản:** 1.0.0  
**Cập nhật:** Tháng 6, 2026

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng ký & Đăng nhập](#2-đăng-ký--đăng-nhập)
3. [Dashboard](#3-dashboard)
4. [Quản lý công việc](#4-quản-lý-công-việc)
5. [Lịch & Time Blocking](#5-lịch--time-blocking)
6. [Focus Mode](#6-focus-mode)
7. [AI Chatbot](#7-ai-chatbot)
8. [Thông báo](#8-thông-báo)
9. [Cài đặt](#9-cài-đặt)
10. [Admin Panel](#10-admin-panel-admin-only)
11. [Tips & Tricks](#11-tips--tricks)

---

## 1. GIỚI THIỆU

### 1.1 LifeSync AI là gì?

LifeSync AI là ứng dụng quản lý công việc và sức khỏe toàn diện, giúp bạn:
- ✅ Tổ chức công việc hiệu quả
- ✅ Quản lý thời gian thông minh
- ✅ Tăng năng suất với Focus Mode
- ✅ Nhận hỗ trợ từ AI chatbot
- ✅ Theo dõi tiến độ và thống kê

### 1.2 Yêu cầu hệ thống

**Web (Desktop):**
- Trình duyệt: Chrome, Edge, Firefox (bản mới nhất)
- Kết nối Internet ổn định
- Độ phân giải tối thiểu: 1280x720

**Web (Mobile):**
- iOS 12+ (Safari)
- Android 8+ (Chrome)

**Android App:**
- Android 8.0+
- RAM tối thiểu: 2GB
- Dung lượng trống: 50MB

### 1.3 Truy cập ứng dụng

**Web:** https://lifesync.app (hoặc local: http://localhost:5173)  
**Android:** Tải APK từ Google Play hoặc website

---

## 2. ĐĂNG KÝ & ĐĂNG NHẬP

### 2.1 Đăng ký tài khoản mới

1. Truy cập trang đăng ký
2. Điền thông tin:
   - **Họ tên:** Tên đầy đủ của bạn
   - **Email:** Địa chỉ email hợp lệ
   - **Mật khẩu:** Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số
   - **Xác nhận mật khẩu:** Nhập lại mật khẩu
3. Nhấn **"Đăng ký"**
4. Kiểm tra email để xác nhận (nếu có)

**Lưu ý:**
- Email phải duy nhất, chưa được đăng ký
- Mật khẩu mạnh giúp bảo vệ tài khoản tốt hơn

### 2.2 Đăng nhập

1. Truy cập trang đăng nhập
2. Nhập email và mật khẩu
3. (Tùy chọn) Chọn "Ghi nhớ đăng nhập"
4. Nhấn **"Đăng nhập"**

**Quên mật khẩu?**
- Nhấn "Quên mật khẩu"
- Nhập email đã đăng ký
- Làm theo hướng dẫn trong email

### 2.3 Đăng xuất

- Nhấn vào avatar (góc trên bên phải)
- Chọn **"Đăng xuất"**

---

## 3. DASHBOARD

### 3.1 Tổng quan Dashboard

Dashboard hiển thị:
- 📊 **Thống kê công việc:** Tổng số, hoàn thành, đang làm, chưa làm
- 📈 **Biểu đồ năng suất:** Theo ngày, tuần, tháng
- ✅ **Công việc gần đây:** Danh sách tasks mới nhất
- ⏰ **Sự kiện sắp tới:** Lịch trong ngày/tuần
- ⚡ **Quick Actions:** Thêm task, bắt đầu focus nhanh

### 3.2 Thống kê

**Cards thống kê:**
- **Total Tasks:** Tổng số công việc
- **Completed:** Đã hoàn thành (màu xanh)
- **In Progress:** Đang thực hiện (màu vàng)
- **Todo:** Chưa bắt đầu (màu xám)
- **Focus Time:** Tổng thời gian tập trung (phút)

**Biểu đồ:**
- **Task Status Chart:** Phân bố theo trạng thái (Pie chart)
- **Activity Chart:** Hoạt động theo thời gian (Line chart)
- **Productivity:** Năng suất 7 ngày gần nhất (Bar chart)

### 3.3 Quick Actions

- **Thêm Task:** Mở form tạo task nhanh
- **Bắt đầu Focus:** Vào Focus Mode ngay
- **Xem lịch:** Chuyển sang Calendar
- **AI Assistant:** Mở chatbot

---

## 4. QUẢN LÝ CÔNG VIỆC

### 4.1 Xem danh sách Tasks

**Truy cập:** Menu > Tasks

**Hiển thị:**
- Danh sách tasks dạng cards hoặc list
- Thông tin: Title, Description, Priority, Status, Due date
- Color-coded theo priority (Red=High, Yellow=Medium, Green=Low)

### 4.2 Tạo Task mới

**Cách 1: Từ Dashboard**
1. Nhấn **"+ Add Task"** (Quick Action)
2. Điền form
3. Nhấn **"Create"**

**Cách 2: Từ Tasks page**
1. Nhấn nút **"+ New Task"** (góc trên)
2. Điền form
3. Nhấn **"Create"**

**Cách 3: Command Palette**
1. Nhấn `Ctrl+K` (Windows) hoặc `Cmd+K` (Mac)
2. Gõ "create task"
3. Enter

**Form tạo Task:**
- **Title*** (Bắt buộc): Tên công việc
- **Description**: Mô tả chi tiết
- **Priority**: Low / Medium / High
- **Status**: Todo / In Progress / Completed
- **Category**: Chọn hoặc tạo mới
- **Due Date**: Ngày hết hạn
- **Tags**: Thêm tags (phân tách bằng dấu phẩy)

### 4.3 Chỉnh sửa Task

**Cách 1: Click trực tiếp**
1. Click vào task cần sửa
2. Modal chi tiết hiện ra
3. Nhấn **"Edit"**
4. Chỉnh sửa thông tin
5. Nhấn **"Save"**

**Cách 2: Hover menu**
1. Hover vào task
2. Nhấn icon **"Edit"** (icon bút)
3. Chỉnh sửa
4. Nhấn **"Save"**

### 4.4 Xóa Task

1. Click vào task
2. Nhấn **"Delete"**
3. Xác nhận xóa trong dialog
4. Task sẽ bị xóa vĩnh viễn

**Lưu ý:** Không thể hoàn tác sau khi xóa!

### 4.5 Thay đổi trạng thái Task

**Cách 1: Drag & Drop**
1. Kéo task sang cột khác (Todo → In Progress → Completed)
2. Thả để cập nhật trạng thái

**Cách 2: Dropdown**
1. Click vào task
2. Chọn Status mới từ dropdown
3. Nhấn **"Save"**

**Cách 3: Quick action**
1. Hover vào task
2. Nhấn icon status
3. Chọn trạng thái mới

### 4.6 Lọc và Tìm kiếm

**Filters:**
- **Status:** All / Todo / In Progress / Completed
- **Priority:** All / Low / Medium / High
- **Category:** Chọn category cụ thể
- **Date:** Today / This Week / This Month / Custom

**Search:**
- Gõ từ khóa vào ô search
- Tìm kiếm trong Title và Description
- Real-time search (kết quả hiện ngay)

**Sort:**
- Due Date (sớm nhất trước)
- Priority (cao nhất trước)
- Created Date (mới nhất trước)
- Alphabetical (A-Z)

### 4.7 Drag & Drop

**Sắp xếp lại:**
1. Kéo task lên/xuống để đổi vị trí
2. Thả để lưu thứ tự mới

**Thay đổi trạng thái:**
1. Kéo task sang cột Status khác
2. Thả để cập nhật

**Lưu ý:** Changes được lưu tự động

---

## 5. LỊCH & TIME BLOCKING

### 5.1 Xem Lịch

**Truy cập:** Menu > Calendar

**Views:**
- **Month:** Xem cả tháng
- **Week:** Xem tuần (7 ngày)
- **Day:** Xem chi tiết 1 ngày

**Navigation:**
- **<:** Quay lại period trước
- **Today:** Về hôm nay
- **>:** Tiến đến period sau

### 5.2 Tạo Event/Time Block

**Cách 1: Click vào ngày/giờ**
1. Click vào ô thời gian trống
2. Form tạo event hiện ra
3. Điền thông tin:
   - **Title:** Tên sự kiện
   - **Start Time:** Thời gian bắt đầu
   - **End Time:** Thời gian kết thúc
   - **Task:** Liên kết với task (optional)
   - **Description:** Mô tả
4. Nhấn **"Create"**

**Cách 2: Drag to create (Week/Day view)**
1. Click và kéo trên lịch
2. Thả để chọn khoảng thời gian
3. Form tạo event hiện ra
4. Điền thông tin
5. Nhấn **"Create"**

### 5.3 Chỉnh sửa Event

**Resize:**
- Kéo đầu dưới của event để thay đổi thời gian kết thúc

**Move:**
- Kéo event sang ngày/giờ khác để di chuyển

**Edit Details:**
1. Click vào event
2. Modal chi tiết hiện ra
3. Nhấn **"Edit"**
4. Chỉnh sửa
5. Nhấn **"Save"**

### 5.4 Xóa Event

1. Click vào event
2. Nhấn **"Delete"**
3. Xác nhận

### 5.5 Time Blocking Tips

**Time Blocking là gì?**
Phương pháp phân bổ thời gian cụ thể cho từng công việc.

**Best Practices:**
- Block time cho deep work (2-4 giờ)
- Block time cho meetings
- Block time cho breaks
- Review lịch mỗi sáng
- Linh hoạt điều chỉnh khi cần

---

## 6. FOCUS MODE

### 6.1 Giới thiệu Focus Mode

Focus Mode giúp bạn tập trung làm việc với Pomodoro Technique:
- **25 phút** work
- **5 phút** break
- **15 phút** long break (sau 4 pomodoros)

### 6.2 Bắt đầu Focus Session

1. Truy cập Menu > Focus
2. Chọn task muốn focus (optional)
3. Nhấn **"Start Focus"**
4. Timer bắt đầu đếm ngược
5. Làm việc tập trung!

### 6.3 Điều khiển Timer

**Buttons:**
- **Start:** Bắt đầu đếm
- **Pause:** Tạm dừng
- **Resume:** Tiếp tục
- **Reset:** Đặt lại về 25:00
- **Skip:** Bỏ qua phiên hiện tại

### 6.4 Cài đặt Focus Mode

Nhấn **Settings** (icon gear):

**Work Duration:**
- Default: 25 phút
- Có thể điều chỉnh: 15-60 phút

**Break Duration:**
- Short break: 5 phút (default)
- Long break: 15 phút (default)
- Có thể điều chỉnh

**Notifications:**
- ✅ Sound: Bật/tắt âm thanh thông báo
- ✅ Auto-start: Tự động bắt đầu break/work

**Theme:**
- Màu sắc timer
- Background music (nếu có)

### 6.5 Thống kê Focus

**Hiển thị:**
- **Today:** Số phiên hôm nay, tổng phút
- **This Week:** Số phiên tuần này, tổng phút
- **This Month:** Số phiên tháng này, tổng phút
- **Chart:** Biểu đồ focus time theo ngày

**History:**
- Xem lịch sử các phiên focus
- Filter theo task, ngày

---

## 7. AI CHATBOT

### 7.1 Mở Chatbot

**Cách 1:** Nhấn icon chatbot (góc dưới bên phải)  
**Cách 2:** Command Palette > "Open AI Chat"

### 7.2 Gửi tin nhắn

1. Gõ câu hỏi/yêu cầu vào ô chat
2. Nhấn **Enter** hoặc nút **Send**
3. Đợi AI phản hồi (2-5 giây)

### 7.3 AI có thể giúp gì?

**Quản lý công việc:**
- "Tôi có tasks gì hôm nay?"
- "Tạo task 'Viết báo cáo' priority cao"
- "Hiển thị tasks chưa hoàn thành"
- "Sắp xếp tasks theo priority"

**Thống kê:**
- "Năng suất của tôi thế nào?"
- "Tôi đã hoàn thành bao nhiêu tasks tuần này?"
- "Show focus time của tôi"

**Lời khuyên:**
- "Tư vấn cách quản lý thời gian"
- "Làm sao để tăng năng suất?"
- "Kỹ thuật Pomodoro là gì?"

**Khác:**
- "Giải thích tính năng X"
- "Hướng dẫn sử dụng Y"
- "Shortcuts keyboard là gì?"

### 7.4 Tips sử dụng AI

✅ **DO:**
- Câu hỏi rõ ràng, cụ thể
- Cung cấp context nếu cần
- Hỏi follow-up nếu chưa rõ

❌ **DON'T:**
- Hỏi thông tin cá nhân nhạy cảm
- Spam nhiều câu hỏi liên tục
- Mong đợi AI làm mọi thứ

---

## 8. THÔNG BÁO

### 8.1 Xem thông báo

**Truy cập:** Nhấn icon 🔔 (góc trên bên phải)

**Loại thông báo:**
- 📅 Task deadline sắp tới
- ✅ Task được hoàn thành
- 👥 Được thêm vào team (future)
- 💬 Mention trong comment (future)
- ⚙️ Thay đổi hệ thống

### 8.2 Đánh dấu đã đọc

**Single:**
1. Click vào notification
2. Tự động đánh dấu đã đọc

**All:**
- Nhấn **"Mark all as read"**

### 8.3 Cài đặt thông báo

Settings > Notifications:
- ✅ Email notifications
- ✅ Push notifications (mobile)
- ✅ Task reminders
- ✅ Focus mode reminders

---

## 9. CÀI ĐẶT

### 9.1 Profile Settings

**Truy cập:** Avatar > Settings > Profile

**Chỉnh sửa:**
- Tên
- Email (cần xác nhận lại)
- Avatar
- Timezone

### 9.2 Account Settings

**Change Password:**
1. Settings > Account > Change Password
2. Nhập mật khẩu cũ
3. Nhập mật khẩu mới (2 lần)
4. Nhấn **"Update"**

**Two-Factor Authentication (2FA):**
- Enable 2FA để bảo mật tốt hơn
- Scan QR code với app authenticator
- Nhập mã xác nhận

**Delete Account:**
- Settings > Account > Delete Account
- Nhập password xác nhận
- **Lưu ý:** Không thể hoàn tác!

### 9.3 Appearance

**Theme:**
- Light mode
- Dark mode
- Auto (theo hệ thống)

**Colors:**
- Accent color
- Sidebar color (future)

**Font Size:**
- Small / Medium / Large

### 9.4 Preferences

**Language:**
- Tiếng Việt (sắp có)
- English

**Date Format:**
- DD/MM/YYYY
- MM/DD/YYYY

**Time Format:**
- 12-hour (AM/PM)
- 24-hour

**First Day of Week:**
- Monday
- Sunday

### 9.5 Integrations (Future)

- Google Calendar sync
- Slack notifications
- Email sync

---

## 10. ADMIN PANEL (ADMIN ONLY)

**Lưu ý:** Chỉ tài khoản có role ADMIN mới truy cập được.

### 10.1 Truy cập Admin Panel

Menu > Admin (icon gear)

### 10.2 Dashboard Admin

Hiển thị:
- Tổng số users
- Users active hôm nay
- Tổng tasks hệ thống
- Focus sessions hôm nay
- Charts & graphs

### 10.3 User Management

**Xem danh sách users:**
- List/Grid view
- Search by name/email
- Filter by role

**Edit User:**
1. Click vào user
2. Nhấn **"Edit"**
3. Thay đổi:
   - Name
   - Email
   - Role (USER / MODERATOR / ADMIN)
   - Active/Inactive status
4. Nhấn **"Save"**

**Delete User:**
1. Click vào user
2. Nhấn **"Delete"**
3. Xác nhận
4. User và data của họ bị xóa

**Bulk Actions:**
- Select multiple users
- Bulk delete
- Bulk role change

### 10.4 Activity Logs

**Xem logs:**
- All activities hệ thống
- Filter by user, action, date
- Export to CSV

**Log types:**
- LOGIN/LOGOUT
- TASK_CREATE/UPDATE/DELETE
- USER_CREATE/UPDATE/DELETE
- ADMIN_ACTION

### 10.5 System Settings

**General:**
- App name
- Logo
- Maintenance mode

**Email:**
- SMTP settings
- Email templates

**Security:**
- Max login attempts
- Session timeout
- Password policy

---

## 11. TIPS & TRICKS

### 11.1 Keyboard Shortcuts

**Global:**
- `Ctrl+K` / `Cmd+K`: Command Palette
- `Ctrl+/` / `Cmd+/`: Keyboard shortcuts help
- `Esc`: Đóng modal/dialog

**Navigation:**
- `Alt+D`: Goto Dashboard
- `Alt+T`: Goto Tasks
- `Alt+C`: Goto Calendar
- `Alt+F`: Goto Focus Mode

**Tasks:**
- `N`: New task (khi ở Tasks page)
- `E`: Edit task (khi hover)
- `Delete`: Delete task (khi hover)
- `Enter`: Open task details

**Focus Mode:**
- `Space`: Start/Pause timer
- `R`: Reset timer
- `S`: Skip session

### 11.2 Productivity Tips

**Quản lý tasks:**
1. ✅ Tạo tasks ngay khi nghĩ ra
2. ✅ Set priority hợp lý
3. ✅ Break down tasks lớn thành nhỏ
4. ✅ Review tasks mỗi sáng
5. ✅ Hoàn thành tasks quan trọng trước

**Time blocking:**
1. ✅ Block time vào buổi sáng
2. ✅ Block deep work 2-4 giờ
3. ✅ Để buffer time giữa các blocks
4. ✅ Review calendar mỗi tối

**Focus Mode:**
1. ✅ Dùng cho deep work
2. ✅ Tắt notifications khác
3. ✅ Prepare trước khi bắt đầu
4. ✅ Không skip breaks
5. ✅ Track focus time

### 11.3 Best Practices

**Daily routine:**
- Morning: Review calendar, plan tasks
- Work: Use focus mode, time blocking
- Evening: Review what done, plan tomorrow

**Weekly routine:**
- Monday: Set goals for week
- Wednesday: Mid-week review
- Friday: Week review, celebrate wins

**Data hygiene:**
- Archive completed tasks regularly
- Delete unused categories
- Clean up old notifications

### 11.4 Troubleshooting

**App không load:**
- Check internet connection
- Refresh page (F5)
- Clear cache
- Try incognito mode

**Không đăng nhập được:**
- Check email/password
- Reset password nếu quên
- Contact admin nếu bị khóa

**Tasks không sync:**
- Check internet
- Logout và login lại
- Contact support

**Báo lỗi:**
- Screenshot lỗi
- Note steps to reproduce
- Email: support@lifesync.app

---

## PHỤ LỤC

### Glossary (Thuật ngữ)

- **Task:** Công việc cần làm
- **Time Block:** Khung thời gian đã phân bổ
- **Focus Session:** Phiên tập trung (Pomodoro)
- **Priority:** Độ ưu tiên (Low/Medium/High)
- **Status:** Trạng thái (Todo/In Progress/Completed)
- **Category:** Phân loại công việc
- **Dashboard:** Trang tổng quan
- **Admin:** Quản trị viên

### Support

**Email:** support@lifesync.app  
**Website:** https://lifesync.app/help  
**Community:** https://community.lifesync.app

---

**Chúc bạn sử dụng LifeSync AI hiệu quả! 🚀**
