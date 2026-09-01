/**
 * Cache Layer 2: Persistent Data Cache
 * ------------------------------------------------
 * Lưu trạng thái của TanStack Query xuống localStorage để dữ liệu
 * vẫn còn khi người dùng đóng/mở lại app (web và Capacitor Android
 * dùng chung WebView nên hoạt động giống nhau).
 *
 * Layer này độc lập với queryClient: chỉ cần gọi `enablePersistCache`
 * khi muốn bật, không gọi thì app vẫn chạy với cache in-memory bình thường.
 */
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'lifesync-query-cache';
const MAX_AGE = 1000 * 60 * 60 * 24; // 24 giờ

export interface PersistCacheOptions {
    /** Khóa lưu trong storage. Mặc định: 'lifesync-query-cache'. */
    cacheKey?: string;
    /** Thời gian tối đa giữ cache (ms). Mặc định: 24 giờ. */
    maxAge?: number;
}

/**
 * Bật persistent cache cho một QueryClient.
 * Trả về hàm cleanup để hủy đăng ký khi cần.
 */
export function enablePersistCache(
    client: QueryClient,
    options: PersistCacheOptions = {},
): () => void {
    // SSR / môi trường không có localStorage thì bỏ qua an toàn.
    if (typeof window === 'undefined' || !window.localStorage) {
        return () => { };
    }

    const persister = createSyncStoragePersister({
        storage: window.localStorage,
        key: options.cacheKey ?? CACHE_KEY,
    });

    const [unsubscribe] = persistQueryClient({
        queryClient: client,
        persister,
        maxAge: options.maxAge ?? MAX_AGE,
    });

    return unsubscribe;
}
