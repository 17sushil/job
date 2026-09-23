import { z } from 'zod';

import { UserRole } from './user.entity.js';

export const createUserSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    mobile: z.string().optional(),
    name: z.string().optional(),
    password: z.string().min(6),
    confirmPassword: z.string().optional(), // from frontend
    role: z.nativeEnum(UserRole).optional(),
  })
  .refine((data) => Boolean(data.email || data.identifier || data.mobile), {
    message: 'Email or phone is required',
  });

export const updateUserSchema = z.object({
  name: z.string().optional(),
  mobile: z.string().min(10).max(15).optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const userSchema = createUserSchema;
