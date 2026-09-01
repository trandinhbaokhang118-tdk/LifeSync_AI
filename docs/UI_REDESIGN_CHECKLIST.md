# LifeSync AI — Checklist redesign UI toàn ứng dụng

Mục tiêu: áp dụng hệ thống giao diện dark cool-cyan đồng nhất với trang đăng nhập/đăng ký, đồng thời giữ nguyên route, API, state, quyền truy cập, validation và hành vi của mọi nút.

## Quy ước hoàn thành

- [ ] Chỉ đánh dấu một mục hoàn thành sau khi đã kiểm tra trực tiếp.
- [ ] Mọi thay đổi UI phải giữ nguyên logic nghiệp vụ hiện có.
- [ ] Không xóa route, page, component hoặc asset sản xuất nếu chưa được xác nhận.
- [ ] Không sửa contract frontend/backend trong phạm vi redesign.
- [ ] Mỗi phase phải có lint hoặc kiểm tra TypeScript phù hợp trước khi chuyển phase.

## Phase 0 — Khóa phạm vi và hệ thống thiết kế

- [ ] Xác nhận genre `modern-minimal`.
- [ ] Xác nhận dark cool-cyan là giao diện chuẩn.
- [ ] Giữ light mode dưới dạng biến thể cool-mist cùng hệ thống.
- [ ] Tạo `design.md` tại thư mục gốc dự án.
- [ ] Chốt Bricolage Grotesque cho display và Manrope cho body.
- [ ] Chốt palette OKLCH và semantic color tokens.
- [ ] Chốt thang khoảng cách 4px.
- [ ] Chốt radius cho button, input, card, modal và pill.
- [ ] Chốt motion 120/220/420ms, không bounce ở UI thông thường.
- [ ] Chốt CTA chính nền cyan, chữ tối; CTA phụ nền tối, viền mảnh.
- [ ] Ghi rõ không thay đổi backend, service, store và route tree.
- [ ] Liệt kê file sửa/tạo trước mỗi phase; không có file xóa mặc định.

## Phase 1 — Design token và nền tảng toàn cục

- [ ] Chuẩn hóa `frontend/tokens.css` thành nguồn token chính.
- [ ] Giữ nguyên directive Tailwind trong `frontend/src/index.css`.
- [ ] Đồng bộ `frontend/src/theme-variables.css` với token mới.
- [ ] Đồng bộ `frontend/src/admin-theme.css` với token mới.
- [ ] Loại bỏ màu hard-code khỏi phần UI được chỉnh sửa.
- [ ] Loại bỏ gradient tím/hồng khỏi hệ thống chuẩn.
- [ ] Chuẩn hóa semantic colors: success, warning, danger và info.
- [ ] Chuẩn hóa font family qua token, không khai báo rải rác.
- [ ] Cập nhật `frontend/TYPOGRAPHY.md` theo font đang dùng thực tế.
- [ ] Đặt `overflow-x: clip` trên `html` và `body`.
- [ ] Thêm focus ring có tương phản tối thiểu 3:1.
- [ ] Thêm reduced-motion fallback toàn cục tối đa 150ms.
- [ ] Kiểm tra dark/light mode không làm mất nội dung hoặc trạng thái.

## Phase 2 — Component UI dùng chung

Mỗi component tương tác phải kiểm tra đủ: default, hover, focus-visible, active, disabled, loading, error và success.

- [ ] Button và toàn bộ variant.
- [ ] Input, password input và input có icon.
- [ ] Select trigger, menu và option.
- [ ] Badge và status badge.
- [ ] Checkbox, switch và radio nếu xuất hiện trong page.
- [ ] Tabs và segmented controls.
- [ ] Progress bar và progress circle.
- [ ] Avatar và user menu.
- [ ] Dropdown menu.
- [ ] Modal dùng Headless UI.
- [ ] Dialog dùng Radix UI.
- [ ] ConfirmDialog.
- [ ] DateTimePicker.
- [ ] Command component.
- [ ] Toast và nút đóng toast.
- [ ] Skeleton card, list, stats, table và calendar.
- [ ] EmptyState, EmptyTasks và EmptyNotifications.
- [ ] ErrorState và nút thử lại.
- [ ] Thêm `aria-label` cho mọi icon-only button.
- [ ] Đảm bảo vùng chạm tối thiểu 44 × 44px.
- [ ] Thay `transition-all` bằng danh sách thuộc tính cụ thể.

