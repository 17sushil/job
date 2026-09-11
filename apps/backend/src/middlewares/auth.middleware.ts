import type { RequestHandler } from 'express';
export const authMiddleware: RequestHandler = (_req, _res, next) => next();
