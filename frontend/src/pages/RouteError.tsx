import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui';
import { getDefaultRouteForUser } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';

/**
 * Route-level error page rendered by React Router's `errorElement`.
 *
 * Catches errors that the React ErrorBoundary cannot, most importantly:
 *  - failed lazy-loaded chunks (common right after a new deploy when old chunk
 *    files no longer exist), and
 *  - errors thrown from loaders/routes.
 *
 * Always shows what went wrong plus a clear path back to a safe page.
 */
export function RouteError() {
    const error = useRouteError();
    const { user, isAuthenticated } = useAuthStore();
    const homePath = isAuthenticated ? getDefaultRouteForUser(user) : '/';

    // Work out a friendly title/message from whatever React Router hands us.
    let title = 'Đã xảy ra lỗi';
    let message = 'Có lỗi không mong muốn xảy ra khi tải trang.';
    let details: string | undefined;

    if (isRouteErrorResponse(error)) {
        // An HTTP-style routing error (e.g. 404 thrown by a loader).
        title = `${error.status} ${error.statusText}`;
        message =
            error.status === 404
                ? 'Không tìm thấy trang bạn yêu cầu.'
                : 'Máy chủ trả về lỗi khi tải trang này.';
        details = typeof error.data === 'string' ? error.data : undefined;
    } else if (error instanceof Error) {
        message = error.message;
        details = error.stack;

        // A chunk that can't be fetched usually means the app was redeployed.
        if (/dynamically imported module|Loading chunk|Failed to fetch/i.test(error.message)) {
            title = 'Phiên bản ứng dụng đã thay đổi';
            message =
                'Không tải được một phần của ứng dụng. Có thể ứng dụng vừa được cập nhật. Hãy tải lại trang.';
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 text-[var(--text)]">
            <div className="max-w-md w-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{title}</h1>
                <p className="text-[var(--text-2)] mb-6">{message}</p>

                <div className="space-y-2">
                    <Button onClick={() => window.location.reload()} className="w-full">
                        <RefreshCw className="w-4 h-4" />
                        Tải lại trang
                    </Button>
                    <Link to={homePath}>
                        <Button variant="outline" className="w-full">
                            <Home className="w-4 h-4" />
                            Quay về trang chủ
                        </Button>
                    </Link>
                </div>

                {import.meta.env.DEV && details && (
                    <details className="mt-6 text-left">
                        <summary className="cursor-pointer text-sm text-[var(--text-2)] hover:text-[var(--text)]">
                            Chi tiết lỗi (Development)
                        </summary>
                        <pre className="mt-2 rounded-lg bg-[var(--surface-2)] p-4 text-xs text-[var(--text)] overflow-auto">
                            {details}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
