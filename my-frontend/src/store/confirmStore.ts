// my-frontend/src/store/confirmStore.ts

import { create } from 'zustand';

interface ConfirmOptions {
    title: string;
    message: string;
    danger?: boolean;
}

interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    danger: boolean;
    resolve: (value: boolean) => void;
    
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    close: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
    isOpen: false,
    title: '',
    message: '',
    danger: false,
    resolve: () => {},

    confirm: ({ title, message, danger = false }) => {
        set({ isOpen: true, title, message, danger });
        return new Promise((resolve) => {
            set({ resolve });
        });
    },

    close: (value) => {
        const { resolve } = get();
        resolve(value);
        set({ isOpen: false });
    },
}));

export const confirm = (options: ConfirmOptions) => useConfirmStore.getState().confirm(options);
