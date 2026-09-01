# HƯỚNG DẪN DEPLOY PRODUCTION - LIFESYNC AI

**Target Environment:** Production  
**Version:** 1.0.0  
**Last Updated:** June 20, 2026

---

## TỔNG QUAN

Hướng dẫn này mô tả chi tiết cách deploy LifeSync AI lên môi trường production với:
- ✅ Backend trên Railway/Render
- ✅ Frontend trên Vercel/Netlify
- ✅ Database trên PlanetScale/Railway
- ✅ CDN và SSL/TLS
- ✅ Monitoring và logging

---

## 1. CHUẨN BỊ

### 1.1 Checklist trước khi deploy

- [ ] ✅ All tests pass locally
- [ ] ✅ Production build success
- [ ] ✅ Environment variables documented
- [ ] ✅ Database migrations ready
- [ ] ✅ Security audit complete
- [ ] ✅ Performance optimized
- [ ] ✅ Backup strategy defined
- [ ] ✅ Rollback plan ready

### 1.2 Tài khoản cần thiết

**Backend & Database:**
- [ ] Railway account (hoặc Render)
- [ ] PlanetScale account (hoặc Railway MySQL)

**Frontend:**
- [ ] Vercel account (hoặc Netlify)

**Monitoring (Optional):**
- [ ] Sentry account (error tracking)
- [ ] LogRocket account (session replay)

**Domain:**
- [ ] Domain name registered
- [ ] DNS management access

---

## 2. DEPLOYMENT BACKEND

### 2.1 Option A: Deploy trên Railway (Recommended)

**Bước 1: Tạo project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init
```

**Bước 2: Cấu hình database**
```bash
# Add MySQL database
railway add

# Select: MySQL

# Get database URL
railway variables
# Copy DATABASE_URL
```

**Bước 3: Set environment variables**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=<your-secret-256-bit>
railway variables set REFRESH_TOKEN_SECRET=<different-secret>
railway variables set OPENAI_API_KEY=<your-openai-key>
railway variables set FRONTEND_URL=<your-frontend-url>
```

**Bước 4: Deploy**
```bash
# Deploy
railway up

# Check status
railway status

# View logs
railway logs
```

**Bước 5: Run migrations**
```bash
# SSH into Railway
railway run

# Run Prisma migrations
npx prisma migrate deploy

# Create admin user
npm run create-admin
```

**Bước 6: Get production URL**
```bash
railway open
# Copy the URL (e.g., https://your-app.railway.app)
```

---

### 2.2 Option B: Deploy trên Render

**Bước 1: Connect GitHub**
1. Push code lên GitHub
2. Đăng nhập Render.com
3. New > Web Service
4. Connect GitHub repository

**Bước 2: Configure service**
```
Name: lifesync-backend
Region: Singapore (hoặc gần nhất)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:prod
```

**Bước 3: Add database**
1. Dashboard > New > PostgreSQL (hoặc MySQL nếu có)
2. Copy DATABASE_URL

**Bước 4: Environment variables**
```
NODE_ENV=production
DATABASE_URL=<from-render-database>
JWT_SECRET=<generate-256-bit>
REFRESH_TOKEN_SECRET=<generate-256-bit>
OPENAI_API_KEY=<your-key>
FRONTEND_URL=<your-frontend-url>
PORT=10000
```

**Bước 5: Deploy**
- Nhấn "Create Web Service"
- Đợi deploy hoàn tất (~5-10 phút)
- Check logs

**Bước 6: Run migrations**
```bash
# Render Shell
npx prisma migrate deploy
npm run create-admin
```

---

### 2.3 Database Setup (PlanetScale)

**Tại sao PlanetScale?**
- Serverless MySQL
- Auto-scaling
- Free tier generous
- Branching workflow
- No connection limits

**Setup:**

**Bước 1: Tạo database**
1. Đăng nhập PlanetScale.com
2. New Database > "lifesync-prod"
3. Region: AWS ap-southeast-1 (Singapore)

**Bước 2: Get connection string**
```bash
# Format:
mysql://user:password@host/database?sslaccept=strict
```

**Bước 3: Configure trong Railway/Render**
```
DATABASE_URL=<planetscale-url>
```

**Bước 4: Run migrations**
```bash
# Local với production DB
DATABASE_URL=<prod-url> npx prisma migrate deploy

# Hoặc trong Railway/Render shell
npx prisma migrate deploy
```

**Bước 5: Create admin**
```bash
npm run create-admin
```

---

## 3. DEPLOYMENT FRONTEND

### 3.1 Option A: Deploy trên Vercel (Recommended)

