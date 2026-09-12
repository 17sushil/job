'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/features/auth/api';
import type { UserRole } from '@/features/auth/schemas';

interface AuthState {
  user: AuthUser | null;
  /** Role chosen on the landing page, persisted in localStorage. */
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Persisted auth store. `role` is chosen on the first-visit landing page and
 * kept in localStorage so the dashboard can render accordingly; `user` holds
 * the signed-in session. TODO(auth): swap the session for a real httpOnly
 * cookie once the backend issues JWTs.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      setRole: (role) => set({ role }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'jobdev-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);