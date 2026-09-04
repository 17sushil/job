import type { RequestHandler } from 'express';
export const getUser: RequestHandler = (_req, res) => res.json({ message: 'User endpoint' });
