import type { RequestHandler } from 'express';

import { AuthService } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schema.js';

const authService = new AuthService();

export const register: RequestHandler = async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res
      .status(201)
      .json({ data: result, message: 'Account created successfully' });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json({ data: result, message: 'Logged in successfully' });
  } catch (error) {
    next(error);
  }
};