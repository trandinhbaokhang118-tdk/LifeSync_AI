# 🛡️ Kiến trúc Bảo mật LifeSync AI với Cloudflare

## 🏗️ Tổng quan Kiến trúc Bảo mật

```
                        🌍 INTERNET (HACKERS)
                                │
                                │ Attack Attempts
                                ▼
        ╔═══════════════════════════════════════════╗
        ║                                           ║
        ║         🌐 CLOUDFLARE NETWORK             ║
        ║         (Global Edge Network)             ║
        ║                                           ║
        ║  ┌─────────────────────────────────────┐ ║
        ║  │    🛡️ DDoS Protection (Layer 3/4)    │ ║
        ║  │    • Auto-mitigation                 │ ║
        ║  │    • Terabit-scale capacity          │ ║
        ║  └─────────────────────────────────────┘ ║
        ║                 │                         ║
        ║  ┌─────────────────────────────────────┐ ║
        ║  │    🔥 Web Application Firewall       │ ║
        ║  │    • OWASP Top 10 protection         │ ║
        ║  │    • SQL Injection blocking          │ ║
        ║  │    • XSS prevention                  │ ║
        ║  └─────────────────────────────────────┘ ║
        ║                 │                         ║
        ║  ┌─────────────────────────────────────┐ ║
        ║  │    🤖 Bot Fight Mode                 │ ║
        ║  │    • Block malicious bots            │ ║
        ║  │    • Challenge suspicious traffic    │ ║
        ║  │    • Allow verified bots             │ ║
        ║  └─────────────────────────────────────┘ ║
        ║                 │                         ║
        ║  ┌─────────────────────────────────────┐ ║
        ║  │    🚦 Firewall Rules                 │ ║
        ║  │    • IP blocking/allowing            │ ║
        ║  │    • Geographic filtering            │ ║
        ║  │    • User-Agent filtering            │ ║
        ║  │    • Threat score blocking           │ ║
        ║  └─────────────────────────────────────┘ ║
        ║                 │                         ║
        ║  ┌─────────────────────────────────────┐ ║
        ║  │    🔒 SSL/TLS Encryption             │ ║
        ║  │    • Full (strict) mode              │ ║
        ║  │    • HTTPS redirect                  │ ║
        ║  │    • HSTS enforcement                │ ║
        ║  └─────────────────────────────────────┘ ║
        ║                 │                         ║
        ║                 │ ✅ Clean Traffic         ║
        ╚═══════════════════════════════════════════╝
                          │
                          │ CF-Connecting-IP
                          │ CF-Ray
                          ▼
        ┌─────────────────────────────────────────┐
        │                                         │
        │       🖥️ YOUR SERVER (IP HIDDEN)        │
        │                                         │
        │  ┌───────────────────────────────────┐ │
        │  │    ⚡ NestJS Backend               │ │
        │  │                                   │ │
        │  │  ┌─────────────────────────────┐ │ │
        │  │  │  🛡️ Helmet (Security Headers)│ │ │
        │  │  │  • X-Frame-Options          │ │ │
        │  │  │  • Content-Security-Policy  │ │ │
        │  │  │  • X-Content-Type-Options   │ │ │
        │  │  └─────────────────────────────┘ │ │
        │  │             │                     │ │
        │  │  ┌─────────────────────────────┐ │ │
        │  │  │  ⏱️ Rate Limiting            │ │ │
        │  │  │  • Login: 5/15min           │ │ │
        │  │  │  • Register: 3/hour         │ │ │
        │  │  │  • API: 100/15min           │ │ │
        │  │  └─────────────────────────────┘ │ │
        │  │             │                     │ │
        │  │  ┌─────────────────────────────┐ │ │
        │  │  │  🔐 JWT Auth                │ │ │
        │  │  │  • Access tokens (15min)    │ │ │
        │  │  │  • Refresh tokens (7 days)  │ │ │
        │  │  └─────────────────────────────┘ │ │
        │  │             │                     │ │
        │  │  ┌─────────────────────────────┐ │ │
        │  │  │  👥 RBAC                    │ │ │
        │  │  │  • USER role                │ │ │
        │  │  │  • ADMIN role               │ │ │
        │  │  └─────────────────────────────┘ │ │
        │  │             │                     │ │
        │  │  ┌─────────────────────────────┐ │ │
        │  │  │  ✅ Input Validation        │ │ │
        │  │  │  • DTOs with class-validator│ │ │
        │  │  │  • Whitelist strategy       │ │ │
        │  │  └─────────────────────────────┘ │ │
        │  │             │                     │ │
        │  └───────────────────────────────────┘ │
        │                │                        │
        │  ┌───────────────────────────────────┐ │
        │  │    🗄️ Prisma ORM                  │ │
        │  │    • SQL injection prevention     │ │
        │  │    • Parameterized queries        │ │
        │  └───────────────────────────────────┘ │
        │                │                        │
        └─────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────────┐
        │        🗃️ MySQL Database                │
        │        • Encrypted connections          │
        │        • Strong passwords               │
        │        • Limited access                 │
        └─────────────────────────────────────────┘
```

