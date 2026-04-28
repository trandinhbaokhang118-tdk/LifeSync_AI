import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getDefaultRouteForUser, isAdminUser } from '../../lib/auth';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const location = useLocation();
    const { user, isAuthenticated } = useAuthStore();
    const hasTokens = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');

    if (!isAuthenticated && !hasTokens) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (!isAdminUser(user)) {
        return <Navigate to={getDefaultRouteForUser(user)} replace />;
    }

    return <>{children}</>;
}
