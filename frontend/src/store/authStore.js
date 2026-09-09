import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuth: false,

      login: (user, token) =>
        set({ user, token, isAuth: true }),

      logout: () =>
        set({ user: null, token: null, isAuth: false }),

      setUser: (user) =>
        set((state) => ({ ...state, user })),
    }),
    {
      name: 'mastitrack-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuth: state.isAuth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user?.name && (state.user.name.includes('Ramesh') || state.user.name.includes('Rajesh'))) {
          state.user.name = 'Kundan Pal';
        }
      },
    }
  )
);

export default useAuthStore;