---

## 🔄 Request Flow với Bảo mật

### Normal User Request (Successful)

```
1. User Browser
   │
   └─→ HTTPS Request (https://lifesync-ai.com/api/tasks)
       │
       ▼
2. Cloudflare Edge Server
   │
   ├─→ ✅ DDoS Check: OK (normal traffic pattern)
   ├─→ ✅ WAF Check: OK (no malicious payload)
   ├─→ ✅ Bot Check: OK (verified browser)
   ├─→ ✅ Firewall Rules: OK (not in blocklist)
   ├─→ ✅ SSL/TLS: Decrypt → Re-encrypt
   ├─→ 📝 Add headers: CF-Connecting-IP, CF-Ray
   │
   └─→ Forward to Origin Server
       │
       ▼
3. NestJS Backend
   │
   ├─→ ✅ Helmet: Add security headers
   ├─→ ✅ Rate Limit: 45/100 requests (OK)
   ├─→ ✅ CORS: Origin allowed
   ├─→ ✅ JWT Auth: Valid token
   ├─→ ✅ RBAC: User has access
   ├─→ ✅ Input Validation: Valid DTO
   │
   └─→ Process Request
       │
       ▼
4. Database Query
   │
   ├─→ ✅ Prisma: Safe parameterized query
   │
   └─→ Return Data
       │
       ▼
5. Response
   │
   ├─→ Add security headers
   ├─→ Encrypt with TLS
   │
   └─→ Return via Cloudflare → User
       │
       ▼
   ✅ Success Response (200 OK)
```

### Malicious Attack (Blocked)

```
1. Hacker Bot
   │
   └─→ Attack Request (SQL injection attempt)
       │
       ▼
2. Cloudflare Edge Server
   │
   ├─→ ❌ Bot Check: DETECTED (suspicious user-agent: "sqlmap")
   │
   └─→ ⛔ BLOCKED (403 Forbidden)
       │
       ▼
   🛡️ Attack Logged in Firewall Events
   📧 Email Alert sent to admin
   
   SERVER NEVER TOUCHED! ✅
```

### Brute Force Login Attack (Blocked)

```
1. Attacker
   │
   └─→ Rapid login attempts (100 requests in 1 minute)
       │
       ▼
2. Cloudflare Edge Server
   │
   ├─→ ✅ Pass (no obvious attack signature yet)
   │
   └─→ Forward to Backend
       │
       ▼
3. NestJS Backend - Rate Limiter
   │
   ├─→ Attempt 1: ✅ OK (1/5)
   ├─→ Attempt 2: ✅ OK (2/5)
   ├─→ Attempt 3: ✅ OK (3/5)
   ├─→ Attempt 4: ✅ OK (4/5)
   ├─→ Attempt 5: ✅ OK (5/5)
   ├─→ Attempt 6: ❌ BLOCKED (HTTP 429)
   │   "Too many login attempts, please try again after 15 minutes"
   │
   └─→ ⛔ All subsequent requests blocked for 15 minutes
       │
       ▼
   🛡️ Brute force prevented!
   📝 IP logged for investigation
```

### DDoS Attack (Auto-mitigated)

```
1. Botnet (100,000 bots)
   │
   └─→ Flood attack (1 million requests/second)
       │
       ▼
2. Cloudflare Global Network
   │
   ├─→ 🔍 Detect abnormal traffic spike
   ├─→ 🛡️ Analyze patterns (Layer 3/4/7)
   ├─→ ⚡ Auto-enable advanced DDoS protection
   ├─→ 🚫 Challenge suspicious IPs with CAPTCHA
   ├─→ 🚫 Block confirmed malicious IPs
   ├─→ 📊 Distribute legitimate traffic across edge
   │
   └─→ ✅ Only clean traffic reaches server
       │
       ▼
   🎉 Server running normally!
   📧 Admin notified of attack
   📊 Attack metrics in dashboard
```

---

## 🛡️ Defense Layers

### Layer 1: Cloudflare Edge Network
```
Threats Blocked:
├─ DDoS attacks (Layer 3/4/7)
├─ SQL injection attempts
├─ XSS attacks
├─ CSRF attacks
├─ Malicious bots
├─ Bad IPs (threat database)
├─ Suspicious countries (optional)
└─ Invalid SSL/TLS

Tools:
├─ DDoS Protection (auto)
├─ Web Application Firewall (WAF)
├─ Bot Fight Mode
├─ Firewall Rules
├─ SSL/TLS encryption
└─ Rate limiting (Pro plan)
```

### Layer 2: Backend Application
```
Threats Blocked:
├─ Brute force attacks
├─ Excessive API calls
├─ Unauthorized access
├─ Invalid input
├─ Missing authentication
└─ Insufficient permissions

Tools:
├─ Express Rate Limiting
├─ Helmet (security headers)
├─ JWT authentication
├─ RBAC (role-based access)
├─ Input validation (DTOs)
└─ CORS policy
```

