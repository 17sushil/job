import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';
import { createUserSchema } from '../user/user.schema.js';
import {
  login,
  register,
  forgotPassword,
  verifyOtp,
} from './auth.controller.js';
import {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
} from './auth.schema.js';

export const authRoutes = Router();

// Apply auth-specific stricter rate limits to all auth routes.
authRoutes.use(authRateLimiter);

authRoutes.post('/register', validate(createUserSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoutes.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
