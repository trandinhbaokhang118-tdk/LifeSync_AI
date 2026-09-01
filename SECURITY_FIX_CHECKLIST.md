# ✅ Security Fix Checklist

## 🚨 CRITICAL - Làm ngay lập tức (10 phút)

### 1. Revoke API Keys ⚠️
- [ ] Vào https://platform.openai.com/api-keys
- [ ] Revoke the exposed key in the provider dashboard; never record keys in source files.
- [ ] Vào https://aistudio.google.com/apikey  
- [ ] Revoke key: `AQ.Ab8RN6JVkGiAahIs3582...`
- [ ] Tạo keys mới cho cả 2 services

### 2. Generate New Secrets
```bash
# Generate JWT Secret
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate DB Password
node -e "console.log(require('crypto').randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g,''))"
```

- [ ] Copy JWT secret mới
- [ ] Copy database password mới

### 3. Update .env File
- [ ] Mở `backend/.env`
- [ ] Update `JWT_SECRET` với giá trị mới
- [ ] Update `DATABASE_URL` với password mới
- [ ] Update `OPENAI_API_KEY` với key mới
- [ ] Update `GEMINI_API_KEY` với key mới
- [ ] Save file

### 4. Update Database Password
```bash
# Login to MySQL
mysql -u root -p

# Change password
ALTER USER 'tm_user'@'localhost' IDENTIFIED BY 'NEW_PASSWORD';
FLUSH PRIVILEGES;
exit;
```

- [ ] Đổi password trong MySQL
- [ ] Test connection

### 5. Verify .gitignore
```bash
# Check if .env is ignored
git status

# Should NOT see .env in the list
```

- [ ] Verify `.env` không xuất hiện trong `git status`
- [ ] Nếu xuất hiện, add vào .gitignore:
  ```bash
  echo .env >> .gitignore
  echo backend/.env >> .gitignore
  ```

---

## 🟡 MEDIUM - Làm trong tuần này (1 giờ)

### 6. Remove Sensitive console.log
- [ ] Review `backend/src/auth/auth.controller.ts`
- [ ] Remove hoặc mask IP logs
- [ ] Review `frontend/src/lib/debug.ts`
- [ ] Remove token logs trong production

### 7. Setup Redis for OTP (Optional)
- [ ] Install Redis: `npm install ioredis`
- [ ] Update `auth.service.ts` để dùng Redis thay vì Map
- [ ] Test OTP flow

### 8. Test Security
- [ ] Test rate limiting (5 login attempts → blocked)
- [ ] Test JWT expiry (expired token → 401)
- [ ] Test SQL injection (should fail)
- [ ] Test XSS (should be sanitized)

---

## 🟢 NICE TO HAVE - Tương lai

### 9. Additional Security
- [ ] Implement 2FA
- [ ] Add email verification
- [ ] Setup security audit logs
- [ ] Add account lockout after failed logins
- [ ] Implement CSRF protection

### 10. Setup Cloudflare (30 phút)
- [ ] Follow `CLOUDFLARE_QUICK_CHECKLIST.md`
- [ ] Setup DNS
- [ ] Enable WAF
- [ ] Enable Bot Fight Mode
- [ ] Setup Firewall Rules
- [ ] Test everything

---

## ✅ Verification

Sau khi hoàn thành tất cả critical fixes:

### Test 1: Secrets Changed
```bash
# Check JWT secret is different
grep JWT_SECRET backend/.env
# Should be 128 characters long
```

### Test 2: Application Works
```bash
cd backend
npm run start:dev

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@demo.com","password":"user123"}'
```

### Test 3: Git Status Clean
```bash
git status
# Should NOT show .env file
```

### Test 4: Rate Limiting Works
```bash
# Send 10 login requests
# Should be blocked after 5 attempts
```

---

## 📊 Progress Tracker

```
Critical Issues: [  ] 0/5 Fixed
Medium Issues:   [  ] 0/2 Fixed
Nice to Have:    [  ] 0/5 Completed

Overall Progress: [          ] 0%
```

Update this as you complete each item!

---

## 🎯 Target

- **Critical:** 100% trong 1 giờ
- **Medium:** 100% trong 1 tuần  
- **Nice to Have:** 50% trong 1 tháng

---

## 📞 Need Help?

Nếu gặp vấn đề khi fix:
1. Đọc `SECURITY_AUDIT_REPORT.md` để hiểu chi tiết
2. Google error message
3. Hỏi trên GitHub Issues
4. Email: trandinhbaokhang@example.com

---

**Good luck! 🚀**
