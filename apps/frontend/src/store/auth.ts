'use client';
import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/api';
import { clearCsrf } from '@/lib/api-client';

/** View state only. A refresh must authenticate via GET /api/auth/me. */
interface AuthState {
  user: AuthUser | null;
  setSession: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}
export const useAuthStore = create<AuthState>()(set => ({
  user: null,
  setSession: user => set({ user }),
  setUser: user => set({ user }),
  logout: () => { clearCsrf(); set({ user: null }); },
}));
