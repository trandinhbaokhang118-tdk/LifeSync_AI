import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { Toaster } from './components/ui/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient, enablePersistCache } from './cache';

// Loading component
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#12C2FF] via-[#3B82F6] to-[#8B5CF6] dark:from-[#0A1628] dark:via-[#1E3A5F] dark:to-[#8B5CF6]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent shadow-lg"></div>
        </div>
    );
}

function App() {
    // Cache Layer 2: bật persistent cache cho dữ liệu query khi app khởi động.
    useEffect(() => {
        const unsubscribe = enablePersistCache(queryClient);
        return unsubscribe;
    }, []);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Suspense fallback={<PageLoader />}>
                    <RouterProvider router={router} />
                </Suspense>
                <Toaster />
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
