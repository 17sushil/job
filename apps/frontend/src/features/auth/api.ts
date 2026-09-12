import { apiClient } from '@/lib/api-client';

import type { UserRole } from './schemas';

export interface AuthUser {
  id: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
}

export interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface RegisterPayload {
  identifier: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

export async function registerRequest(payload: RegisterPayload) {
  return apiClient('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function loginRequest(identifier: string, password: string) {
  return apiClient('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
}