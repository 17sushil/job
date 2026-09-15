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

export const registerSchema = z
  .object({
    identifier: identifierSchema,
    role: z.enum(USER_ROLES, {
      errorMap: () => ({ message: 'Role must be candidate or recruiter' }),
    }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
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