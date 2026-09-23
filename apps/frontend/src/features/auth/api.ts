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
  success?: boolean;
  data?: T;
  message?: string;
}

export interface RegisterPayload {
  identifier: string;
  /** Backend enum is uppercase (CANDIDATE / RECRUITER). */
  role: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

/**
 * All auth calls go through Axios with the httpOnly session cookie.
 * Each function resolves with the unwrapped payload and rejects with an
 * Error carrying the server message (see `errorMessage`).
 */
export async function registerRequest(payload: RegisterPayload) {
  const { data } = await apiClient.post<ApiEnvelope<{ user: AuthUser }>>(
    '/api/auth/register',
    payload,
  );
  return data.data!.user;
}

export async function loginRequest(identifier: string, password: string) {
  const { data } = await apiClient.post<ApiEnvelope<LoginResult>>(
    '/api/auth/login',
    { identifier, password },
  );
  return data.data!;
}

/** Hydrates the session from the httpOnly cookie (no client-side token). */
export async function meRequest() {
  const { data } = await apiClient.get<ApiEnvelope<AuthUser>>(
    '/api/auth/me',
  );
  return data.data!;
}

export async function logoutRequest() {
  await apiClient.post('/api/auth/logout');
}

export async function updateProfileRequest(name: string) {
  const { data } = await apiClient.patch<ApiEnvelope<{ user: AuthUser }>>(
    '/api/auth/profile',
    { name },
  );
  return data.data!.user;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordRequest(payload: ChangePasswordPayload) {
  const { data } = await apiClient.post<ApiEnvelope<{ message: string }>>(
    '/api/auth/change-password',
    payload,
  );
  return data.data!;
}

export async function forgotPasswordRequest(identifier: string) {
  const { data } = await apiClient.post<ApiEnvelope<{ message: string }>>(
    '/api/auth/forgot-password',
    { identifier },
  );
  return data.data!;
}

export interface VerifyOtpPayload {
  identifier: string;
  otp: string;
  newPassword: string;
}

export async function verifyOtpRequest(payload: VerifyOtpPayload) {
  const { data } = await apiClient.post<ApiEnvelope<{ message: string }>>(
    '/api/auth/verify-otp',
    payload,
  );
  return data.data!;
}
