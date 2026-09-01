/**
 * Cache Layer 1: Runtime Data Cache (in-memory)
 * ------------------------------------------------
 * Centralizes the TanStack Query client configuration.
 * This layer caches API responses in memory to avoid duplicate
 * network requests during a session.
 *
 * Tách riêng khỏi App.tsx để layer dữ liệu độc lập, dễ tái sử dụng
 * và dễ kiểm thử.
 */
import { QueryClient } from '@tanstack/react-query';

/** Số mili-giây trong 1 phút, dùng cho cấu hình thời gian cache. */
const MINUTE = 1000 * 60;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Dữ liệu được coi là "tươi" trong 5 phút -> không refetch lại.
            staleTime: 5 * MINUTE,
            // Giữ dữ liệu không dùng trong cache 24h để layer persist tận dụng.
            gcTime: 24 * 60 * MINUTE,
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
