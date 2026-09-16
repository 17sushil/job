import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
});

export const userSchema = createUserSchema;
