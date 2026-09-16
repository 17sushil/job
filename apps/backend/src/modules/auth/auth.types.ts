import type { z } from 'zod';

import type {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from './auth.schema.js';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type UserRole = 'candidate' | 'recruiter';

export interface AuthUser {
  id: string;
  /** Email or phone, exactly as provided at signup. */
  identifier: string;
  /** Set when the identifier is an email, otherwise null. */
  email: string | null;
  /** Set when the identifier is a phone number, otherwise null. */
  phone: string | null;
  /** Display name (editable via PATCH /api/auth/profile). */
  name: string | null;
  role: UserRole;
}

export interface RegisterResult {
  user: AuthUser;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}
