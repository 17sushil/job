import { z } from 'zod';

const phoneRegex = /^[+]?[0-9\s()-]{7,15}$/;

export const USER_ROLES = ['candidate', 'recruiter'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or phone is required')
    .refine(
      (value) =>
        z.string().email().safeParse(value).success || phoneRegex.test(value),
      'Enter a valid email or phone number',
    ),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .regex(phoneRegex, 'Enter a valid phone number'),
    role: z.enum(USER_ROLES, {
      errorMap: () => ({ message: 'Please select a role' }),
    }),
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