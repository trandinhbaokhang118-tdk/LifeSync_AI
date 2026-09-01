# 🛡️ Hướng dẫn Thiết lập Cloudflare Security cho LifeSync AI

## 📋 Mục lục
1. [Giới thiệu Cloudflare](#giới-thiệu)
2. [Đăng ký và Cấu hình DNS](#đăng-ký-dns)
3. [Kích hoạt Các Tính năng Bảo mật](#tính-năng-bảo-mật)
4. [Cấu hình Firewall Rules](#firewall-rules)
5. [Rate Limiting](#rate-limiting)
6. [Bot Protection](#bot-protection)
7. [DDoS Protection](#ddos-protection)
8. [SSL/TLS Configuration](#ssl-tls)
9. [Page Rules](#page-rules)
10. [Monitoring & Analytics](#monitoring)

---

## 🌐 Giới thiệu Cloudflare

Cloudflare cung cấp các tính năng bảo mật mạnh mẽ:

### ✅ Tính năng chính
- **DDoS Protection** - Chống tấn công từ chối dịch vụ
- **Web Application Firewall (WAF)** - Lọc request độc hại
- **Bot Management** - Chặn bot xấu
- **Rate Limiting** - Giới hạn số request
- **IP Firewall** - Chặn/Cho phép IP cụ thể
- **SSL/TLS** - Mã hóa dữ liệu
- **CDN** - Tăng tốc độ tải trang
- **Analytics** - Theo dõi traffic và tấn công

### 💰 Chi phí
- **Free Plan** - Đủ dùng cho dự án cá nhân/học tập
- **Pro Plan** ($20/tháng) - Tính năng nâng cao
- **Business/Enterprise** - Cho doanh nghiệp lớn

---

## 📝 Bước 1: Đăng ký và Cấu hình DNS

### 1.1. Tạo tài khoản Cloudflare

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký với email
3. Xác nhận email

### 1.2. Thêm Domain

1. Click **"Add a Site"**
2. Nhập domain của bạn (ví dụ: `lifesync-ai.com`)
3. Chọn **Free Plan**
4. Click **"Continue"**

### 1.3. Cấu hình DNS Records

Cloudflare sẽ scan DNS records hiện tại. Thêm/sửa các record sau:

```
Type    Name              Content                  Proxy Status
A       @                 YOUR_SERVER_IP           Proxied (Orange Cloud)
A       www               YOUR_SERVER_IP           Proxied (Orange Cloud)
A       api               YOUR_BACKEND_IP          Proxied (Orange Cloud)
CNAME   frontend          YOUR_FRONTEND_URL        Proxied (Orange Cloud)
```

**Lưu ý:**
- Bật **Proxy Status** (Orange Cloud) để kích hoạt bảo mật
- Nếu dùng Vercel/Netlify, dùng CNAME thay vì A record

### 1.4. Cập nhật Nameservers

1. Copy 2 nameservers Cloudflare cung cấp:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

2. Đăng nhập vào nhà cung cấp domain (GoDaddy, Namecheap, etc.)
3. Thay đổi nameservers thành nameservers của Cloudflare
4. Đợi 24-48 giờ để DNS propagate (thường chỉ 1-2 giờ)

### 1.5. Xác nhận Active

Sau khi DNS propagate, Cloudflare sẽ gửi email xác nhận site đã active.

---

## 🔥 Bước 2: Kích hoạt Web Application Firewall (WAF)

### 2.1. Truy cập WAF Settings

1. Vào Cloudflare Dashboard
2. Chọn domain của bạn
3. **Security** → **WAF**

### 2.2. Kích hoạt Managed Rules

Click **"Managed Rules"** tab:

**Free Plan:**
- ✅ Cloudflare Managed Ruleset - **ON**

**Pro Plan:**
- ✅ Cloudflare Managed Ruleset - **ON**
- ✅ Cloudflare OWASP Core Ruleset - **ON**

### 2.3. Cấu hình Sensitivity

**Sensitivity Level:**
- **Low** - Ít false positives, ít bảo vệ
- **Medium** (Khuyến nghị) - Cân bằng
- **High** - Bảo vệ cao, có thể chặn người dùng thật

**Khuyến nghị:** Bắt đầu với **Medium**, sau đó điều chỉnh.

---

## 🚫 Bước 3: Cấu hình Firewall Rules

### 3.1. Tạo Rule Chặn IP Độc Hại

**Security** → **WAF** → **Firewall Rules** → **Create a Firewall Rule**

#### Rule 1: Chặn các quốc gia nguy hiểm (Optional)

```
Rule Name: Block High-Risk Countries
Field: Country
Operator: equals
Value: CN, RU, KP (Trung Quốc, Nga, Triều Tiên - tuỳ chọn)
Action: Block
```

**Lưu ý:** Chỉ dùng nếu không có user từ các quốc gia này!

#### Rule 2: Chặn User-Agent Độc Hại

```
Rule Name: Block Malicious User Agents
Field: User Agent
Operator: contains
Value: bot, crawler, scanner, sqlmap, nikto
Action: Block
```

#### Rule 3: Bảo vệ Admin Panel

```
Rule Name: Protect Admin Panel
Expression: 
  (http.request.uri.path contains "/admin") and 
  (not ip.src in {YOUR_OFFICE_IP YOUR_HOME_IP})
Action: Challenge (CAPTCHA)
```

**Thay thế:**
- `YOUR_OFFICE_IP` - IP văn phòng của bạn
- `YOUR_HOME_IP` - IP nhà của bạn

#### Rule 4: Chặn Request POST Spam

```
Rule Name: Block Excessive POST Requests
Expression:
  (http.request.method eq "POST") and
  (cf.threat_score gt 10)
Action: Block
```

### 3.2. Tạo Rule Allow Trusted IPs

```
Rule Name: Allow Trusted IPs
Field: IP Address
Operator: is in
Value: YOUR_TRUSTED_IPS
Action: Allow
```

---

## ⏱️ Bước 4: Rate Limiting

### 4.1. Kích hoạt Rate Limiting (Pro Plan)

**Security** → **WAF** → **Rate Limiting Rules**

#### Rule 1: Giới hạn Login Attempts

```
Rule Name: Login Rate Limit
If incoming requests match:
  - URI Path: /api/auth/login
  - Method: POST
Then:
  - Requests: 5 requests per 1 minute per IP
  - Action: Block for 15 minutes
  - Response: HTTP 429 Too Many Requests
```

#### Rule 2: Giới hạn API Calls

```
Rule Name: API Rate Limit
If incoming requests match:
  - URI Path: /api/*
Then:
  - Requests: 100 requests per 1 minute per IP
  - Action: Block for 1 minute
```

#### Rule 3: Giới hạn Registration

```
Rule Name: Registration Rate Limit
If incoming requests match:
  - URI Path: /api/auth/register
  - Method: POST
Then:
  - Requests: 3 requests per 1 hour per IP
  - Action: Block for 1 hour
```

### 4.2. Free Plan Alternative: NestJS Rate Limiting

Nếu dùng Free Plan, implement rate limiting trong backend:

**backend/src/main.ts:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
```

---

## 🤖 Bước 5: Bot Protection

### 5.1. Kích hoạt Bot Fight Mode (Free Plan)

**Security** → **Bots**

1. Bật **"Bot Fight Mode"**
2. Chọn **"Definitely automated"**

### 5.2. Bot Management (Pro Plan)

**Security** → **Bots** → **Configure Super Bot Fight Mode**

```
Definitely automated: Block
Likely automated: Challenge (CAPTCHA)
Verified bots: Allow (Google, Bing, etc.)
```

### 5.3. JavaScript Detection

**Security** → **Settings**

✅ **"JavaScript Detection"** - ON

Yêu cầu browser phải support JavaScript để truy cập.

---

## 🛡️ Bước 6: DDoS Protection

### 6.1. Kích hoạt DDoS Protection (Free Plan)

DDoS protection được bật tự động cho tất cả site trên Cloudflare.

**Security** → **DDoS**

✅ **"HTTP DDoS Attack Protection"** - ON (Auto)
✅ **"Network-layer DDoS Attack Protection"** - ON (Auto)

### 6.2. Cấu hình Sensitivity

**Sensitivity:**
- **Default** (Khuyến nghị) - Cloudflare tự động điều chỉnh
- **Essentially Off** - Chỉ chặn tấn công rất rõ ràng
- **Low** - Ít false positives
- **Medium** - Cân bằng
- **High** - Bảo vệ cao nhất

### 6.3. DDoS Alerts

**Notifications** → **Add**

Tạo notification khi có DDoS attack:
```
Event: DDoS Attack
Delivery: Email, Webhook
```

---

## 🔒 Bước 7: SSL/TLS Configuration

### 7.1. Chọn SSL Mode

**SSL/TLS** → **Overview**

**Chọn mode:**
- ❌ **Off** - Không mã hóa (KHÔNG dùng)
- ❌ **Flexible** - Cloudflare ↔ User mã hóa, Cloudflare ↔ Server không mã hóa
- ✅ **Full** - Mã hóa end-to-end (dùng self-signed cert ở server)
- ✅ **Full (strict)** (Khuyến nghị) - Mã hóa với valid cert

**Khuyến nghị:** Chọn **Full (strict)** nếu server có SSL cert.

### 7.2. Kích hoạt Always Use HTTPS

**SSL/TLS** → **Edge Certificates**

✅ **"Always Use HTTPS"** - ON

Tự động redirect HTTP → HTTPS.

### 7.3. HTTP Strict Transport Security (HSTS)

✅ **"HTTP Strict Transport Security (HSTS)"**

```
Max Age Header (max-age): 6 months
Include subdomains: Yes
No-Sniff Header: Yes
```

### 7.4. Tạo Origin Certificate (Nếu self-hosted)

1. **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Chọn **"Let Cloudflare generate a private key and CSR"**
3. Hostnames: `lifesync-ai.com, *.lifesync-ai.com`
4. Certificate Validity: 15 years
5. Click **"Create"**
6. Copy **Certificate** và **Private Key**

**Lưu certificate:**

**backend/ssl/cloudflare-cert.pem:**
```
-----BEGIN CERTIFICATE-----
[YOUR CERTIFICATE]
-----END CERTIFICATE-----
```

**backend/ssl/cloudflare-key.pem:**
```
-----BEGIN PRIVATE KEY-----
[YOUR PRIVATE KEY]
-----END PRIVATE KEY-----
```

**Cấu hình NestJS:**

```typescript
// backend/src/main.ts
import * as fs from 'fs';
import * as https from 'https';

const httpsOptions = {
  key: fs.readFileSync('./ssl/cloudflare-key.pem'),
  cert: fs.readFileSync('./ssl/cloudflare-cert.pem'),
};

const app = await NestFactory.create(AppModule, {
  httpsOptions,
});
```

---

## 📄 Bước 8: Page Rules

### 8.1. Tạo Page Rules

**Rules** → **Page Rules** → **Create Page Rule**

#### Rule 1: Cache Static Assets

```
URL: lifesync-ai.com/assets/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

#### Rule 2: Security cho Admin

```
URL: lifesync-ai.com/admin*
Settings:
  - Security Level: High
  - Browser Integrity Check: On
```

#### Rule 3: Bypass Cache cho API

```
URL: api.lifesync-ai.com/api/*
Settings:
  - Cache Level: Bypass
```

---

## 📊 Bước 9: Monitoring & Analytics

### 9.1. Security Analytics

**Security** → **Analytics**

Xem:
- Tổng số requests
- Threats blocked
- Top attacking countries
- Top attacking IPs

### 9.2. Firewall Events

**Security** → **Events**

Xem real-time:
- Requests bị block
- CAPTCHA challenges
- Rule matches

### 9.3. Alerts & Notifications

**Notifications** → **Add**

Tạo alerts cho:
- DDoS attacks
- Traffic anomalies
- SSL certificate expiration
- Health checks

---

## 🧪 Bước 10: Testing & Verification

### 10.1. Test SSL

```bash
# Command line
curl -I https://lifesync-ai.com

# Online tools
https://www.ssllabs.com/ssltest/
```

**Mục tiêu:** Grade A hoặc A+

### 10.2. Test Firewall Rules

1. Truy cập site từ VPN khác quốc gia
2. Thử login sai nhiều lần
3. Kiểm tra Firewall Events trên Cloudflare

### 10.3. Test Rate Limiting

```bash
# Gửi nhiều request nhanh
for i in {1..20}; do
  curl -X POST https://api.lifesync-ai.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

Kỳ vọng: Bị block sau 5 requests.

### 10.4. Test DDoS Protection

**Không tự test DDoS trên production!**

Cloudflare tự động phát hiện và chặn.

---

## 🎯 Cấu hình Khuyến nghị cho LifeSync AI

### Cho Development/Testing
```
SSL/TLS: Full
Bot Fight Mode: OFF (để test)
Rate Limiting: Loose (100 req/min)
Firewall: Minimal rules
```

### Cho Production
```
SSL/TLS: Full (strict)
Bot Fight Mode: ON
Rate Limiting: 
  - Login: 5 req/min
  - API: 100 req/min
  - Register: 3 req/hour
Firewall Rules:
  - Block malicious bots
  - Protect /admin
  - Challenge suspicious IPs
DDoS: Auto (High sensitivity)
HSTS: Enabled (6 months)
Always HTTPS: ON
```

---

## 📝 Backend Configuration Updates

### Update CORS cho Cloudflare

**backend/src/main.ts:**
```typescript
app.enableCors({
  origin: [
    'https://lifesync-ai.com',
    'https://www.lifesync-ai.com',
    'http://localhost:5173', // Development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CF-Ray', 'CF-Connecting-IP'],
});
```

### Lấy Real IP của User qua Cloudflare

**backend/src/common/decorators/real-ip.decorator.ts:**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RealIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Cloudflare headers
    return (
      request.headers['cf-connecting-ip'] ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress
    );
  },
);
```

**Sử dụng:**
```typescript
@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @RealIp() ip: string,
) {
  console.log('User IP:', ip);
  // ...
}
```

---

## ⚠️ Lưu ý Quan trọng

### ✅ DO (Nên làm)
- ✅ Bật SSL Full (strict)
- ✅ Kích hoạt Always HTTPS
- ✅ Setup rate limiting
- ✅ Bật Bot Fight Mode
- ✅ Monitor Firewall Events thường xuyên
- ✅ Setup notifications cho attacks
- ✅ Whitelist IPs tin cậy

### ❌ DON'T (Không nên)
- ❌ Chặn tất cả các quốc gia trừ 1-2 quốc gia (mất khách hàng)
- ❌ Set rate limiting quá chặt (ảnh hưởng UX)
- ❌ Bật tất cả rules cùng lúc (test từng rule một)
- ❌ Dùng SSL Flexible mode (không an toàn)
- ❌ Tắt Bot Fight Mode khi production

---

## 🔍 Troubleshooting

### Vấn đề: User không thể truy cập site

**Nguyên nhân:**
- Firewall rule quá chặt
- Bot Fight Mode chặn nhầm

**Giải pháp:**
1. Kiểm tra **Firewall Events**
2. Thêm IP của user vào Whitelist
3. Giảm sensitivity của rules

### Vấn đề: Tốc độ chậm sau khi dùng Cloudflare

**Nguyên nhân:**
- DNS chưa propagate hết
- Server gốc chậm

**Giải pháp:**
1. Đợi 24-48h cho DNS propagate
2. Bật Cloudflare CDN caching
3. Optimize server backend

### Vấn đề: SSL Certificate Error

**Nguyên nhân:**
- Chưa cài certificate trên server
- SSL mode không đúng

**Giải pháp:**
1. Chuyển về Full mode
2. Cài Origin Certificate từ Cloudflare
3. Hoặc dùng Let's Encrypt

---

## 📞 Hỗ trợ

**Cloudflare Support:**
- Free Plan: Community forum
- Pro Plan+: Email/Chat support
- Docs: https://developers.cloudflare.com/

**LifeSync AI:**
- GitHub Issues: [link]
- Email: trandinhbaokhang@example.com

---

## 🎉 Hoàn thành!

Sau khi hoàn thành tất cả các bước:

✅ Website được bảo vệ bởi Cloudflare WAF  
✅ Tự động chặn DDoS attacks  
✅ Rate limiting ngăn brute force  
✅ Bot protection chặn bot xấu  
✅ SSL/TLS mã hóa dữ liệu  
✅ CDN tăng tốc độ tải  
✅ Monitoring & alerts real-time  

**Bảo mật IP:** ✅ Đã ẩn IP server thật đằng sau Cloudflare!

---

**Người tạo:** Trần Đình Bảo Khang  
**Ngày tạo:** Tháng 7, 2026  
**Phiên bản:** 1.0.0
