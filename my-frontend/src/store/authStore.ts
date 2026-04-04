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
    accountLocked: boolean;
    enabled: boolean;
    roleSelected: boolean;
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
            accountLocked: false,
            enabled: false,
            roleSelected: false,

            setUser: (user, accessToken, refreshToken) => {
                tokenStorage.set(accessToken, refreshToken);
                set({
                    user,
                    isAuthenticated: true,
                    isAdmin: user.roles?.includes('ROLE_ADMIN') || false,
                    permissions: user.permissions || [],
                    accountLocked: user.accountLocked || false,
                    enabled: user.enabled || false,
                    roleSelected: user.roleSelected || false,
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
                
                // 1. Super-admin fallback: ADMIN role always has all permissions
                if (state.isAdmin) return true;

                // 2. Default permissions for all authenticated users (Read-only access to feed)
                const defaultPermissions = ['VIEW_POST', 'VIEW_EVENT'];
                if (defaultPermissions.includes(permission)) return true;

                if (!state.permissions || state.permissions.length === 0) return false;

                // 3. Custom PBAC (Permission-Based Access Control)
                // Supports both raw strings and permission objects (name: string)
                return state.permissions.some(p => {
                    if (typeof p === 'string') return p === permission;
                    if (p && typeof p === 'object' && 'name' in p) return (p as any).name === permission;
                    return false;
                });
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