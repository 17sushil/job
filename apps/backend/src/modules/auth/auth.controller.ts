import type { RequestHandler } from 'express';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';

const authService = new AuthService();
const userService = new UserService();

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    // We can reuse the UserService's createUser method for registration
    const user = await userService.createUser(req.body);
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: userWithoutPassword });
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