**Bước 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Bước 2: Build local test**
```bash
cd frontend

# Set production API URL
echo VITE_API_URL=https://your-backend.railway.app > .env.production

# Build
npm run build

# Test production build
npm run preview
```

**Bước 3: Deploy lần đầu**
```bash
# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? lifesync-frontend
# - Directory? ./
# - Override settings? No
```

**Bước 4: Set environment variables**
```bash
# Via CLI
vercel env add VITE_API_URL production
# Enter: https://your-backend.railway.app

# Hoặc via Vercel Dashboard:
# Settings > Environment Variables
```

**Bước 5: Deploy production**
```bash
vercel --prod
```

**Bước 6: Configure domain**
```bash
# Vercel Dashboard > Domains
# Add: lifesync.app
# Follow DNS instructions
```

---

### 3.2 Option B: Deploy trên Netlify

**Bước 1: Connect GitHub**
1. Push code lên GitHub
2. Đăng nhập Netlify
3. New site from Git
4. Choose repository

**Bước 2: Configure build**
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

**Bước 3: Environment variables**
```
VITE_API_URL=https://your-backend.railway.app
```

**Bước 4: Deploy**
- Nhấn "Deploy site"
- Đợi build (~2-3 phút)
- Site live at: https://random-name.netlify.app

**Bước 5: Custom domain**
1. Domain settings
2. Add custom domain: lifesync.app
3. Configure DNS

---

## 4. SSL & DOMAIN

### 4.1 SSL Certificates

