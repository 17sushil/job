import { z } from 'zod';

const phoneRegex = /^[+]?[0-9\s()-]{7,15}$/;

export const USER_ROLES = ['candidate', 'recruiter'] as const;

/** Accepts either a valid email or a phone number. */
const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Email or phone is required')
  .refine(
    (value) =>
      z.string().email().safeParse(value).success || phoneRegex.test(value),
    'A valid email or phone number is required',
  );

/** Shared password policy. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z
  .object({
    identifier: identifierSchema,
    role: z.enum(USER_ROLES, {
      errorMap: () => ({ message: 'Role must be candidate or recruiter' }),
    }),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Account identifier is required'),
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  identifier: z.string().trim().min(1, 'Account identifier is required'),
  name: z.string().trim().min(1, 'Name is required').max(80),
});