# 🤖 AI CHATBOT - HƯỚNG DẪN SỬ DỤNG

## 📋 Tổng quan

AI Chatbot là trợ lý thông minh giúp bạn quản lý công việc, lên lịch và tối ưu thời gian trong LifeSync AI.

## ✨ Tính năng

### 1. **Trò chuyện thông minh**
- Hiểu ngữ cảnh và lịch sử chat
- Trả lời bằng tiếng Việt tự nhiên
- Đề xuất hành động tiếp theo

### 2. **Quản lý Tasks**
- Tạo task mới qua chat
- Cập nhật, xóa tasks
- Xem danh sách công việc
- Lọc theo trạng thái, độ ưu tiên

### 3. **Lên lịch thông minh**
- Đề xuất thời gian phù hợp
- Tối ưu lịch trình
- Nhắc nhở deadline

### 4. **Phân tích năng suất**
- Thống kê công việc hoàn thành
- Đánh giá hiệu suất
- Đề xuất cải thiện

## 🎯 Cách sử dụng

### Mở Chatbot
1. Click vào icon **Sparkles** (✨) ở góc dưới bên phải
2. Chatbot sẽ hiện lên với lời chào

### Các câu lệnh mẫu

#### **Tạo Task**
```
"Tạo task học React deadline ngày mai"
"Thêm công việc họp team lúc 2h chiều"
"Tạo task mua sắm độ ưu tiên cao"
```

#### **Xem Tasks**
```
"Xem công việc hôm nay"
"Có bao nhiêu task chưa hoàn thành?"
"Hiển thị tasks ưu tiên cao"
```

#### **Lên lịch**
```
"Sắp xếp lịch tuần này"
"Khi nào tôi rảnh để học?"
"Đề xuất thời gian làm bài tập"
```

#### **Thống kê**
```
"Thống kê công việc tuần này"
"Tôi đã hoàn thành bao nhiêu task?"
"Phân tích năng suất của tôi"
```

### Quick Suggestions
- Click vào các gợi ý nhanh phía dưới chat
- Chatbot tự động cập nhật gợi ý theo ngữ cảnh

## 🔧 Cài đặt Backend

### 1. Cài đặt OpenAI API (Tùy chọn)

Để chatbot thông minh hơn, bạn cần OpenAI API key:

1. Đăng ký tại: https://platform.openai.com/
2. Tạo API key
3. Thêm vào file `.env`:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Lưu ý**: Nếu không có API key, chatbot vẫn hoạt động với logic fallback cơ bản.

### 2. Khởi động Backend

```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

### 3. Khởi động Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🎨 Giao diện

### Design System
- **Light Mode**: Galaxy Aqua theme với gradient xanh thiên hà
- **Dark Mode**: Deep Glossy Black với neon highlights
- **Animations**: Smooth transitions, hover effects
- **Responsive**: Hoạt động tốt trên mobile và desktop

### Các thành phần UI
- **Floating Button**: Nút tròn gradient với icon Sparkles
- **Chat Window**: 400x600px, rounded corners, backdrop blur
- **Messages**: Bubble style với avatar
- **Suggestions**: Pills dạng tag có thể click
- **Input**: Auto-focus, enter to send

## 📱 Responsive

### Desktop (≥1024px)
- Chatbot ở góc dưới phải
- Kích thước: 400x600px
- Không che khuất nội dung chính

### Mobile (<640px)
- Chatbot full screen khi mở
- Bottom sheet style
- Swipe down để đóng

## 🔐 Bảo mật

- Tất cả requests đều yêu cầu JWT token
- Messages không được lưu trữ (stateless)
- API key được bảo vệ ở backend

## 🚀 Tính năng nâng cao (Tương lai)

### Phase 2
- [ ] Voice input/output
- [ ] Tích hợp Google Calendar
- [ ] Export chat history
- [ ] Multi-language support

### Phase 3
- [ ] Custom AI training với data cá nhân
- [ ] Collaborative chat (team chat)
- [ ] AI scheduling optimizer
- [ ] Smart notifications

## 🐛 Troubleshooting

### Chatbot không phản hồi
1. Kiểm tra backend đang chạy
2. Kiểm tra token authentication
3. Xem console log để debug

### Phản hồi chậm
1. Kiểm tra kết nối internet
2. OpenAI API có thể bị rate limit
3. Thử refresh trang

### Lỗi "Unauthorized"
1. Đăng xuất và đăng nhập lại
2. Kiểm tra token trong localStorage
3. Xóa cache trình duyệt

## 💡 Tips & Tricks

1. **Câu hỏi cụ thể**: Càng cụ thể càng tốt
   - ❌ "Tạo task"
   - ✅ "Tạo task học React deadline ngày mai lúc 5h chiều"

2. **Sử dụng ngữ cảnh**: Chatbot nhớ 5 tin nhắn gần nhất
   - "Tạo task học React"
   - "Đặt deadline ngày mai" (chatbot hiểu là task vừa tạo)

3. **Quick actions**: Dùng suggestions để nhanh hơn

4. **Keyboard shortcuts**:
   - `Enter`: Gửi tin nhắn
   - `Esc`: Đóng chatbot (sắp có)

## 📊 API Endpoints

### POST `/ai-chat/message`
Gửi tin nhắn đến chatbot

**Request:**
```json
{
  "message": "Tạo task học React",
  "context": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "message": "Đã tạo task 'Học React' thành công!",
  "suggestions": ["Xem task vừa tạo", "Tạo task khác"],
  "actions": [
    {
      "type": "create_task",
      "data": { "title": "Học React", ... }
    }
  ]
}
```

### POST `/ai-chat/suggestions`
Lấy gợi ý nhanh

**Response:**
```json
{
  "suggestions": [
    "Bạn có 3 task hôm nay",
    "Lên lịch tuần này",
    "Xem thống kê"
  ]
}
```

## 🎓 Best Practices

1. **Luôn test với và không có OpenAI API key**
2. **Handle errors gracefully**
3. **Provide fallback responses**
4. **Keep messages concise**
5. **Use loading states**
6. **Implement rate limiting**

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Basic chat interface
- ✅ OpenAI integration
- ✅ Task context awareness
- ✅ Quick suggestions
- ✅ Responsive design
- ✅ Dark/Light mode support

---

**Phát triển bởi**: LifeSync AI Team  
**Cập nhật**: January 2026  
**Version**: 1.0.0
