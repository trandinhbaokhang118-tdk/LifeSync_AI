import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../components/ui/toast';
import { getDefaultRouteForUser } from '../lib/auth';
import { API_URL } from '../lib/api-config';
import { useAuthStore } from '../store/auth.store';

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const refreshToken = searchParams.get('refreshToken') || '';
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                showToast.error('Dang nhap that bai', errorDescription || error);
                navigate('/login', { replace: true });
                return;
            }

            if (!token) {
                showToast.error('Dang nhap that bai', 'Khong nhan duoc token');
                navigate('/login', { replace: true });
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                const user = data.data;

                if (!response.ok || !user) {
                    throw new Error('Could not load authenticated user');
                }

                login(user, token, refreshToken);
                showToast.success('Dang nhap thanh cong', `Xin chao ${user.name}!`);
                navigate(getDefaultRouteForUser(user), { replace: true });
            } catch {
                showToast.error('Dang nhap that bai', 'Vui long thu lai');
                navigate('/login', { replace: true });
            }
        };

        void handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Dang xu ly dang nhap...</p>
            </div>
        </div>
    );
}
