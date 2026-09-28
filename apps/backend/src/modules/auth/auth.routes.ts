import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import {
  getCurrentUser,
  login,
  logoutUser,
  register,
  updateProfile,
  verifyOtp,
} from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from './auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
authRoutes.get('/me', authMiddleware, getCurrentUser);
authRoutes.post('/logout', authMiddleware, logoutUser);
authRoutes.patch('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
