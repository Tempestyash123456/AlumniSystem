import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // Default to light theme
};

export const useThemeStore = create<ThemeState>((set) => {
    const initialTheme = getInitialTheme();
    // Apply initial theme immediately to body
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${initialTheme}`);

    return {
        theme: initialTheme,
        toggleTheme: () => set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.body.classList.remove('theme-dark', 'theme-light');
            document.body.classList.add(`theme-${newTheme}`);
            return { theme: newTheme };
        }),
    };
});