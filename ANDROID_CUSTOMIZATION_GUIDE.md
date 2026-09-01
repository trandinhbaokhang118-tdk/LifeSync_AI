# 🎨 Android Customization Guide

## Hướng dẫn chỉnh layout và theme cho mobile app

### 📂 Cấu trúc thư mục quan trọng

```
frontend/android/
├── app/                              ⭐ CHỈNH Ở ĐÂY
│   ├── src/main/
│   │   ├── AndroidManifest.xml      # App config, permissions
│   │   ├── res/
│   │   │   ├── drawable/            # Icons, images
│   │   │   ├── mipmap-*/            # App icons (all sizes)
│   │   │   ├── values/
│   │   │   │   ├── colors.xml       # Colors
│   │   │   │   ├── strings.xml      # Text strings
│   │   │   │   └── styles.xml       # Themes, styles
│   │   │   └── xml/
│   │   │       └── config.xml       # Capacitor config
│   │   └── java/com/LifeSync AI/app/
│   │       └── MainActivity.java    # Main activity
│   └── build.gradle                 # Build config
└── build.gradle                      # Project build config
```

---

## 🎨 1. Đổi App Icon

### Cách 1: Dùng Android Studio (Dễ nhất)
1. Right-click `app/res` folder
2. New → Image Asset
3. Icon Type: **Launcher Icons**
4. Path: Chọn icon 1024x1024px
5. Click **Next** → **Finish**

### Cách 2: Thủ công
Thay các file trong:
```
app/res/mipmap-mdpi/ic_launcher.png       (48x48)
app/res/mipmap-hdpi/ic_launcher.png       (72x72)
app/res/mipmap-xhdpi/ic_launcher.png      (96x96)
app/res/mipmap-xxhdpi/ic_launcher.png     (144x144)
app/res/mipmap-xxxhdpi/ic_launcher.png    (192x192)
```

### Tool tạo icon:
- https://icon.kitchen/
- https://appicon.co/
- https://romannurik.github.io/AndroidAssetStudio/

---

## 🎨 2. Đổi Splash Screen

### File: `app/res/drawable/splash.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Background color -->
    <item android:drawable="@color/splash_background"/>
    
    <!-- Logo -->
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo"/>
    </item>
</layer-list>
```

### File: `app/res/values/colors.xml`
```xml
<resources>
    <!-- Splash screen background -->
    <color name="splash_background">#0F1520</color>
    
    <!-- App theme colors -->
    <color name="colorPrimary">#3B82F6</color>
    <color name="colorPrimaryDark">#0F1520</color>
    <color name="colorAccent">#12C2FF</color>
</resources>
```

### Thêm logo splash:
1. Tạo file `splash_logo.png` (512x512px)
2. Đặt vào `app/res/drawable/`

---

## 🎨 3. Đổi Status Bar Color

### File: `app/res/values/styles.xml`
```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Status bar color -->
        <item name="android:statusBarColor">#0F1520</item>
        
        <!-- Status bar icons (light/dark) -->
        <item name="android:windowLightStatusBar">false</item>
        
        <!-- Primary color -->
        <item name="colorPrimary">#3B82F6</item>
        <item name="colorPrimaryDark">#0F1520</item>
        <item name="colorAccent">#12C2FF</item>
    </style>
</resources>
```

---

## 🎨 4. Đổi App Name

### File: `app/res/values/strings.xml`
```xml
<resources>
    <string name="app_name">LifeSync AI</string>
    <string name="title_activity_main">LifeSync AI</string>
    <string name="package_name">com.lifesyncai.app</string>
    <string name="custom_url_scheme">lifesyncai</string>
