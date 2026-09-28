'use client';

import { create } from 'zustand';

import type { AuthUser } from '@/features/auth/api';

interface AuthState {
  user: AuthUser | null;
  /** In-memory bearer token fallback for environments that block cookies. */
  token: string | null;
  setSession: (user: AuthUser, token?: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * In-memory session mirror. The real session lives in an httpOnly cookie;
 * this store caches what the API returns for rendering and carries the
 * bearer token fallback when third-party cookies are unavailable.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  setSession: (user, token) =>
    set((state) => ({ user, token: token ?? state.token })),
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}));