### Layer 3: Database Layer
```
Threats Blocked:
├─ SQL injection
├─ Unauthorized queries
├─ Data tampering
└─ Direct access

Tools:
├─ Prisma ORM (parameterized queries)
├─ Connection encryption
├─ User permissions
└─ Audit logging
```

---

## 🎯 Attack Scenarios & Responses

### Scenario 1: SQL Injection Attack
```
Attack:
POST /api/auth/login
Body: { "email": "admin' OR '1'='1", "password": "anything" }

Defense:
1. Cloudflare WAF: Detects SQL pattern → Block (403)
2. If passed: Prisma ORM uses parameterized queries → Safe
3. If passed: No user found → Invalid credentials (401)

Result: ✅ Attack blocked at Layer 1
```

### Scenario 2: Brute Force Login
```
Attack:
100 rapid POST requests to /api/auth/login

Defense:
1. Cloudflare: Passes (looks like normal POST requests)
2. Backend Rate Limiter: Blocks after 5 attempts → 429
3. IP logged for investigation

Result: ✅ Attack blocked at Layer 2
```

### Scenario 3: DDoS Attack (1M req/sec)
```
Attack:
Massive traffic flood from botnet

Defense:
1. Cloudflare DDoS Protection: 
   - Auto-detects attack pattern
   - Challenges with CAPTCHA
   - Blocks malicious IPs
   - Server never overwhelmed

Result: ✅ Attack mitigated at Layer 1
```

### Scenario 4: XSS Attack
```
Attack:
POST /api/tasks/create
Body: { "title": "<script>alert('xss')</script>" }

Defense:
1. Cloudflare WAF: Detects script tags → Challenge/Block
2. If passed: Input validation (class-validator) → Strip tags
3. If passed: Frontend sanitization → Render safely

Result: ✅ Multiple layers of protection
```

### Scenario 5: Unauthorized Admin Access
```
Attack:
GET /api/admin/users (without admin token)

Defense:
1. Cloudflare Firewall: Allow (IP not blocked)
2. Backend JWT Auth: No token → 401 Unauthorized
3. If token exists: RBAC Guard → User not admin → 403 Forbidden

Result: ✅ Attack blocked at Layer 2
```

---

## 📊 Monitoring & Alerts

### Cloudflare Dashboard
```
Real-time Metrics:
├─ Total requests
├─ Threats blocked
├─ Bandwidth saved
├─ Top attacking countries
├─ Top attacking IPs
├─ Attack types distribution
└─ Performance metrics

Alerts:
├─ DDoS attack detected
├─ Traffic spike anomaly
├─ High threat score IPs
├─ SSL certificate expiring
└─ Health check failures
```

### Backend Logs
```
Logged Events:
├─ Failed login attempts (with IP)
├─ Rate limit violations (with IP)
├─ JWT validation failures
├─ RBAC access denials
├─ Input validation errors
└─ Database errors

Tools:
├─ NestJS Logger
├─ Custom logging interceptor
├─ Error tracking (optional: Sentry)
└─ Log aggregation (optional: ELK)
```

---

## 🔒 Best Practices Summary

### ✅ DO
1. ✅ Bật Cloudflare Proxy (Orange Cloud)
2. ✅ Use SSL Full (strict) mode
3. ✅ Enable HSTS with long max-age
4. ✅ Activate Bot Fight Mode
5. ✅ Setup WAF Managed Rules
6. ✅ Create Firewall Rules for admin panel
7. ✅ Implement backend rate limiting
8. ✅ Use strong JWT secrets
9. ✅ Validate all inputs
10. ✅ Monitor logs daily
11. ✅ Setup email alerts
12. ✅ Keep dependencies updated

### ❌ DON'T
1. ❌ Expose real server IP
2. ❌ Use SSL Flexible mode
3. ❌ Disable Cloudflare proxy
4. ❌ Ignore Firewall Events
5. ❌ Use weak passwords
6. ❌ Trust user input
7. ❌ Store passwords in plain text
8. ❌ Log sensitive data
9. ❌ Ignore security updates
10. ❌ Skip testing security features

---

## 🎓 Conclusion

Với kiến trúc bảo mật nhiều lớp này, LifeSync AI được bảo vệ toàn diện:

**Cloudflare Edge (Layer 1):**
- Ẩn IP server thật
- Chặn DDoS, bot, malicious requests
- WAF chống common attacks
- SSL/TLS encryption

**Backend Application (Layer 2):**
- Rate limiting chống brute force
- JWT authentication
- RBAC authorization
- Input validation
- Security headers

**Database (Layer 3):**
- ORM với parameterized queries
- Encrypted connections
- Limited access

**Result:** 🛡️ Production-ready security cho khóa luận và real-world deployment!

---

**Created by:** Trần Đình Bảo Khang  
**Date:** July 2026  
**Version:** 1.0.0
