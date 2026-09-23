'use client';

import { create } from 'zustand';

import type { AuthUser } from '@/features/auth/api';

interface AuthState {
  user: AuthUser | null;
  /** True once the session cookie has been checked against /api/auth/me. */
  hydrated: boolean;
  setUser: (user: AuthUser) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

/**
 * Cookie-backed auth store. The session token lives ONLY in an httpOnly
 * cookie set by the backend, so nothing is persisted client-side. On page
 * load the dashboard layout calls GET /api/auth/me and fills this store
 * from the response; if the cookie is missing or expired the user is sent
 * back to /login.
 *
 * The role *choice* for signup still travels through the URL query param
 * (`/register?role=...`) and is merged into the register request.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  setHydrated: (hydrated) => set({ hydrated }),
  logout: () => set({ user: null, hydrated: true }),
}));
