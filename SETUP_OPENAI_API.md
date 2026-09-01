# 🤖 SETUP OPENAI API - CHATBOT THÔNG MINH

## 🎯 Mục đích

Thêm OpenAI API để chatbot có thể:
- ✅ Trả lời MỌI câu hỏi (như ChatGPT)
- ✅ Giải toán, lập trình, khoa học
- ✅ Tư vấn, gợi ý thông minh
- ✅ Hiểu ngữ cảnh tốt hơn

---

## 📝 Bước 1: Lấy OpenAI API Key

### 1.1. Đăng ký OpenAI
```
https://platform.openai.com/signup
```

### 1.2. Tạo API Key
1. Đăng nhập: https://platform.openai.com/
2. Vào: https://platform.openai.com/api-keys
3. Click: **"Create new secret key"**
4. Đặt tên: `LifeSync AI-Chatbot`
5. Copy key (dạng: `sk-proj-...`)

⚠️ **LƯU Ý**: Copy ngay, không xem lại được!

---

## 💰 Chi phí

### Free Tier:
- **$5 credit** miễn phí cho tài khoản mới
- Đủ dùng cho ~2,500 câu hỏi

### Pricing:
- **GPT-3.5-turbo**: $0.002/1K tokens (~$0.0002/câu hỏi)
- **GPT-4**: $0.03/1K tokens (~$0.003/câu hỏi)

### Ví dụ:
- 1,000 câu hỏi ≈ $0.20 (GPT-3.5)
- 1,000 câu hỏi ≈ $3.00 (GPT-4)

---

## ⚙️ Bước 2: Thêm API Key vào Backend

### 2.1. Mở file `.env`
```bash
# Mở file
backend/.env
```

### 2.2. Thêm API Key
Tìm dòng:
```bash
# OPENAI_API_KEY="sk-your-api-key-here"
```

Sửa thành (bỏ dấu #):
```bash
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

### 2.3. Lưu file

---

## 🔄 Bước 3: Restart Backend

```bash
# Dừng backend (Ctrl+C)
# Hoặc
taskkill /F /IM node.exe

# Khởi động lại
cd backend
npm run dev
```

---

## ✅ Bước 4: Test

### 4.1. Mở chatbot
- Vào: http://localhost:5173
- Click icon chat góc phải

### 4.2. Thử các câu hỏi:

**Câu hỏi chung:**
```
- "React là gì?"
- "2+2 bằng mấy?"
- "Giải thích về AI"
- "Viết code hello world bằng Python"
```

**Câu hỏi về tasks:**
```
- "Tạo task học React deadline ngày mai"
- "Xem công việc hôm nay"
- "Thống kê tuần này"
```

---

## 🎨 Tùy chỉnh

### Đổi model (trong `ai-chat.service.ts`):

```typescript
// GPT-3.5 (rẻ, nhanh)
private readonly openaiModel: string = 'gpt-3.5-turbo';

// GPT-4 (thông minh hơn, đắt hơn)
private readonly openaiModel: string = 'gpt-4';

// GPT-4 Turbo (cân bằng)
private readonly openaiModel: string = 'gpt-4-turbo-preview';
```

### Tăng độ dài response:

```typescript
max_tokens: 500,  // Mặc định
max_tokens: 1000, // Dài hơn
max_tokens: 2000, // Rất dài
```

### Điều chỉnh creativity:

```typescript
temperature: 0.7, // Cân bằng (mặc định)
temperature: 0.3, // Chính xác, ít sáng tạo
temperature: 0.9, // Sáng tạo, đa dạng
```

---

## 🔐 Bảo mật

### ✅ Nên làm:
- Lưu API key trong `.env` (không commit lên Git)
- Thêm `.env` vào `.gitignore`
- Dùng environment variables trên production
- Set spending limit trên OpenAI dashboard

### ❌ Không nên:
- Hardcode API key trong code
- Commit API key lên GitHub
- Share API key công khai
- Để unlimited spending

---

## 📊 Monitor Usage

### Xem usage:
```
https://platform.openai.com/usage
```

### Set spending limit:
```
https://platform.openai.com/account/billing/limits
```

Ví dụ: Set limit $10/tháng

---

## 🐛 Troubleshooting

### Lỗi: "Invalid API key"
```bash
# Kiểm tra API key trong .env
cat backend/.env | grep OPENAI

# Đảm bảo không có khoảng trắng
OPENAI_API_KEY="sk-proj-..."  # ✅ Đúng
OPENAI_API_KEY= "sk-proj-..." # ❌ Sai (có khoảng trắng)
```

### Lỗi: "Rate limit exceeded"
```
Bạn đã hết quota hoặc gửi quá nhiều requests.
Giải pháp:
1. Đợi 1 phút
2. Nạp thêm tiền
3. Upgrade plan
```

### Lỗi: "Insufficient quota"
```
Hết $5 free credit.
Giải pháp:
1. Thêm payment method
2. Nạp tiền ($5-$10)
```

### Chatbot vẫn dùng fallback
```bash
# Kiểm tra backend logs
cd backend
npm run dev

# Xem có log "OpenAI API error" không
# Nếu có, check API key
```

---

## 💡 Tips

### 1. Tiết kiệm chi phí:
- Dùng GPT-3.5 thay vì GPT-4
- Giảm `max_tokens` xuống 300-500
- Cache responses phổ biến

### 2. Tăng chất lượng:
- Viết system prompt chi tiết
- Thêm examples vào prompt
- Dùng GPT-4 cho câu hỏi phức tạp

### 3. Tối ưu performance:
- Set timeout cho API calls
- Implement retry logic
- Add loading states

---

## 🎓 Ví dụ Prompts

### Prompt hiện tại:
```
Bạn là trợ lý AI thông minh cho LifeSync AI...
```

### Prompt cải tiến:
```typescript
return `Bạn là trợ lý AI thông minh và thân thiện.

NHIỆM VỤ:
1. Trả lời MỌI câu hỏi (không chỉ về quản lý thời gian)
2. Giúp quản lý công việc trong LifeSync AI
3. Đề xuất tối ưu thời gian
4. Tạo/cập nhật tasks khi cần

TASKS HIỆN TẠI:
${tasksSummary}

QUY TẮC:
- Trả lời NGẮN GỌN (2-3 câu)
- Thân thiện, dễ hiểu
- Có thể trả lời về BẤT KỲ chủ đề nào
- Khi tạo task: [ACTION:CREATE_TASK] {...}

VÍ DỤ:
User: "React là gì?"
AI: "React là thư viện JavaScript để xây dựng giao diện người dùng..."

User: "Tạo task học React"
AI: "Đã tạo task! [ACTION:CREATE_TASK] {...}"
`;
```

---

## 📚 Tài liệu

- **OpenAI API Docs**: https://platform.openai.com/docs
- **Pricing**: https://openai.com/pricing
- **Best Practices**: https://platform.openai.com/docs/guides/production-best-practices
- **Rate Limits**: https://platform.openai.com/docs/guides/rate-limits

---

## ✅ Checklist

- [ ] Đăng ký OpenAI account
- [ ] Tạo API key
- [ ] Thêm key vào `backend/.env`
- [ ] Restart backend
- [ ] Test chatbot
- [ ] Set spending limit
- [ ] Monitor usage

---

**Chúc bạn thành công!** 🚀

Date: January 23, 2026  
Version: 1.0.0
