import type { z } from 'zod';
import type { User as UserEntity } from './user.entity.js';
import type { createUserSchema, updateUserSchema } from './user.schema.js';

export type User = UserEntity;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
