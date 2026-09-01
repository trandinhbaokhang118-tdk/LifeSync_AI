import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { API_URL } from '../lib/api-config';
import { clearAuthTokens, getAccessToken, getRefreshToken, hasAuthTokens, saveAuthTokens } from '../lib/auth-tokens';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
    logout: () => Promise<void>;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            login: (user, accessToken, refreshToken, rememberMe = true) => {
                saveAuthTokens(accessToken, refreshToken, rememberMe);
                set({ user, isAuthenticated: true });
            },

            logout: async () => {
                const refreshToken = getRefreshToken();

                try {
                    if (refreshToken) {
                        await fetch(`${API_URL}/auth/logout`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken }),
                            keepalive: true,
                        });
                    }
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.warn('Server-side logout failed; clearing the local session.', error);
                    }
                } finally {
                    clearAuthTokens();
                    localStorage.removeItem('auth-storage');
                    set({ user: null, isAuthenticated: false });
                }
            },

            // Check if tokens exist and sync state
            checkAuth: () => {
                const hasAccessToken = !!getAccessToken();
                const hasRefreshToken = !!getRefreshToken();
                const currentState = get();

                // If tokens exist but state says not authenticated, sync it
                if ((hasAccessToken || hasRefreshToken) && !currentState.isAuthenticated && currentState.user) {
                    set({ isAuthenticated: true });
                }

                // If no tokens but state says authenticated, clear it
                if (!hasAuthTokens() && currentState.isAuthenticated) {
                    set({ user: null, isAuthenticated: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);

// Sync auth state on app load
if (typeof window !== 'undefined') {
    useAuthStore.getState().checkAuth();
}
