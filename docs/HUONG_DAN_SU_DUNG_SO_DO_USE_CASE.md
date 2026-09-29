# Hướng dẫn sử dụng sơ đồ use case LifeSync AI

## 1. Sơ đồ use case tổng quát

**Tệp sử dụng**

- Ảnh PNG cho Word và PowerPoint: `docs/diagrams/05-use-case-tong-quat.png`
- Ảnh SVG để phóng to hoặc chỉnh sửa: `docs/diagrams/05-use-case-tong-quat.svg`

**Vị trí trong báo cáo**

Đặt tại **Chương 2. Khảo sát và phân tích yêu cầu**, ngay sau bảng **2.1. Yêu cầu chức năng** và trước **2.2. Yêu cầu phi chức năng**. Dùng tiêu đề mục **2.1.1. Sơ đồ use case tổng quát** và chú thích ảnh **Hình 2.1. Sơ đồ use case tổng quát của LifeSync AI**.

**Mô tả dùng trong báo cáo**

Sơ đồ use case tổng quát xác định phạm vi chức năng của LifeSync AI với 3 tác nhân nghiệp vụ, 3 hệ thống tích hợp bên ngoài và 12 nhóm use case chính. Khách có thể đăng ký, đăng nhập và khôi phục tài khoản. Sau khi xác thực, Người dùng thực hiện 7 nhóm chức năng gồm quản lý hồ sơ; quản lý công việc và lịch; Dashboard, Focus và thông báo; trợ lý AI; sức khỏe và GPS; thuê bao và thanh toán; thiết lập cá nhân. Quản trị viên phụ trách quản lý người dùng, theo dõi vận hành và quản lý nội dung hoặc gói. OAuth, AI Provider và cổng thanh toán nằm ngoài biên hệ thống, lần lượt hỗ trợ đăng nhập liên kết, xử lý hội thoại AI và giao dịch Stripe hoặc SePay.

**Vị trí trong slide**

Đặt sau slide **Đối tượng sử dụng và phạm vi chức năng**, trước slide **Kiến trúc tổng thể**. Khi thuyết trình, trình bày theo thứ tự Khách, Người dùng, Quản trị viên, sau đó giải thích 3 hệ thống tích hợp bên ngoài.

## 2. Sơ đồ use case chi tiết quản lý công việc

**Tệp sử dụng**

- Ảnh PNG cho Word và PowerPoint: `docs/diagrams/06-use-case-chi-tiet-quan-ly-cong-viec.png`
- Ảnh SVG để phóng to hoặc chỉnh sửa: `docs/diagrams/06-use-case-chi-tiet-quan-ly-cong-viec.svg`

**Vị trí trong báo cáo**

Đặt tại cuối **Chương 2**, sau **2.3. Quy tắc nghiệp vụ tiêu biểu** và trước **Chương 3. Kiến trúc hệ thống**. Dùng tiêu đề mục **2.4. Use case chi tiết quản lý công việc** và chú thích ảnh **Hình 2.2. Sơ đồ use case chi tiết quản lý công việc và lịch**.

**Mô tả dùng trong báo cáo**

Sơ đồ chi tiết phân rã phân hệ công việc và lịch thành 5 thao tác trực tiếp của người dùng, 4 nghiệp vụ dùng chung, 2 tình huống ngoại lệ và 1 nghiệp vụ thông báo tự động. Người dùng có thể tạo; xem, tìm kiếm và lọc; cập nhật hoặc hoàn thành; xóa công việc; và cấu hình lịch nhắc. Khi tạo công việc, hệ thống luôn kiểm tra dữ liệu và lịch trùng; khi cập nhật hoặc xóa, hệ thống kiểm tra quyền sở hữu trước khi ghi thay đổi. Quan hệ `«include»` biểu thị nghiệp vụ bắt buộc được tái sử dụng. Quan hệ `«extend»` biểu thị lỗi dữ liệu hoặc xung đột lịch chỉ phát sinh khi điều kiện tương ứng xảy ra. Khi lịch nhắc đến thời điểm kích hoạt, bộ lập lịch tạo thông báo để chuyển tới người dùng.

**Vị trí trong slide**

Đặt trước slide **Trình tự tạo task** hoặc **Luồng tạo khối thời gian**. Dành một slide riêng cho sơ đồ; phần thuyết trình đi theo luồng tạo công việc, kiểm tra dữ liệu, kiểm tra trùng lịch, lưu dữ liệu, rồi đến lịch nhắc và thông báo.

## 3. Quy ước trình bày

- Đường liền biểu thị quan hệ tương tác giữa tác nhân và use case.
- Mũi tên nét đứt `«include»` trỏ tới nghiệp vụ luôn được gọi lại.
- Mũi tên nét đứt `«extend»` trỏ về use case cơ sở khi tình huống điều kiện phát sinh.
- Hai ảnh dùng tỷ lệ 16:9 và độ phân giải 1920 × 1080, phù hợp để đặt toàn trang trên slide.
