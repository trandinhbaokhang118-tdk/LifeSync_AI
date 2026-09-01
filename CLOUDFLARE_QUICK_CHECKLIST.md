# ✅ Cloudflare Security - Quick Checklist

## 🚀 Checklist Thiết lập Nhanh (30 phút)

### Phase 1: Thiết lập Cơ bản (10 phút)
- [ ] Đăng ký tài khoản Cloudflare (https://dash.cloudflare.com/sign-up)
- [ ] Thêm domain vào Cloudflare
- [ ] Chọn Free Plan
- [ ] Copy 2 nameservers Cloudflare
- [ ] Cập nhật nameservers ở nhà cung cấp domain
- [ ] Đợi DNS propagate (kiểm tra: https://dnschecker.org/)
- [ ] Xác nhận site Active trên Cloudflare

### Phase 2: Cấu hình DNS (5 phút)
- [ ] Thêm A record cho root domain (@) → Server IP
- [ ] Thêm A/CNAME record cho www
- [ ] Thêm A/CNAME record cho api subdomain
- [ ] Bật Proxy Status (Orange Cloud) cho tất cả records
- [ ] Verify: Ping domain và kiểm tra IP trả về là Cloudflare IP

### Phase 3: SSL/TLS (5 phút)
- [ ] Vào **SSL/TLS** → **Overview**
- [ ] Chọn mode: **Full (strict)** (hoặc **Full** nếu chưa có SSL)
- [ ] Vào **Edge Certificates**
- [ ] Bật **Always Use HTTPS** - ON
- [ ] Bật **HTTP Strict Transport Security (HSTS)**
  - Max Age: 6 months
  - Include subdomains: Yes
- [ ] Test: https://www.ssllabs.com/ssltest/

### Phase 4: Firewall & Security (10 phút)
- [ ] Vào **Security** → **WAF**
- [ ] Bật **Cloudflare Managed Ruleset** - ON
- [ ] Set **Sensitivity** = Medium
- [ ] Vào **Firewall Rules** → **Create Rule**
- [ ] Tạo Rule 1: Chặn Malicious User Agents
  ```
  User Agent contains "bot|scanner|sqlmap|nikto"
  Action: Block
  ```
- [ ] Tạo Rule 2: Protect Admin Panel
  ```
  URI Path contains "/admin"
  AND IP not in {YOUR_IP}
  Action: Challenge
  ```
- [ ] Tạo Rule 3: Block High Threat Score
  ```
  Threat Score > 10
  Action: Block
  ```

### Phase 5: Bot Protection (5 phút)
- [ ] Vào **Security** → **Bots**
- [ ] Bật **Bot Fight Mode** - ON
- [ ] Chọn **Definitely automated** = Block
- [ ] Vào **Settings**
- [ ] Bật **JavaScript Detection** - ON

### Phase 6: Rate Limiting (Backend) (5 phút)
Vì Free Plan không có Rate Limiting, cài đặt trong backend:

**backend/package.json:**
```json
"dependencies": {
  "express-rate-limit": "^7.1.5"
}
```

**backend/src/main.ts:**
```typescript
import rateLimit from 'express-rate-limit';

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
// Apply loginLimiter to specific route in auth controller
```

**backend/src/auth/auth.controller.ts:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

@Post('login')
@UseInterceptors(loginLimiter) // Apply rate limiting
async login(@Body() loginDto: LoginDto) {
  // ...
}
```

- [ ] Install express-rate-limit
- [ ] Add rate limiting to main.ts
- [ ] Add specific limiter for login route
- [ ] Test: Gửi 10 requests nhanh → Phải bị chặn

### Phase 7: Monitoring Setup (5 phút)
- [ ] Vào **Notifications**
- [ ] Tạo Email Notification cho:
  - [ ] DDoS Attack Detection
  - [ ] Traffic Anomaly Alert
  - [ ] Firewall Events (nếu Pro Plan)
- [ ] Vào **Analytics** → **Security**
- [ ] Bookmark trang này để theo dõi hàng ngày

---

## 🎯 Verification Checklist

### Test 1: SSL/HTTPS
```bash
curl -I https://your-domain.com
```
✅ Kỳ vọng: HTTP/2 200, strict-transport-security header

### Test 2: Firewall Rules
- [ ] Truy cập /admin từ IP không cho phép → Phải thấy CAPTCHA
- [ ] Sử dụng User-Agent giả mạo:
  ```bash
  curl -H "User-Agent: sqlmap/1.0" https://your-domain.com
  ```
  ✅ Kỳ vọng: 403 Forbidden

### Test 3: Rate Limiting
```bash
for i in {1..10}; do
  curl -X POST https://api.your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```
✅ Kỳ vọng: Bị chặn sau 5 requests (HTTP 429)

### Test 4: Bot Detection
- [ ] Vào https://your-domain.com từ Tor Browser
- ✅ Kỳ vọng: Thấy CAPTCHA challenge

### Test 5: Real IP Detection (Backend)
```typescript
// Test endpoint
@Get('test-ip')
testIp(@RealIp() ip: string) {
  return { ip };
}
```
- [ ] Call API và verify IP trả về là IP thật của bạn, không phải Cloudflare IP

---

## 📊 Monitoring Routine

### Daily (Hàng ngày)
- [ ] Kiểm tra **Security Analytics** (5 phút)
  - Total requests
  - Threats blocked
  - Top attacking IPs
- [ ] Kiểm tra **Firewall Events** nếu có spike lạ

### Weekly (Hàng tuần)
- [ ] Review Firewall Rules effectiveness
- [ ] Adjust sensitivity nếu cần
- [ ] Check false positives (user bị chặn nhầm)
- [ ] Update whitelist IPs nếu có

### Monthly (Hàng tháng)
- [ ] SSL certificate check (auto-renew)
- [ ] Review và optimize Page Rules
- [ ] Check for Cloudflare feature updates
- [ ] Backup Cloudflare configuration

---

## 🚨 Troubleshooting Quick Fixes

### Vấn đề: User không vào được site
**Quick Fix:**
1. Vào **Firewall Events**
2. Tìm IP của user
3. Tạo rule Allow cho IP đó
4. Hoặc tạm tắt rule đang chặn

### Vấn đề: Admin không login được
**Quick Fix:**
1. Vào **Firewall Rules**
2. Edit rule "Protect Admin Panel"
3. Thêm IP của admin vào whitelist

### Vấn đề: API calls bị chặn
**Quick Fix:**
1. Kiểm tra User-Agent của app
2. Thêm User-Agent vào whitelist:
   ```
   User Agent equals "LifeSyncApp/1.0"
   Action: Allow
   ```

### Vấn đề: SSL Certificate Error
**Quick Fix:**
1. Vào **SSL/TLS** → **Overview**
2. Chuyển về **Full** mode (thay vì Full strict)
3. Đợi 5 phút
4. Test lại

---

## 📈 Optimization Tips

### Tip 1: Enable Caching
- [ ] Vào **Caching** → **Configuration**
- [ ] Set **Browser Cache TTL** = 4 hours
- [ ] Bật **Always Online** (serve from cache nếu server down)

### Tip 2: Optimize Images
- [ ] Vào **Speed** → **Optimization**
- [ ] Bật **Auto Minify** (HTML, CSS, JS)
- [ ] Bật **Rocket Loader** (async JS loading)
- [ ] Bật **Mirage** (image optimization) - Pro Plan

### Tip 3: Setup Page Rules
- [ ] Vào **Rules** → **Page Rules**
- [ ] Create rule: Cache static assets
  ```
  URL: your-domain.com/assets/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
  ```

---

## 🎓 Best Practices

### Security
✅ **Luôn dùng Full (strict) SSL mode**  
✅ **Bật HSTS với max-age >= 6 months**  
✅ **Whitelist trusted IPs để tránh false positives**  
✅ **Monitor Firewall Events hàng ngày**  
✅ **Setup email alerts cho attacks**

### Performance
✅ **Bật caching cho static assets**  
✅ **Enable Auto Minify cho HTML/CSS/JS**  
✅ **Use Page Rules để optimize specific paths**  
✅ **Monitor Analytics để identify slow endpoints**

### Availability
✅ **Bật Always Online mode**  
✅ **Setup health checks (Pro Plan)**  
✅ **Configure load balancing nếu có multiple servers**

---

## 📝 Configuration Backup

Sau khi setup xong, backup configuration:

### Export Rules
1. Vào **Overview**
2. Scroll xuống dưới
3. Click **"Export Configuration"** (Pro Plan)
4. Hoặc screenshot tất cả rules

### Document Configuration
```
Domain: your-domain.com
SSL/TLS: Full (strict)
HSTS: Enabled (6 months)
WAF: Managed Rules (Medium)
Bot Fight Mode: ON
Firewall Rules: 3 active rules
Rate Limiting: Backend implementation
Notifications: Email alerts ON
```

Save file này vào: `CLOUDFLARE_CONFIG_BACKUP_[DATE].md`

---

## 🎉 Completion Certificate

Khi hoàn thành tất cả checklist items:

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🛡️ CLOUDFLARE SECURITY SETUP COMPLETE! 🛡️       ║
║                                                          ║
║            LifeSync AI is now protected by:              ║
║                                                          ║
║  ✅ DDoS Protection (Auto)                               ║
║  ✅ Web Application Firewall (WAF)                       ║
║  ✅ Bot Fight Mode                                       ║
║  ✅ SSL/TLS Full (strict)                                ║
║  ✅ Rate Limiting (Backend)                              ║
║  ✅ Firewall Rules (3 active)                            ║
║  ✅ Real-time Monitoring                                 ║
║  ✅ Email Alerts                                         ║
║                                                          ║
║         Your IP is now hidden behind Cloudflare!         ║
║                   Hackers CANNOT find you! 🚀            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Setup by:** Trần Đình Bảo Khang  
**Date:** [Your Date]  
**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY

---

## 📞 Support & Resources

**Cloudflare Docs:**
- https://developers.cloudflare.com/

**Community:**
- https://community.cloudflare.com/

**LifeSync AI:**
- GitHub: [your-repo]
- Email: trandinhbaokhang@example.com

---

**Lưu ý:** Checklist này cho **Free Plan**. Nếu nâng cấp lên Pro/Business, sẽ có thêm nhiều tính năng như Rate Limiting trên Cloudflare, Load Balancing, Advanced DDoS Protection, etc.
