import { z } from 'zod';

const phoneRegex = /^[+]?[0-9\s()-]{7,15}$/;

export const USER_ROLES = ['candidate', 'recruiter'] as const;

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, 'A valid phone number is required'),
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