import { Router } from 'express';

import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { createUserSchema } from '../user/user.schema.js';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  register,
  updateProfile,
  verifyOtp,
} from './auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from './auth.schema.js';

export const authRoutes = Router();

// Apply auth-specific stricter rate limits to all auth routes.
authRoutes.use(authRateLimiter);

authRoutes.post('/register', validate(createUserSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoutes.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
authRoutes.post('/logout', logout);

// Session endpoints (cookie-authenticated).
authRoutes.get('/me', authMiddleware, me);
authRoutes.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  updateProfile,
);
authRoutes.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  changePassword,
);
