// Debug utilities for development
import { API_URL } from './api-config';

export const debugAuth = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const authStorage = localStorage.getItem('auth-storage');

    console.group('🔐 Auth Debug Info');
    console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'None');
    console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
    console.log('Auth Storage:', authStorage);

    if (accessToken) {
        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('Token Payload:', payload);
            console.log('Token Expired:', payload.exp * 1000 < Date.now());
            console.log('Expires At:', new Date(payload.exp * 1000).toLocaleString());
        } catch (e) {
            console.error('Failed to parse token:', e);
        }
    }
    console.groupEnd();
};

export const debugAPI = async () => {
    const accessToken = localStorage.getItem('accessToken');

    console.group('🌐 API Debug Info');
    console.log('API URL:', API_URL);
    console.log('Has Token:', !!accessToken);

    // Test backend connection
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        console.log('API Response Status:', response.status);
        const data = await response.json();
        console.log('API Response Data:', data);
    } catch (error) {
        console.error('API Error:', error);
    }
    console.groupEnd();
};

// Add to window for easy access in console.
// SECURITY: Only expose debug helpers during development. In production builds
// (import.meta.env.DEV === false) these are never attached, so tokens and API
// responses are never logged on a user's machine.
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const debugWindow = window as Window & typeof globalThis & {
        debugAuth?: typeof debugAuth;
        debugAPI?: typeof debugAPI;
    };

    debugWindow.debugAuth = debugAuth;
    debugWindow.debugAPI = debugAPI;
}
