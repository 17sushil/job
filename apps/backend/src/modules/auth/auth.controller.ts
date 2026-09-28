import type { RequestHandler } from 'express';
import {
  AuthService,
  COOKIE_NAME,
  cookieOptions,
  signSession,
  toSafeUser,
} from './auth.service.js';

const authService = new AuthService();

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: { requiresOtp: true, identifier: user.email ?? user.mobile },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.startLogin(req.body);
    res.json({
      success: true,
      data: { requiresOtp: true, identifier: result.identifier },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.verifyOtp(req.body);
    res
      .cookie(COOKIE_NAME, signSession(user), cookieOptions())
      .json({ success: true, data: { user: toSafeUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  res.json({ success: true, data: { user: toSafeUser(req.user!) } });
};

export const logoutUser: RequestHandler = async (_req, res) => {
  res
    .clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined })
    .json({ success: true, data: { message: 'Logged out' } });
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: { user: toSafeUser(user) } });
  } catch (error) {
    next(error);
  }
};
