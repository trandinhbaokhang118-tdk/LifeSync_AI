# Hướng dẫn sử dụng Planner (Lập kế hoạch)

## Tổng quan

Planner là tính năng mạnh mẽ giúp bạn sắp xếp công việc theo thời gian bằng cách kéo thả (drag & drop). Bạn có thể xem và lên lịch công việc theo tuần, tháng hoặc năm.

## Truy cập

**URL:** `/planner`

**Từ Sidebar:** Click vào "Lập kế hoạch" (icon CalendarRange)

## Các chế độ xem

### 1. Xem theo Tuần (Week View)
- Hiển thị 7 ngày từ Thứ 2 đến Chủ nhật
- Mỗi ngày có không gian lớn để xem chi tiết công việc
- Phù hợp cho lập kế hoạch ngắn hạn

### 2. Xem theo Tháng (Month View)
- Hiển thị tất cả các ngày trong tháng
- Grid layout với nhiều cột
- Phù hợp cho tổng quan tháng

### 3. Xem theo Năm (Year View)
- Hiển thị 12 tháng trong năm
- Xem tổng quan dài hạn
- Phù hợp cho lập kế hoạch chiến lược

## Cách sử dụng

### Lên lịch công việc

1. **Xem danh sách công việc chưa lên lịch:**
   - Sidebar bên trái hiển thị tất cả công việc chưa có lịch
   - Số lượng hiển thị ở góc phải

2. **Kéo thả công việc:**
   - Click và giữ vào công việc (icon GripVertical)
   - Kéo đến ngày muốn lên lịch
   - Thả chuột để đặt công việc vào ngày đó
   - Công việc sẽ tự động được lên lịch lúc 9:00 AM

3. **Di chuyển công việc giữa các ngày:**
   - Kéo công việc từ ngày này sang ngày khác
   - Thời gian sẽ được cập nhật tự động

### Điều hướng

**Nút điều hướng:**
- `←` Quay lại (tuần/tháng/năm trước)
- `→` Tiến tới (tuần/tháng/năm sau)

**Chuyển đổi chế độ xem:**
- Click "Tuần", "Tháng", hoặc "Năm" ở góc trên bên phải

### Ẩn/Hiện danh sách công việc

**Nút toggle (góc dưới bên phải):**
- Icon Grid: Ẩn sidebar công việc chưa lên lịch
- Icon List: Hiện sidebar công việc chưa lên lịch

## Giao diện

### Task Card

Mỗi công việc hiển thị:
- **Icon GripVertical:** Điểm kéo thả
- **Tiêu đề:** Tên công việc
- **Mô tả:** Nội dung chi tiết (nếu có)
- **Priority badge:** Mức độ ưu tiên (LOW/MEDIUM/HIGH)
- **Thời gian:** Giờ bắt đầu (nếu đã lên lịch)
- **Border màu:** Trạng thái công việc
  - Xám: TODO
  - Xanh dương: IN_PROGRESS
  - Xanh lá: DONE

### Droppable Day

Mỗi ô ngày hiển thị:
- **Tên ngày:** T2, T3, ... (tuần/tháng) hoặc Tháng 1, 2, ... (năm)
- **Số ngày:** Ngày trong tháng
- **Số công việc:** Tổng công việc trong ngày
- **Highlight:** Ngày hôm nay có viền xanh
- **Drop zone:** Khi kéo công việc vào, ô sẽ sáng lên

## Tính năng nổi bật

### 1. Drag & Drop mượt mà
- Sử dụng @dnd-kit - thư viện drag & drop hiện đại
- Hỗ trợ touch screen (mobile)
- Animation mượt mà
- Visual feedback khi kéo thả

### 2. Responsive Design
- Desktop: Grid layout đầy đủ
- Tablet: Grid thu gọn
- Mobile: Stack layout dễ sử dụng

### 3. Real-time Update
- Cập nhật ngay lập tức khi thả công việc
- Toast notification xác nhận
- Sync với backend

### 4. Smart Scheduling
- Tự động đặt thời gian 9:00 AM
- Thời lượng mặc định 1 giờ
- Có thể chỉnh sửa sau trong Tasks page

## Workflow đề xuất

### Lập kế hoạch tuần

1. Chuyển sang "Xem theo Tuần"
2. Xem danh sách công việc chưa lên lịch
3. Kéo công việc quan trọng vào đầu tuần
4. Phân bổ công việc đều các ngày
5. Để công việc không gấp ở cuối tuần

### Lập kế hoạch tháng

1. Chuyển sang "Xem theo Tháng"
2. Xác định các milestone quan trọng
3. Đặt deadline vào các ngày cụ thể
4. Phân bổ công việc chuẩn bị trước deadline

### Lập kế hoạch năm

1. Chuyển sang "Xem theo Năm"
2. Xem tổng quan các tháng
3. Lên kế hoạch cho các dự án lớn
4. Phân bổ công việc theo quý

