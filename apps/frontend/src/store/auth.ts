'use client';

import { create } from 'zustand';

import type { AuthUser } from '@/features/auth/api';

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * In-memory session mirror. The real session lives in an httpOnly cookie;
 * this store only caches what GET /api/auth/me returns for rendering.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
