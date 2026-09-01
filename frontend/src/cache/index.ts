/**
 * Cache barrel: điểm truy cập duy nhất cho 3 layer cache độc lập.
 *
 *  Layer 1 - queryClient:        cache dữ liệu API trong RAM (luôn bật).
 *  Layer 2 - enablePersistCache: lưu cache xuống localStorage (tùy chọn).
 *  Layer 3 - registerServiceWorker: cache asset tĩnh + offline (tùy chọn).
 *
 * Mỗi layer dùng được riêng lẻ tùy tình huống, không phụ thuộc nhau.
 */
export { queryClient } from './queryClient';
export { enablePersistCache } from './persistCache';
export type { PersistCacheOptions } from './persistCache';
export { registerServiceWorker } from './serviceWorker';
export type { RegisterServiceWorkerOptions } from './serviceWorker';
