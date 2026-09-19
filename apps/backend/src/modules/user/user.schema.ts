import { z } from 'zod';
import { UserRole } from './user.entity.js';

export const createUserSchema = z.object({
  email: z.string().email().optional(),
  identifier: z.string().optional(),
  mobile: z.string().optional(),
  password: z.string().min(6),
  confirmPassword: z.string().optional(), // from frontend
  role: z.nativeEnum(UserRole).optional(),
}).refine(data => data.email || data.identifier, {
  message: "Email or identifier is required"
}).transform(data => ({
  ...data,
  email: (data.email || data.identifier) as string,
  mobile: data.mobile || Math.floor(Math.random() * 10000000000).toString(),
}));

export const updateUserSchema = z.object({
  mobile: z.string().min(10).max(15).optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const userSchema = createUserSchema;
