// my-frontend/src/store/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '../types';
import { tokenStorage } from '../lib/api.ts';

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    setUser: (user: UserInfo, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (partial: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isAdmin: false,

            setUser: (user, accessToken, refreshToken) => {
                tokenStorage.set(accessToken, refreshToken);
                set({
                    user,
                    isAuthenticated: true,
                    isAdmin: user.roles?.includes('ROLE_ADMIN') || false,
                });
            },

            clearAuth: () => {
                tokenStorage.clear();
                set({ user: null, isAuthenticated: false, isAdmin: false });
            },

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partial } : null,
                })),
        }),
        {
            name: 'auth-store',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isAdmin: state.isAdmin,
            }),
        }
    )
);