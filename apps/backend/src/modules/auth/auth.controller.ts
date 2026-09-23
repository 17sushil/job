import type { RequestHandler } from 'express';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';

const authService = new AuthService();
const userService = new UserService();

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    // Never send the password hash back to the client.
    const { password, ...safeUser } = result.user;
    // Map fields for Sushil's frontend compatibility
    const formattedUser = {
      ...safeUser,
      id: result.user.userId,
      identifier: result.user.email || result.user.mobile,
      phone: result.user.mobile,
      name: null,
      role: result.user.role.toLowerCase()
    };
    res.json({ success: true, data: { token: result.token, user: formattedUser } });
  } catch (error) {
    next(error);
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    const { password, ...userWithoutPassword } = user;
    const formattedUser = { 
      ...userWithoutPassword, 
      id: user.userId,
      identifier: user.email || user.mobile,
      phone: user.mobile,
      name: null,
      role: user.role.toLowerCase()
    };
    res.status(201).json({ success: true, data: { user: formattedUser } });
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
