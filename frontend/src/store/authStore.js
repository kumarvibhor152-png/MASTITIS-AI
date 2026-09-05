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
    }
  )
);

export default useAuthStore;
