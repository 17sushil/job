import { z } from 'zod';
import { UserRole } from './user.entity.js';

export const createUserSchema = z.object({
  email: z.string().email(),
  mobile: z.string().min(10).max(15),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateUserSchema = z.object({
  mobile: z.string().min(10).max(15).optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const userSchema = createUserSchema;
