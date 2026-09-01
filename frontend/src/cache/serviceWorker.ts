/**
 * Cache Layer 3: Asset & Offline Cache (Service Worker)
 * ------------------------------------------------
 * Đăng ký Service Worker do vite-plugin-pwa (Workbox) sinh ra để cache
 * các asset tĩnh (JS/CSS/ảnh/font) và cho phép chạy offline.
 *
 * Layer này tách riêng để main.tsx chỉ cần gọi một hàm; logic đăng ký
 * SW không trộn vào phần khởi tạo UI.
 *
 * Lưu ý: Service Worker chỉ hoạt động trên web (https/localhost).
 * Khi chạy trong WebView của Capacitor Android, các asset đã nằm sẵn
 * trong app nên layer này tự bỏ qua, tránh xung đột.
 */

export interface RegisterServiceWorkerOptions {
    /** Gọi khi có phiên bản mới sẵn sàng (gợi ý người dùng reload). */
    onNeedRefresh?: () => void;
    /** Gọi khi app đã sẵn sàng chạy offline. */
    onOfflineReady?: () => void;
}

/**
 * Đăng ký Service Worker. An toàn khi gọi ở mọi nền tảng:
 * - Web: đăng ký bình thường.
 * - Native (Capacitor) hoặc trình duyệt không hỗ trợ: bỏ qua.
 */
export async function registerServiceWorker(
    options: RegisterServiceWorkerOptions = {},
): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    try {
        // Import động: chỉ tải code đăng ký SW khi thực sự cần.
        const { registerSW } = await import('virtual:pwa-register');

        registerSW({
            immediate: true,
            onNeedRefresh() {
                options.onNeedRefresh?.();
            },
            onOfflineReady() {
                options.onOfflineReady?.();
            },
        });
    } catch (error) {
        console.warn('Service Worker registration skipped:', error);
    }
}