## Tips & Tricks

### 1. Batch Scheduling
- Lên lịch nhiều công việc cùng lúc
- Kéo thả nhanh từ danh sách

### 2. Color Coding
- Dùng priority để phân loại
- HIGH (đỏ): Gấp và quan trọng
- MEDIUM (vàng): Quan trọng
- LOW (xanh): Có thể làm sau

### 3. Time Blocking
- Nhóm công việc cùng loại vào cùng ngày
- Tạo "theme days" (VD: Thứ 2 - Meeting, Thứ 3 - Coding)

### 4. Review & Adjust
- Cuối tuần: Review công việc đã hoàn thành
- Đầu tuần: Lên kế hoạch tuần mới
- Cuối tháng: Đánh giá và điều chỉnh

## Keyboard Shortcuts (Sắp tới)

- `W` - Chuyển sang xem tuần
- `M` - Chuyển sang xem tháng
- `Y` - Chuyển sang xem năm
- `←` - Quay lại
- `→` - Tiến tới
- `T` - Về hôm nay
- `L` - Toggle danh sách công việc

## Tích hợp với các tính năng khác

### Tasks Page
- Tạo công việc mới → Tự động xuất hiện trong Planner
- Chỉnh sửa thời gian chi tiết
- Thêm tags, mô tả

### Calendar Page
- Xem công việc đã lên lịch dạng calendar
- Tích hợp với time blocks

### Focus Mode
- Chọn công việc từ ngày hôm nay
- Bắt đầu Pomodoro session

### Analytics
- Xem thống kê công việc theo thời gian
- Productivity trends

## Troubleshooting

### Công việc không hiển thị
- Kiểm tra filter trong Tasks page
- Refresh trang
- Kiểm tra kết nối internet

### Không kéo thả được
- Đảm bảo click vào icon GripVertical
- Thử refresh trang
- Kiểm tra browser compatibility

### Thời gian không đúng
- Mặc định là 9:00 AM
- Chỉnh sửa trong Tasks page
- Kiểm tra timezone

## Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (Limited support)

## Mobile Support

- ✅ Touch drag & drop
- ✅ Responsive layout
- ✅ Swipe navigation
- ⚠️ Tốt nhất trên tablet

## API Endpoints

### Update Task Schedule
```
PATCH /tasks/:id
Body: {
  startAt: "2024-01-15T09:00:00Z",
  dueAt: "2024-01-15T10:00:00Z"
}
```

## Tính năng sắp tới

- [ ] Multi-select tasks
- [ ] Bulk operations
- [ ] Custom time slots
- [ ] Recurring tasks
- [ ] Task dependencies
- [ ] Export to calendar (iCal)
- [ ] Print view
- [ ] Collaboration (share plans)

## Calendar time management — 2026-09-29

- Manual drag-and-drop updates the existing task's `startAt` and `dueAt`, retaining its duration. Task, calendar, planning and dashboard queries are invalidated after edits; no duplicate calendar entry is created.
- Dropping on a populated day (including directly on a task card) opens **Chỉnh thời gian**. It lists existing appointments and prevents saving an overlapping interval. Adjacent intervals are allowed. Cancel leaves the original task unchanged.
- The backend rejects overlaps with fixed blocks and unfinished tasks, excludes the task being edited, and returns `TASK_FIXED_CALENDAR_CONFLICT` or `TASK_CALENDAR_CONFLICT` with conflict details.
- **Lịch theo ngày** shows seven full-width day cards with full dates and all entries. Week timetable, month and year views remain available. Click an entry title to edit its start/end date and time, including overnight tasks and fixed blocks.
- The solar/lunar selector adds Vietnamese lunar dates using `@dqcai/vn-lunar` (Vietnam UTC+7, UI range 1800–2199). Fixed holidays and traditional lunar dates are informational; substitute holidays/annual government leave schedules are not inferred.

### Optional public Google Calendar source

Set `GOOGLE_CALENDAR_API_KEY` and `GOOGLE_PUBLIC_CALENDAR_ID` on the **backend**, enable Calendar API in the corresponding Google Cloud project, and select a publicly readable calendar ID. Restrict the key to Calendar API and the backend's infrastructure where supported. Never put the key in a `VITE_*` variable. Restart the backend, then enable **Nguồn Google Calendar** in Calendar.

`GET /calendar-sources/google-public?startDate=<ISO>&endDate=<ISO>` requires the app's JWT. It returns `{ configured, events }` in the normal API envelope. The server fetches only Google's fixed API hostname and its configured calendar, expands recurring events, follows pagination, and keeps all-day end dates exclusive. Invalid/reversed ranges and ranges over 370 days are rejected. Missing configuration is explicitly reported; provider failures do not hide the user's tasks.

Google entries are read-only annotations, not busy blocks. Personal/private Google calendars and two-way sync are not connected by this feature; they require a separate OAuth consent/token lifecycle. Reference: [Google events.list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).
