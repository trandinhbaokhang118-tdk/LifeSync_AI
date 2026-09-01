# Deploy Backend lên Render

## Bước 1: Tạo tài khoản Render
1. Vào https://render.com đăng ký tài khoản (dùng GitHub)
2. Click "New +" → "Web Service"

## Bước 2: Kết nối GitHub
1. Chọn repository `LifeSync AI_React`
2. Chọn branch `main`
3. Cấu hình:
   - **Name:** `lifesync-ai-api`
   - **Region:** Singapore (gần Việt Nam)
   - **Environment:** Node
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm run start:prod`

## Bước 3: Cấu hình Environment Variables
Thêm các biến môi trường:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://user:password@host:3306/lifesync_ai
JWT_SECRET=your-secret-key-min-32-chars-long!
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=https://lifesync-ai-app.onrender.com
OPENAI_API_KEY=sk-your-openai-key
```

## Bước 4: Tạo Database MySQL
1. Vào Render Dashboard
2. Click "New +" → "PostgreSQL" (hoặc dùng MySQL riêng)
3. Lấy connection string điền vào DATABASE_URL

## Bước 5: Deploy
1. Click "Create Web Service"
2. Đợi build xong (khoảng 5-10 phút)
3. Copy URL (vd: `https://lifesync-ai-api.onrender.com`)

---

# Build APK

## Bước 1: Cập nhật API URL
Sau khi có URL backend, cập nhật file `.env`:

```env
VITE_API_URL=https://lifesync-ai-api.onrender.com
```

## Bước 2: Build frontend
```bash
cd frontend
npm run build
```

## Bước 3: Sync với Capacitor
```bash
npx capacitor sync android
```

## Bước 4: Build APK
```bash
cd android
./gradlew assembleDebug
```

Hoặc chạy script có sẵn:
```bash
build-apk.bat
```

## Bước 5: Lấy APK
File APK sẽ nằm ở:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

## Bước 6: Cài đặt trên điện thoại
1. Gửi file APK qua email hoặc cloud
2. Trên điện thoại: Settings → Bảo mật → Cho phép cài đặt từ nguồn không xác định
3. Mở file APK và cài đặt
