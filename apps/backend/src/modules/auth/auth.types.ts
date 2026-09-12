import type { z } from 'zod';

import type { loginSchema, registerSchema } from './auth.schema.js';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type UserRole = 'candidate' | 'recruiter';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface RegisterResult {
  user: AuthUser;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}