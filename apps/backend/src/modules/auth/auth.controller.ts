import type { RequestHandler, Response } from 'express';

import { COOKIE_MAX_AGE_MS, COOKIE_NAME } from '../../common/constants/auth.js';
import { AppError } from '../../common/errors/AppError.js';
import { env } from '../../config/env.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import type { User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { AuthService } from './auth.service.js';

const authService = new AuthService();
const userService = new UserService();

/** Strip secrets and map fields for the frontend contract. */
function formatUser(user: User) {
  const { password, ...safe } = user;
  return {
    ...safe,
    id: user.userId,
    identifier: user.email ?? user.mobile ?? '',
    phone: user.mobile,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
  };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function requireUser(req: AuthRequest) {
  if (!req.user) throw new AppError(401, 'Authentication required');
  return req.user;
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    // Session lives in an httpOnly cookie; the body token is for API clients.
    setSessionCookie(res, result.token);
    res.json({
      success: true,
      data: { token: result.token, user: formatUser(result.user) },
    });
  } catch (error) {
    next(error);
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = requireUser(req as AuthRequest);
    const user = await authService.me(userId);
    res.json({ success: true, data: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true, data: { message: 'Logged out' } });
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = requireUser(req as AuthRequest);
    const user = await authService.updateName(userId, req.body.name);
    res.json({ success: true, data: { user: formatUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = requireUser(req as AuthRequest);
    const result = await authService.changePassword(userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.verifyOtpAndResetPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
