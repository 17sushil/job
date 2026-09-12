import type { User as PrismaUser } from '@prisma/client';
import type { z } from 'zod';
import type { createUserSchema, updateUserSchema } from './user.schema.js';

export type User = PrismaUser;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

