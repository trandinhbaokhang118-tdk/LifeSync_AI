import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { getDefaultRouteForUser, isAdminUser } from '../../lib/auth';
import { hasAuthTokens } from '../../lib/auth-tokens';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const location = useLocation();
    const { user, isAuthenticated } = useAuthStore();
    const hasTokens = hasAuthTokens();

    if (!isAuthenticated && !hasTokens) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (!isAdminUser(user)) {
        return <Navigate to={getDefaultRouteForUser(user)} replace />;
    }

    return <>{children}</>;
}
