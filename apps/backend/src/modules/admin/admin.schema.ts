import { z } from 'zod';

import { UserRole } from '../user/user.entity.js';

export const adminCreateUserSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    email: z.string().trim().min(1).optional(),
    mobile: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole),
  })
  .refine((data) => Boolean(data.identifier || data.email || data.mobile), {
    message: 'Email or phone is required',
  });

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  blocked: z.boolean().optional(),
  role: z.nativeEnum(UserRole).optional(),
});
