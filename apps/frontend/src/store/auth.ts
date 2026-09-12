'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/features/auth/api';

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Persisted auth store. The backend auth is a demo scaffold (in-memory),
 * so for now we keep the logged-in user (and their role) in localStorage.
 * TODO(auth): swap for a proper httpOnly-cookie session once the backend
 * issues real JWTs.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'jobdev-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);