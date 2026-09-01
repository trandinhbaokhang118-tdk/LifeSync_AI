# 📱 Hướng dẫn Setup Capacitor - Chuyển Web thành Mobile App

## 🎯 Tổng quan

Capacitor cho phép wrap web app React hiện tại thành native mobile app mà không cần viết lại code.

## 📋 Yêu cầu

### Phần mềm cần cài:
1. **Node.js 18+** ✅ (đã có)
2. **Android Studio** ❌ (cần cài)
3. **JDK 11+** ❌ (cần cài)

### Download:
- **Android Studio**: https://developer.android.com/studio
- **JDK**: https://adoptium.net/ (chọn JDK 17)

---

## 🚀 Bước 1: Cài đặt Android Studio

### 1.1 Download và cài đặt
1. Download Android Studio: https://developer.android.com/studio
2. Chạy installer
3. Chọn "Standard" installation
4. Đợi download SDK components (~3GB)

### 1.2 Cài Android SDK
1. Mở Android Studio
2. More Actions → SDK Manager
3. Tick các items:
   - ✅ Android 13.0 (API 33)
   - ✅ Android 12.0 (API 31)
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Tools
4. Click "Apply" và đợi download

### 1.3 Setup Environment Variables
```bash
# Thêm vào System Environment Variables:
ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x

# Thêm vào PATH:
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

### 1.4 Kiểm tra
```bash
# Mở CMD mới và chạy:
java -version
# Output: openjdk version "17.0.x"

adb version
# Output: Android Debug Bridge version x.x.x
```

---

## 🚀 Bước 2: Setup Capacitor

### 2.1 Chạy script tự động
```bash
setup-mobile-app.bat
```

### 2.2 Hoặc setup thủ công:

```bash
# 1. Cài Capacitor
cd frontend
npm install @capacitor/core @capacitor/cli

# 2. Khởi tạo
npx cap init LifeSyncAI com.lifesyncai.app --web-dir=dist

# 3. Thêm Android platform
npm install @capacitor/android
npx cap add android

# 4. Cài plugins
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/storage
npm install @capacitor/app
npm install @capacitor/haptics
npm install @capacitor/status-bar
npm install @capacitor/splash-screen

# 5. Build web app
npm run build

# 6. Sync
npx cap sync
```

---

## 🚀 Bước 3: Cấu hình Capacitor

### 3.1 Tạo file capacitor.config.ts

```typescript
// frontend/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifesyncai.app',
  appName: 'LifeSync AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP for development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F1520',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
    },
  },
};

