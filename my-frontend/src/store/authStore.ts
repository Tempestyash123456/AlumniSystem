// my-frontend/src/store/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '../types';
import { tokenStorage } from '../lib/api.ts';

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    permissions: string[];
    setUser: (user: UserInfo, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    updateUser: (partial: Partial<UserInfo>) => void;
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            permissions: [],

            setUser: (user, accessToken, refreshToken) => {
                tokenStorage.set(accessToken, refreshToken);
                set({
                    user,
                    isAuthenticated: true,
                    isAdmin: user.roles?.includes('ROLE_ADMIN') || false,
                    permissions: user.permissions || [],
                });
            },

            clearAuth: () => {
                tokenStorage.clear();
                set({ user: null, isAuthenticated: false, isAdmin: false, permissions: [] });
            },

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partial } : null,
                    permissions: partial.permissions || state.permissions,
                })),

            hasPermission: (permission: string) => {
                const state = get();
                return state.permissions.includes(permission);
            },
        }),
        {
            name: 'auth-store',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isAdmin: state.isAdmin,
                permissions: state.permissions,
            }),
        }
    )
);