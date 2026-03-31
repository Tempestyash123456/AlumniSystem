// my-frontend/src/store/toastStore.ts

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    // Helper methods for convenience
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));

        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    
    // Direct helpers
    success: (message, duration) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type: 'success', duration: duration ?? 5000 }],
        }));
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), duration ?? 5000);
    },
    error: (message, duration) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type: 'error', duration: duration ?? 7000 }],
        }));
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), duration ?? 7000);
    },
    info: (message, duration) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type: 'info', duration: duration ?? 5000 }],
        }));
        setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), duration ?? 5000);
    },
}));

// Export a singleton-like toast object for easy use
export const toast = {
    success: (msg: string, dur?: number) => useToastStore.getState().success(msg, dur),
    error: (msg: string, dur?: number) => useToastStore.getState().error(msg, dur),
    info: (msg: string, dur?: number) => useToastStore.getState().info(msg, dur),
};
