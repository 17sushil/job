import type { RequestHandler } from 'express';
export const login: RequestHandler = (_req, res) => res.json({ message: 'Login endpoint' });
