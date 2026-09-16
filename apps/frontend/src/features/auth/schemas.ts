import { z } from 'zod';

const phoneRegex = /^[+]?[0-9\s()-]{7,15}$/;

export const USER_ROLES = ['candidate', 'recruiter'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Accepts either a valid email or a phone number. */
const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Email or phone is required')
  .refine(
    (value) =>
      z.string().email().safeParse(value).success || phoneRegex.test(value),
    'Enter a valid email or phone number',
  );

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * The signup form itself no longer collects a role - the role is chosen on the
 * landing page and read from the auth store when the form is submitted.
 */
export const registerSchema = z
  .object({
    identifier: identifierSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z
      .boolean()
      .refine(
        (value) => value === true,
        'You must accept the terms to continue',
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
