import jwt from 'jsonwebtoken';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../common/errors/AppError.js';
import { COOKIE_NAME } from '../common/constants/auth.js';
import { env } from '../config/env.js';
import type { UserRole } from '../modules/user/user.entity.js';

export interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole };
}

/**
 * Verifies the session JWT from the httpOnly cookie (or a Bearer header for
 * API clients) and attaches { userId, role } to the request.
 */
export const authMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const request = req as AuthRequest;
  const bearer = req.headers.authorization;
  const token =
    (req.cookies?.[COOKIE_NAME] as string | undefined) ??
    (bearer?.startsWith('Bearer ') ? bearer.slice(7) : undefined);

  if (!token) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      role: UserRole;
    };
    request.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired session'));
  }
};

/** Role guard. Must run after authMiddleware. */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    const request = req as AuthRequest;
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError(403, 'You do not have permission to perform this action'));
      return;
    }
    next();
  };
