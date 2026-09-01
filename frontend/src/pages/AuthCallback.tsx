import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../components/ui/toast';
import { API_URL } from '../lib/api-config';
import { getDefaultRouteForUser } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';
import type { AuthResponse } from '../types';

type ExchangeResponse = { data?: AuthResponse } & Partial<AuthResponse>;

function callbackParam(searchParams: URLSearchParams, key: string) {
    return searchParams.get(key);
}

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    useEffect(() => {
        const handleCallback = async () => {
            const code = callbackParam(searchParams, 'code');
            const error = callbackParam(searchParams, 'error');

            // Remove the one-time code from the address bar before any network call.
            window.history.replaceState({}, document.title, '/auth/callback');

            if (error) {
                showToast.error('Đăng nhập thất bại', 'Nhà cung cấp đã từ chối hoặc phiên đăng nhập đã hết hạn.');
                navigate('/login', { replace: true });
                return;
            }

            if (!code) {
                showToast.error('Đăng nhập thất bại', 'Không nhận được mã xác thực dùng một lần.');
                navigate('/login', { replace: true });
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/oauth/exchange`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                });
                const payload = (await response.json()) as ExchangeResponse;
                const auth = payload.data ?? payload;

                if (!response.ok || !auth.user || !auth.accessToken || !auth.refreshToken) {
                    throw new Error('OAuth exchange failed');
                }

                login(auth.user, auth.accessToken, auth.refreshToken, true);
                showToast.success('Đăng nhập thành công', `Xin chào ${auth.user.name}!`);
                navigate(getDefaultRouteForUser(auth.user), { replace: true });
            } catch {
                showToast.error('Đăng nhập thất bại', 'Mã đăng nhập không hợp lệ hoặc đã hết hạn.');
                navigate('/login', { replace: true });
            }
        };

        void handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
            <div className="text-center" role="status" aria-live="polite">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
                <p className="text-[var(--text-2)]">Đang hoàn tất đăng nhập an toàn...</p>
            </div>
        </main>
    );
}
