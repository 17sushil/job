import { apiClient } from '@/lib/api-client';

import type { UserRole } from './schemas';

export interface AuthUser {
  id: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  name: string | null;
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

export interface ChangePasswordPayload {
  identifier: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

export async function updateProfileRequest(identifier: string, name: string) {
  return apiClient('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, name }),
  });
}

export async function changePasswordRequest(payload: ChangePasswordPayload) {
  return apiClient('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
