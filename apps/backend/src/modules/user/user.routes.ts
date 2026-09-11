import { Router } from 'express';
import { getUser } from './user.controller.js';
export const userRoutes = Router();
userRoutes.get('/', getUser);
