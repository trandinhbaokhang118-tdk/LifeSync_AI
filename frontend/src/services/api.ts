import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';
import { API_URL } from '../lib/api-config';

function isLoginRoute(pathname: string) {
    return pathname === '/login' || pathname === '/admin/login';
}

function getLoginRoute(pathname: string) {
    return pathname.startsWith('/admin') ? '/admin/login' : '/login';
}

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Log error for debugging (only in development)
        if (import.meta.env.DEV) {
            console.error('API Error:', {
                url: originalRequest?.url,
                status: error.response?.status,
                message: error.response?.data?.error?.message || error.message,
            });
        }

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const currentPath = window.location.pathname;

            // Don't redirect if already on login page
            if (isLoginRoute(currentPath)) {
                return Promise.reject(error);
            }

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('auth-storage');

                    if (!isLoginRoute(currentPath)) {
                        window.location.href = getLoginRoute(currentPath);
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, clear storage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('auth-storage');

                if (!isLoginRoute(currentPath)) {
                    window.location.href = getLoginRoute(currentPath);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
