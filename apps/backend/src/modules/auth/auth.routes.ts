import { Router } from 'express';

import {
  changePassword,
  login,
  register,
  updateProfile,
} from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.patch('/profile', updateProfile);
authRoutes.post('/change-password', changePassword);