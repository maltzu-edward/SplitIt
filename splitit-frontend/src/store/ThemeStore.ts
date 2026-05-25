import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('splitit-theme') as Theme) ?? 'light',
  toggle: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('splitit-theme', next);
      applyTheme(next);
      return { theme: next };
    }),
}));

export default useThemeStore;
