import type { User } from '../types';

export function isAdminUser(user: User | null | undefined): boolean {
    return user?.role === 'ADMIN' && user.portal === 'admin';
}

export function getDefaultRouteForUser(user: User | null | undefined): string {
    return isAdminUser(user) ? '/admin' : '/app';
}

export function getLoginRouteForUser(user: User | null | undefined): string {
    return isAdminUser(user) ? '/admin/login' : '/login';
}

export function getAllowedRedirectPathForUser(
    user: User | null | undefined,
    requestedPath?: string | null,
): string {
    if (!requestedPath) {
        return getDefaultRouteForUser(user);
    }

    if (isAdminUser(user)) {
        return requestedPath.startsWith('/admin') ? requestedPath : '/admin';
    }

    return requestedPath.startsWith('/admin') ? '/app' : requestedPath;
}