export default config;
```

### 3.2 Update package.json

```json
{
  "scripts": {
    "android": "cap run android",
    "android:build": "npm run build && cap sync && cap open android",
    "android:sync": "cap sync android"
  }
}
```

---

## 🚀 Bước 4: Optimize cho Mobile

### 4.1 Update vite.config.ts

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from mobile
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

### 4.2 Update index.html

```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0F1520" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>LifeSync AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 4.3 Thêm Capacitor vào main.tsx

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import Capacitor
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Setup native features
if (Capacitor.isNativePlatform()) {
  // Hide splash screen after app loads
  SplashScreen.hide();
  
  // Set status bar style
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0F1520' });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 🚀 Bước 5: Chạy trên Android

### 5.1 Mở Android Studio
```bash
cd frontend
npx cap open android
```

### 5.2 Đợi Gradle Sync
- Lần đầu sẽ mất 5-10 phút
- Download dependencies
- Build project

### 5.3 Tạo Virtual Device (Emulator)
1. Tools → Device Manager
2. Create Device
3. Chọn: Pixel 5 (hoặc bất kỳ)
4. System Image: Android 13 (API 33)
5. Finish

### 5.4 Run App
1. Chọn device (emulator hoặc real device)
2. Click ▶️ Run button
3. Đợi app build và install
4. App sẽ tự động mở

---

## 🚀 Bước 6: Build APK/AAB

### 6.1 Generate Signing Key

```bash
# Tạo keystore file
keytool -genkey -v -keystore lifesync-ai-release.keystore -alias lifesyncai -keyalg RSA -keysize 2048 -validity 10000

# Nhập thông tin:
# Password: [your-password]
# Name: Tran Dinh Bao Khang
# Organization: LifeSync AI
# City: Ho Chi Minh
# State: HCM
# Country: VN
```

### 6.2 Config Signing

Tạo file `android/key.properties`:
```properties
storePassword=[your-password]
keyPassword=[your-password]
keyAlias=lifesyncai
storeFile=../lifesync-ai-release.keystore
```

Update `android/app/build.gradle`:
```gradle
android {
    ...
    
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("key.properties")
            def keystoreProperties = new Properties()
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6.3 Build Release

#### APK (for testing):
```bash
cd frontend/android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### AAB (for Google Play):
```bash
cd frontend/android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🚀 Bước 7: Test APK

### 7.1 Install trên device
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 7.2 Test checklist
- [ ] App mở được
- [ ] Login/Register hoạt động
- [ ] Dashboard hiển thị đúng
- [ ] Tasks CRUD hoạt động
- [ ] Calendar view OK
- [ ] Focus timer chạy
- [ ] Notifications hoạt động
- [ ] Dark mode toggle
- [ ] Offline mode (tắt wifi)
- [ ] Không crash

---

## 🎨 Bước 8: Tạo App Assets

### 8.1 App Icon

Tạo icon 1024x1024px, sau đó dùng tool:
- https://icon.kitchen/
- https://appicon.co/

Hoặc dùng Android Studio:
1. Right-click `res` folder
2. New → Image Asset
3. Icon Type: Launcher Icons
4. Path: chọn icon 1024x1024px
5. Generate

### 8.2 Splash Screen

Tạo file `android/app/src/main/res/drawable/splash.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>
```

---

## 📱 Bước 9: Thêm Native Features

### 9.1 Push Notifications

```typescript
// src/services/notifications.ts
import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications() {
  // Request permission
  const result = await PushNotifications.requestPermissions();
  
  if (result.receive === 'granted') {
    await PushNotifications.register();
  }
  
  // Listen for token
  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // Send to backend
  });
  
  // Listen for notifications
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });
}
```

### 9.2 Local Notifications

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

export async function scheduleReminder(task: Task) {
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Task Reminder',
        body: task.title,
        id: task.id,
        schedule: { at: new Date(task.dueDate) },
      },
    ],
  });
}
```

### 9.3 Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function vibrate() {
  Haptics.impact({ style: ImpactStyle.Medium });
}
```

---

## 🐛 Troubleshooting

### Lỗi: "SDK location not found"
```bash
# Tạo file android/local.properties
sdk.dir=C:\\Users\\[YourUsername]\\AppData\\Local\\Android\\Sdk
```

### Lỗi: "Gradle sync failed"
```bash
# Xóa cache và rebuild
cd frontend/android
./gradlew clean
./gradlew build
```

### Lỗi: "JAVA_HOME not set"
```bash
# Set environment variable
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.x"
```

### App crash khi mở
- Check logs: `adb logcat`
- Check API URL trong .env
- Check CORS settings trên backend

---

## 📊 Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
```

### 2. Image Optimization
- Dùng WebP format
- Lazy load images
- Compress images

### 3. Bundle Size
```bash
# Analyze bundle
npm run build -- --analyze
```

### 4. Caching
- Service Worker
- LocalStorage
- IndexedDB

---

## 🚀 Next Steps

1. ✅ Setup Capacitor
2. ✅ Build APK
3. ✅ Test trên device
4. ⏳ Tạo assets (icon, screenshots)
5. ⏳ Viết store listing
6. ⏳ Upload lên Google Play Console
7. ⏳ Submit for review

Bạn đã sẵn sàng chưa? Chạy `setup-mobile-app.bat` để bắt đầu!