**Vercel/Netlify/Railway:**
- ✅ Auto SSL (Let's Encrypt)
- ✅ Auto-renewal
- ✅ Miễn phí

**Không cần cấu hình thêm!**

### 4.2 Domain Configuration

**DNS Records:**

```dns
# Frontend (Vercel)
A    @       76.76.21.21
CNAME www    cname.vercel-dns.com

# Backend (Railway)
CNAME api    your-app.railway.app

# Or use A record:
A    api     <railway-ip>
```

**Subdomain structure:**
- `lifesync.app` → Frontend
- `www.lifesync.app` → Frontend (redirect)
- `api.lifesync.app` → Backend

---

## 5. ENVIRONMENT VARIABLES

### 5.1 Backend (.env.production)

```bash
# Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://user:pass@host:3306/db?sslaccept=strict

# JWT
JWT_SECRET=<256-bit-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<different-256-bit-secret>
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://lifesync.app
CORS_ORIGINS=https://lifesync.app,https://www.lifesync.app

# OpenAI
OPENAI_API_KEY=sk-...

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@lifesync.app
SMTP_PASS=<app-password>

# Monitoring (Optional)
SENTRY_DSN=https://...
```

**Generate secrets:**
```bash
# Generate 256-bit secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5.2 Frontend (.env.production)

```bash
# API
VITE_API_URL=https://api.lifesync.app

# Optional
VITE_SENTRY_DSN=https://...
VITE_GA_TRACKING_ID=G-...
```

---

## 6. MONITORING & LOGGING

### 6.1 Setup Sentry (Error Tracking)

**Backend:**

```bash
npm install @sentry/node
```

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Frontend:**

```bash
npm install @sentry/react
```

```typescript
// frontend/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 6.2 Setup Logging

**Railway/Render:**
- Built-in logging
- Access via: `railway logs` hoặc Render dashboard

**Custom logging:**

```typescript
// backend/src/common/logger.ts
import * as winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
  ],
});
```

### 6.3 Health Checks

**Backend health endpoint:**

```typescript
// backend/src/health/health.controller.ts
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.prisma.$queryRaw`SELECT 1`,
  };
}
```

**Uptime monitoring:**
- UptimeRobot (free)
- Pingdom
- Better Uptime

**Configure:**
- URL: https://api.lifesync.app/health
- Interval: 5 minutes
- Alert: Email/SMS khi down

---

## 7. BACKUP & RECOVERY

### 7.1 Database Backup

**PlanetScale:**
- Auto backups (retention: 7 days free, 30 days paid)
- Manual backup: Dashboard > Backups > Create

**Railway MySQL:**
- Manual backup: `railway run -- mysqldump > backup.sql`
- Schedule via cron job

**Automated backup script:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

# Dump database
mysqldump -h host -u user -p database > $BACKUP_FILE

# Upload to S3/Cloud Storage
aws s3 cp $BACKUP_FILE s3://lifesync-backups/

# Keep only last 30 backups
# ... cleanup logic ...

echo "Backup complete: $BACKUP_FILE"
```

**Cron job:**
```cron
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### 7.2 Recovery Plan

**Trong trường hợp disaster:**

1. **Database loss:**
   - Restore từ latest backup
   - Run migrations nếu cần
   - Verify data integrity

2. **Backend down:**
   - Check Railway/Render status
   - Review logs
   - Rollback nếu cần
   - Scale up resources

3. **Frontend down:**
   - Check Vercel/Netlify status
   - Rollback deploy
   - Check CDN cache

**Rollback:**

```bash
# Railway
railway rollback

# Vercel
vercel rollback <deployment-url>

# Netlify
# Via dashboard > Deploys > Rollback
```

---

## 8. PERFORMANCE OPTIMIZATION

### 8.1 Backend Optimization

**Caching:**

```typescript
// Install redis
npm install @nestjs/cache-manager cache-manager

// Enable caching
@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // items
    }),
  ],
})
```

**Database indexing:**

```prisma
// schema.prisma
model Task {
  id Int @id @default(autoincrement())
  title String
  userId Int
  status String
  
  @@index([userId])
  @@index([status])
  @@index([userId, status])
}
```

**Connection pooling:**

```
DATABASE_URL=mysql://...?connection_limit=10
```

### 8.2 Frontend Optimization

**Already implemented:**
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Tree shaking
- ✅ Minification

**Additional:**

**Image optimization:**
```bash
npm install sharp
```

**Bundle analysis:**
```bash
npm run build -- --mode analyze
```

**CDN:**
- Vercel/Netlify auto CDN
- Cache static assets
- Gzip/Brotli compression

---

## 9. SECURITY HARDENING

### 9.1 Backend Security

**Rate limiting:**

```typescript
// main.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

**Helmet.js:**

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

**CORS:**

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true,
});
```

### 9.2 Environment Secrets

**Không commit:**
- `.env` files
- API keys
- Passwords
- Certificates

**Use:**
- Railway/Render environment variables
- Vercel/Netlify environment variables
- Secret managers (AWS Secrets Manager, etc.)

### 9.3 SSL/TLS

- ✅ HTTPS only
- ✅ HSTS header
- ✅ Secure cookies
- ✅ CSP headers

---

## 10. CI/CD PIPELINE (Optional)

### 10.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Test Backend
        run: |
          cd backend
          npm install
          npm run test:e2e
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 11. POST-DEPLOYMENT

### 11.1 Verification Checklist

- [ ] ✅ Homepage loads
- [ ] ✅ Login/Register works
- [ ] ✅ API endpoints respond
- [ ] ✅ Database connected
- [ ] ✅ SSL certificate valid
- [ ] ✅ Domain resolves correctly
- [ ] ✅ Mobile responsive
- [ ] ✅ No console errors
- [ ] ✅ Health check passing
- [ ] ✅ Monitoring active

### 11.2 Testing Production

```bash
# Test API
curl https://api.lifesync.app/health

# Test Frontend
curl -I https://lifesync.app

# Load testing (optional)
npm install -g artillery
artillery quick --count 10 --num 100 https://api.lifesync.app
```

### 11.3 Monitoring Dashboard

**Check daily:**
- Error rate (Sentry)
- Response time
- Uptime percentage
- Database queries
- User signups
- Active users

---

## 12. MAINTENANCE

### 12.1 Updates

**Dependencies:**
```bash
# Check outdated
npm outdated

# Update
npm update

# Test
npm run test:e2e
npm run build

# Deploy
railway deploy
```

**Database migrations:**
```bash
# Create migration
npx prisma migrate dev --name add_feature

# Deploy to production
npx prisma migrate deploy
```

### 12.2 Scaling

**Horizontal scaling (Railway):**
- Dashboard > Settings > Scale
- Increase replicas

**Vertical scaling:**
- Increase RAM/CPU

**Database scaling:**
- PlanetScale auto-scales
- Or upgrade plan

---

## PHỤLỤC

### A. Cheat Sheet

```bash
# Railway
railway login
railway up
railway logs
railway run <command>
railway variables set KEY=value

# Vercel
vercel login
vercel
vercel --prod
vercel logs

# Prisma
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

### B. Troubleshooting

**Build fails:**
- Check Node.js version
- Clear cache: `npm ci`
- Check environment variables

**Database connection fails:**
- Verify DATABASE_URL
- Check IP whitelist
- Test connection locally

**Site down:**
- Check Railway/Vercel status
- Review logs
- Check DNS propagation

---

**Deployment guide version:** 1.0.0  
**Last updated:** June 20, 2026  
**Maintainer:** Trần Đình Bảo Khang
