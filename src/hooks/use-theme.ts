// src/hooks/use-theme.ts
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage for saved theme preference
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme | null;

            // Return saved theme or detect system preference
            if (savedTheme) {
                return savedTheme;
            }

            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }

        return 'light'; // Default to light mode
    });

    // Apply theme whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Save to localStorage
            localStorage.setItem('theme', theme);

            // Apply theme to document element
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme]);

    return {
        theme,
        setTheme: (newTheme: Theme) => setTheme(newTheme)
    };
}