## Phase 3 — App shell và điều hướng

- [ ] AppLayout desktop.
- [ ] AppLayout mobile.
- [ ] Header desktop và mobile.
- [ ] Sidebar mở rộng, thu gọn và hover.
- [ ] Mobile drawer và overlay.
- [ ] Mobile bottom navigation.
- [ ] Mobile quick-add FAB.
- [ ] PageHeader dùng chung.
- [ ] Command Palette và phím Ctrl/Cmd + K.
- [ ] Quick Add Modal.
- [ ] Notification indicator.
- [ ] User dropdown và logout.
- [ ] AdminLayout và admin navigation.
- [ ] Page loader/Suspense fallback.
- [ ] ErrorBoundary fallback.
- [ ] RouteError fallback.
- [ ] Giữ nguyên trạng thái thu gọn sidebar trong localStorage.
- [ ] Giữ nguyên đóng mobile drawer bằng Escape và click overlay.

## Phase 4 — Public và authentication

- [ ] `/` — Landing.
- [ ] `/login` — đăng nhập người dùng.
- [ ] `/register` — đăng ký tài khoản.
- [ ] `/admin/login` — đăng nhập quản trị và MFA.
- [ ] `/forgot-password` — yêu cầu link đặt lại mật khẩu.
- [ ] `/reset-password` — đặt mật khẩu mới và kiểm tra token.
- [ ] `/auth/callback` — trạng thái hoàn tất OAuth.
- [ ] `/404` — trang không tìm thấy.
- [ ] RouteError — lỗi lazy chunk và lỗi router.
- [ ] Đồng bộ Forgot/Reset Password với auth Split Studio.
- [ ] Giữ nguyên login bằng Google/Facebook và trạng thái khả dụng.
- [ ] Giữ nguyên validation tên, email, mật khẩu và xác nhận mật khẩu.
- [ ] Giữ nguyên nút hiện/ẩn mật khẩu.
- [ ] Giữ nguyên remember-me.
- [ ] Kiểm tra loading, success và error không làm layout nhảy.
- [ ] Đảm bảo callback không hiển thị hoặc lưu lại OAuth code.

## Phase 5 — Ứng dụng chính

- [ ] `/app` — Dashboard.
- [ ] `/app/tasks` — Tasks.
- [ ] `/app/calendar` — Calendar.
- [ ] `/app/planner` — Planner.
- [ ] `/app/focus` — Focus/Pomodoro.
- [ ] `/app/analytics` — Analytics.
- [ ] `/app/reminders` — Reminders.
- [ ] `/app/notifications` — Notifications.
- [ ] `/app/settings` — Settings.
- [ ] `/app/subscription` — Subscription.
- [ ] `/app/pricing` — Pricing.
- [ ] Giữ nguyên filter, search và sort công việc.
- [ ] Giữ nguyên tạo, sửa, xóa và đổi trạng thái công việc.
- [ ] Giữ nguyên kéo-thả task trong Planner.
- [ ] Giữ nguyên tạo/xóa time block trong Calendar.
- [ ] Giữ nguyên Pomodoro start, pause, reset, Escape và Space.
- [ ] Giữ nguyên biểu đồ và dữ liệu Recharts.
- [ ] Giữ nguyên đánh dấu thông báo đã đọc.
- [ ] Giữ nguyên nhắc việc và modal xác nhận.
- [ ] Giữ nguyên chuyển dark/light mode.
- [ ] Giữ nguyên chuyển ngôn ngữ.
- [ ] Giữ nguyên checkout và trạng thái gói hiện hành.

## Phase 6 — Fitness, workout và GPS

- [ ] `/app/fitness` — Fitness overview.
- [ ] `/app/fitness/profile` — Fitness Profile.
- [ ] `/app/fitness/devices` — Health Device Sync.
- [ ] `/app/fitness/history` — Workout History.
- [ ] `/app/fitness/workouts/:id` — Workout Detail.
- [ ] `/app/gps-tracking` — GPS Tracking và Recovery Lab.
- [ ] Giữ nguyên lưu hồ sơ thể chất và mục tiêu.
- [ ] Giữ nguyên trạng thái liên kết từng thiết bị.
- [ ] Giữ nguyên tìm kiếm và filter lịch sử tập luyện.
- [ ] Giữ nguyên route preview và dữ liệu GPS.
- [ ] Giữ nguyên trạng thái permission location/health.
- [ ] Kiểm tra biểu đồ, bản đồ và số liệu dùng tabular numerals.
- [ ] Kiểm tra layout dài của GPS Tracking trên mobile.

