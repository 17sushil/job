import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from './user.controller.js';
import { createUserSchema, updateUserSchema } from './user.schema.js';
import { validate } from '../../middlewares/validate.js';

export const userRoutes = Router();

userRoutes.get('/', listUsers);
userRoutes.post('/', validate(createUserSchema), createUser);
userRoutes.get('/:id', getUser);
userRoutes.put('/:id', validate(updateUserSchema), updateUser);
userRoutes.delete('/:id', deleteUser);
