import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getLoginRouteForUser, isAdminUser } from '../../lib/auth';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    // Check tokens directly from localStorage for immediate response
    const hasTokens = !!localStorage.getItem('accessToken') || !!localStorage.getItem('refreshToken');

    // If not authenticated and no tokens, redirect to login
    if (!isAuthenticated && !hasTokens) {
        return <Navigate to={getLoginRouteForUser(user)} state={{ from: location }} replace />;
    }

    if (isAdminUser(user)) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