## Phase 7 — Admin

- [ ] `/admin` — Admin Dashboard.
- [ ] `/admin/users` — User Management.
- [ ] `/admin/activity` — Activity Logs.
- [ ] `/admin/database` — Database Management.
- [ ] `/admin/settings` — System Settings.
- [ ] Giữ nguyên AdminRoute và kiểm tra quyền ADMIN.
- [ ] Giữ nguyên MFA của admin login.
- [ ] Giữ nguyên auto-refresh và manual refresh.
- [ ] Giữ nguyên export dữ liệu.
- [ ] Giữ nguyên search, edit, role change và delete user.
- [ ] Giữ nguyên database operations và cảnh báo thao tác nguy hiểm.
- [ ] Kiểm tra table responsive và horizontal scroll có chủ đích.
- [ ] Kiểm tra modal admin không bị tràn ở 320px.

## Phase 8 — Overlay và tính năng xuyên suốt

- [ ] AIChatbot đóng/mở, gửi nội dung và image mode.
- [ ] AIChatbot loading, provider unavailable và error state.
- [ ] Xóa hội thoại chỉ chạy sau xác nhận phù hợp.
- [ ] AIScheduleModal form, analyze, result và apply.
- [ ] UpgradePromptModal.
- [ ] NotificationToast/NotificationListener.
- [ ] DevicePermissionCenter.
- [ ] WorkoutRoutePreview.
- [ ] LandingCinematicGallery và asset loading.
- [ ] Login mascot và reduced-motion.
- [ ] LifeSyncFlowBackground không ảnh hưởng readability.
- [ ] Overlay không dịch chuyển layout phía sau.
- [ ] Modal khóa body scroll và trả focus đúng phần tử mở.
- [ ] Escape đóng đúng overlay trên cùng.

## Phase 9 — Nội dung, i18n và khả năng đọc

- [ ] Không trộn tiếng Việt và tiếng Anh trong cùng một flow nếu không có chủ đích.
- [ ] Đưa nhãn UI có thể dịch vào locale `vi` và `en`.
- [ ] Giữ nguyên product name và ý nghĩa copy hiện có.
- [ ] Không bịa số liệu, testimonial hoặc claim sản phẩm.
- [ ] Heading không dùng chữ nghiêng.
- [ ] CTA và nav link không xuống hai dòng.
- [ ] Số liệu, ngày giờ và giá tiền dùng tabular numerals khi cần.
- [ ] Kiểm tra tiếng Việt có dấu không bị cắt dòng hoặc mất glyph.
- [ ] Kiểm tra heading dài có `overflow-wrap: anywhere`.

## Phase 10 — Responsive và accessibility

- [ ] Kiểm tra từng family tại 320px.
- [ ] Kiểm tra từng family tại 375px.
- [ ] Kiểm tra từng family tại 414px.
- [ ] Kiểm tra từng family tại 768px.
- [ ] Kiểm tra desktop 1280 × 720.
- [ ] Kiểm tra desktop 1440 × 900.
- [ ] Không có root horizontal scroll.
- [ ] Grid chứa ảnh dùng `minmax(0, 1fr)`.
- [ ] Section header về một cột trên mobile.
- [ ] Cho phép pinch zoom; bỏ `user-scalable=no`.
- [ ] Kiểm tra thứ tự Tab trên mọi form và modal.
- [ ] Kiểm tra focus ring bằng bàn phím.
- [ ] Kiểm tra label, name và error association của input.
- [ ] Kiểm tra icon-only button có accessible name.
- [ ] Kiểm tra tương phản text tối thiểu WCAG AA.
- [ ] Kiểm tra reduced-motion thực sự dừng chuyển động không cần thiết.
- [ ] Kiểm tra screen reader status cho loading/success/error.

## Phase 11 — PWA và Capacitor Android

- [ ] Bổ sung icon phù hợp vào PWA manifest.
- [ ] Đồng bộ `theme_color` và `background_color` với token.
- [ ] Kiểm tra standalone display và safe area.
- [ ] Đồng bộ Android splash background.
- [ ] Đồng bộ StatusBar icon style với màu nền.
- [ ] Kiểm tra navigation bar và bottom safe area.
- [ ] Kiểm tra keyboard không che input/modal trên Android.
- [ ] Kiểm tra offline loader và màn hình khi mất mạng.
- [ ] Kiểm tra service-worker update prompt.
- [ ] Chạy `npm run build` trước khi `npx cap sync android`.
- [ ] Kiểm tra trên Android emulator hoặc thiết bị thật.

