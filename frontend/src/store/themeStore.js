import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (isDark) => {
  if (typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      toggleDark: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        applyTheme(next);
        return next;
      },
      setDarkMode: (val) => {
        set({ darkMode: val });
        applyTheme(val);
      },
      initTheme: () => {
        const isDark = get().darkMode;
        applyTheme(isDark);
      },
    }),
    {
      name: 'mastitrack-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.darkMode);
        }
      },
    }
  )
);

export default useThemeStore;
