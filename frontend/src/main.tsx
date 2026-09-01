import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './cache'

// Import Capacitor for native features
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Setup native features when running on mobile
if (Capacitor.isNativePlatform()) {
  // Hide splash screen after app loads
  SplashScreen.hide().catch(() => {
    console.log('SplashScreen not available');
  });

  // Set status bar style for dark theme
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {
    console.log('StatusBar not available');
  });

  StatusBar.setBackgroundColor({ color: '#0F1520' }).catch(() => {
    console.log('StatusBar background not available');
  });

  console.log('Running on native platform:', Capacitor.getPlatform());
} else {
  console.log('Running on web platform');

  // Cache Layer 3: đăng ký Service Worker cache asset + offline (chỉ trên web).
  registerServiceWorker({
    onOfflineReady: () => console.log('App sẵn sàng chạy offline'),
    onNeedRefresh: () => console.log('Có phiên bản mới, reload để cập nhật'),
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