## Phase 12 — Regression logic và hành vi nút

- [ ] Lập danh sách CTA/nút của từng route trước khi sửa.
- [ ] Đối chiếu từng `onClick`, `onSubmit`, `onChange` sau khi sửa.
- [ ] Không đổi endpoint hoặc payload của form.
- [ ] Không đổi query key và mutation behavior.
- [ ] Không đổi Zustand store shape.
- [ ] Không đổi PrivateRoute/AdminRoute behavior.
- [ ] Không đổi redirect sau login/logout.
- [ ] Không đổi quyền truy cập user/admin.
- [ ] Không đổi DnD identifiers hoặc sortable behavior.
- [ ] Không đổi keyboard shortcut hiện có.
- [ ] Kiểm tra double-click hoặc submit lặp đã bị chặn khi loading.
- [ ] Kiểm tra disabled button không phát sinh request.
- [ ] Kiểm tra error cho phép retry.
- [ ] Kiểm tra thao tác có thể hoàn tác dùng Undo khi phù hợp.

## Phase 13 — Kiểm thử kỹ thuật

- [ ] Chạy ESLint theo từng nhóm file vừa sửa.
- [ ] Chạy TypeScript check theo từng phase.
- [ ] Chạy `npm run build` toàn frontend.
- [ ] Ghi riêng lỗi TypeScript đã tồn tại trước redesign.
- [ ] Kiểm tra console không có error trên các route public.
- [ ] Kiểm tra console không có error trên các route user đã đăng nhập.
- [ ] Kiểm tra console không có error trên các route admin.
- [ ] Kiểm tra network request không bị nhân đôi ngoài StrictMode dự kiến.
- [ ] Kiểm tra lazy-loaded route và RouteError.
- [ ] Kiểm tra asset 404 và font loading.
- [ ] Kiểm tra LCP asset không dùng `loading="lazy"`.
- [ ] Kiểm tra bundle không tăng vì dependency mới không cần thiết.
- [ ] Chạy Hallmark slop test 58/58.

## Route và trang kỹ thuật

- [ ] Quyết định giữ hay bỏ route public `/font-test` trong production.
- [ ] Quyết định có gắn route cho `ApiTest.tsx` hay chỉ giữ làm dev utility.
- [ ] Xác minh `colors.css` có còn được dùng gián tiếp hay là legacy.
- [ ] Không xóa ba mục trên nếu chưa có xác nhận rõ ràng.

## Điều kiện nghiệm thu cuối

- [ ] Tất cả route render đúng trong dark mode.
- [ ] Tất cả route render đúng trong light mode.
- [ ] Không mất tính năng hoặc hành vi nút so với trước redesign.
- [ ] Không có lỗi console nghiêm trọng.
- [ ] Không có horizontal scroll ngoài table/timeline có chủ đích.
- [ ] Không còn gradient tím/hồng ngoài variant được phê duyệt rõ ràng.
- [ ] Không còn màu/font hard-code trong phạm vi đã redesign.
- [ ] Shared component có đầy đủ trạng thái tương tác.
- [ ] Protected routes được kiểm thử bằng tài khoản user và admin thử nghiệm.
- [ ] Android shell được kiểm tra ít nhất một lần trên emulator hoặc thiết bị thật.
- [ ] Frontend build thành công hoặc mọi lỗi nền còn lại được ghi rõ.
- [ ] `design.md`, token và giao diện thực tế không mâu thuẫn.
- [ ] Hallmark audit cuối không còn critical finding.

## Kết quả kiểm thử cuối

- Ngày kiểm thử: `____-__-__`
- Người kiểm thử: `________________`
- Frontend build: `[ ] Pass  [ ] Fail`
- ESLint: `[ ] Pass  [ ] Fail`
- User routes: `[ ] Pass  [ ] Fail`
- Admin routes: `[ ] Pass  [ ] Fail`
- Responsive: `[ ] Pass  [ ] Fail`
- Accessibility: `[ ] Pass  [ ] Fail`
- PWA/Android: `[ ] Pass  [ ] Fail`
- Hallmark audit: `____ / 58`
- Lỗi còn lại/ghi chú:

  ```text

  ```
