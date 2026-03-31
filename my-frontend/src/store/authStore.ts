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
                // Default permissions for all authenticated users
                const defaultPermissions = ['POST_VIEW', 'EVENT_VIEW'];
                if (defaultPermissions.includes(permission)) return true;

                // Implicit viewing rights for admins
                if (permission === 'USER_VIEW' && (state.permissions.includes('USER_MANAGE') || state.permissions.includes('PERMISSION_MANAGE'))) {
                    return true;
                }

                // Super-admin check
                if (state.permissions.includes('PERMISSION_MANAGE')) return true;

                // Abstract management permissions
                if (permission === 'POST_MANAGE') {
                    return ['POST_CREATE', 'POST_EDIT', 'POST_DELETE'].some(p => state.permissions.includes(p));
                }
                if (permission === 'EVENT_MANAGE') {
                    return ['EVENT_CREATE', 'EVENT_EDIT', 'EVENT_DELETE'].some(p => state.permissions.includes(p));
                }
                if (permission === 'USER_ADMIN_ACCESS') {
                    return ['USER_VIEW', 'USER_MANAGE', 'PERMISSION_MANAGE'].some(p => state.permissions.includes(p));
                }

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