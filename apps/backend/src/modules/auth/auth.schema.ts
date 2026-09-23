import { z } from 'zod';

/**
 * Accepts the account identifier as either `identifier` (our frontend) or
 * `email` / `mobile` (external API clients), resolving to a single string.
 */
const identifierLikeSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    mobile: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.identifier || data.email || data.mobile), {
    message: 'Email or phone is required',
  });

export function pickIdentifier(data: {
  identifier?: string;
  email?: string;
  mobile?: string;
}): string {
  return data.identifier ?? data.email ?? data.mobile ?? '';
}

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(6),
});

export const forgotPasswordSchema = identifierLikeSchema;

export const verifyOtpSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    mobile: z.string().trim().min(1).optional(),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
  })
  .refine((data) => Boolean(data.identifier || data.email || data.mobile), {
    message: 'Email or phone is required',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const registerSchema = z.any();
