# Deployment Guide
# LifeSync AI Application

## 1. Prerequisites

### Required software
- Node.js 18 or newer
- npm 9 or newer
- Docker Desktop
- Git
- Android Studio + JDK 17 for Android release builds

### Quick verification
```bash
node --version
npm --version
docker --version
java --version
```

## 2. Local Setup

### 2.1 Clone repository
```bash
git clone <repository-url>
cd time-manager
```

### 2.2 Start MySQL + phpMyAdmin
```bash
docker compose up -d
docker ps
docker exec -it lifesync_ai_mysql mysql -u tm_user -ptm_password -D lifesync_ai -e "SELECT VERSION();"
```

### 2.3 Configure backend
```bash
cd backend
npm install
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/Mac

npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run create-admin      # Optional: create your own admin account
npm run dev
```

Backend:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`
- Health: `http://localhost:3000/health`

### 2.4 Configure frontend
```bash
cd frontend
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/Mac

npm install
npm run dev
```

Frontend:
- Web app: `http://localhost:5173`

## 3. Environment Variables

### Backend `.env`
```env
DATABASE_URL="mysql://tm_user:tm_password@localhost:3306/lifesync_ai"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
OPENAI_API_KEY=""
PAYMENTS_ENABLED="false"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_REDIRECT_URI="http://localhost:3000/auth/facebook/callback"
FACEBOOK_API_VERSION="v25.0"
```

### Frontend `.env`
```env
VITE_API_URL="http://localhost:3000"
VITE_PAYMENTS_ENABLED="false"
```

## 4. Quality Gates Before Handoff

### Backend
```bash
cd backend
npm run lint
npx jest --runInBand
npx jest --config ./test/jest-e2e.json --runInBand
npm run build
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

## 5. Web Deployment

### 5.1 Render deployment
Repo includes [render.yaml](../backend/render.yaml) for:
- `time-manager-api` (Node web service)
- `time-manager-frontend` (static site)

Important deployment notes:
- Backend health check uses `/health`
- Backend start command runs `npx prisma migrate deploy && npm run start:prod`
- You must provide a valid MySQL `DATABASE_URL`
- OAuth callback URLs must match the public backend URL

### 5.2 Required production environment values

Backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `PAYMENTS_ENABLED=false` unless a real provider integration has been completed
- `OPENAI_API_KEY` if AI chat is enabled
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` if Google login is enabled
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_REDIRECT_URI`, `FACEBOOK_API_VERSION` if Facebook login is enabled

Frontend:
- `VITE_API_URL`
- `VITE_PAYMENTS_ENABLED=false` unless checkout is fully integrated

Billing note:
- This repository is safe to deploy with billing disabled.
- Do not turn on `PAYMENTS_ENABLED` or `VITE_PAYMENTS_ENABLED` until Stripe/VNPay/MoMo/ZaloPay integration and webhook verification are implemented.

### 5.3 Manual Node deployment
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:prod
```

```bash
cd frontend
npm install
npm run build
npm run preview
```

## 6. Android App Deployment

### 6.1 Prepare Android project
```bash
cd frontend
npm install
npm run build
npx cap sync android
```

### 6.2 Optional release signing
Copy `frontend/android/key.properties.example` to `frontend/android/key.properties`:
```properties
storePassword=your-password
keyPassword=your-password
keyAlias=lifesyncai
storeFile=lifesync-ai-release.keystore
```

Place `lifesync-ai-release.keystore` inside `frontend/android/`.
If Android Studio cannot find the SDK, copy `frontend/android/local.properties.example` to `frontend/android/local.properties` and update the SDK path.

### 6.3 Build release APK / AAB
From repo root:
```bash
build-apk.bat
build-aab.bat
```

Outputs:
- APK: `frontend/android/app/build/outputs/apk/release/app-release.apk`
- AAB: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

### 6.4 Play Store checklist
Before publishing:
- Valid signing key
- Privacy policy URL
- Store listing assets
- Google Play developer account
- Real production API URL in mobile build

## 7. Database Operations

### Backup
```bash
docker exec lifesync_ai_mysql mysqldump -u tm_user -ptm_password lifesync_ai > backup.sql
```

### Restore
```bash
docker exec -i lifesync_ai_mysql mysql -u tm_user -ptm_password lifesync_ai < backup.sql
```

### Prisma helpers
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
npx prisma studio
```

## 8. Health Checks

### Backend
```bash
curl http://localhost:3000/health
```

Expected response shape:
```json
{
  "data": {
    "ok": true,
    "status": "ok",
    "service": "time-manager-backend"
  }
}
```

### Database
```bash
docker exec lifesync_ai_mysql mysqladmin ping -h localhost -u tm_user -ptm_password
```

## 9. Troubleshooting

### Backend cannot connect to MySQL
- Confirm `docker compose up -d` completed successfully
- Check `DATABASE_URL`
- Check MySQL container logs with `docker logs lifesync_ai_mysql`

### Prisma migration fails
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Frontend cannot reach backend
- Verify `VITE_API_URL`
- Verify backend CORS `FRONTEND_URL`
- Confirm backend health endpoint responds

### Android release build fails
- Install JDK 17
- Verify Android SDK path in `frontend/android/local.properties`
- Verify `key.properties` and keystore path for signed release builds

## 10. CI

GitHub Actions workflow is available at:
- `.github/workflows/ci.yml`

It runs:
- Backend lint
- Backend unit tests
- Backend e2e tests
- Backend build
- Frontend lint
- Frontend build
