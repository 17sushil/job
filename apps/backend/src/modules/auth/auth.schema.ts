import { z } from 'zod';

/** Email or mobile, exactly as typed by the user. */
const identifierSchema = z.string().trim().min(1, 'Email or phone is required');

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(6),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const verifyOtpSchema = z.object({
  identifier: identifierSchema,
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const registerSchema = z.any();
