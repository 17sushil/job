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
 * Persisted auth store. The signed-in user (including their role, which the
 * backend returns) is kept in localStorage for the session. The role *choice*
 * itself is NOT stored here — it travels through the URL query param
 * (`/register?role=...`) and is merged into the register request.
 *
 * TODO(auth): swap the session for a real httpOnly cookie once the backend
 * issues JWTs.
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