</resources>
```

---

## 🎨 5. Đổi Theme Colors

### File: `app/res/values/colors.xml`
```xml
<resources>
    <!-- Primary brand color -->
    <color name="colorPrimary">#3B82F6</color>
    <color name="colorPrimaryDark">#0F1520</color>
    <color name="colorAccent">#12C2FF</color>
    
    <!-- Background colors -->
    <color name="background_light">#FFFFFF</color>
    <color name="background_dark">#0F1520</color>
    
    <!-- Text colors -->
    <color name="text_primary">#000000</color>
    <color name="text_secondary">#666666</color>
    
    <!-- Splash screen -->
    <color name="splash_background">#0F1520</color>
</resources>
```

---

## 🎨 6. Thêm Permissions

### File: `app/manifests/AndroidManifest.xml`
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <application
        android:name=".MainApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/title_activity_main"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 🎨 7. Notification Icon

### File: `app/res/drawable/ic_stat_icon_config_sample.xml`
```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM13,17h-2v-6h2v6zM13,9h-2L11,7h2v2z"/>
</vector>
```

---

## 🎨 8. Dark Mode Support

### File: `app/res/values-night/colors.xml`
```xml
<resources>
    <!-- Dark mode colors -->
    <color name="colorPrimary">#12C2FF</color>
    <color name="colorPrimaryDark">#0A1628</color>
    <color name="colorAccent">#3B82F6</color>
    
    <color name="background_light">#0F1520</color>
    <color name="background_dark">#050A14</color>
    
    <color name="text_primary">#FFFFFF</color>
    <color name="text_secondary">#CCCCCC</color>
</resources>
```

---

## 🔧 Sau khi chỉnh xong

### 1. Sync Gradle
```
File → Sync Project with Gradle Files
```

### 2. Clean & Rebuild
```
Build → Clean Project
Build → Rebuild Project
```

### 3. Run app
```
Run → Run 'app'
```

---

## 📱 Quick Customization Checklist

- [ ] App icon (mipmap-*)
- [ ] Splash screen (drawable/splash.xml)
- [ ] Status bar color (values/styles.xml)
- [ ] App name (values/strings.xml)
- [ ] Theme colors (values/colors.xml)
- [ ] Notification icon (drawable/ic_stat_*)
- [ ] Permissions (AndroidManifest.xml)
- [ ] Dark mode colors (values-night/colors.xml)

---

## 🎨 Recommended Colors for LifeSync AI

```xml
<!-- Light Mode -->
<color name="colorPrimary">#3B82F6</color>        <!-- Blue -->
<color name="colorPrimaryDark">#0F1520</color>    <!-- Dark Blue -->
<color name="colorAccent">#12C2FF</color>         <!-- Cyan -->

<!-- Dark Mode -->
<color name="colorPrimary">#12C2FF</color>        <!-- Cyan -->
<color name="colorPrimaryDark">#0A1628</color>    <!-- Darker Blue -->
<color name="colorAccent">#8B5CF6</color>         <!-- Purple -->
```

---

## 💡 Tips

1. **Icon size:** Luôn dùng 1024x1024px làm base, Android Studio sẽ tự resize
2. **Splash logo:** Nên dùng 512x512px, transparent background
3. **Status bar:** Dark background → light icons, Light background → dark icons
4. **Colors:** Dùng hex code (#RRGGBB) hoặc (#AARRGGBB) với alpha
5. **Test:** Test trên cả light và dark mode

---

## 🆘 Troubleshooting

### Icon không đổi?
```bash
# Clean build
./gradlew clean
# Rebuild
./gradlew build
# Uninstall app
adb uninstall com.lifesyncai.app
# Install lại
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Splash screen không hiện?
- Check file `splash.xml` có đúng format không
- Check logo file có tồn tại không
- Check `capacitor.config.ts` có config splash không

### Status bar không đổi màu?
- Check `styles.xml` có đúng không
- Check `android:statusBarColor` có đúng hex code không
- Restart app

---

## 📚 Resources

- Android Developer Docs: https://developer.android.com/
- Material Design Colors: https://material.io/design/color/
- Icon Generator: https://icon.kitchen/
- Splash Screen Guide: https://capacitorjs.com/docs/guides/splash-screens-and-icons
