import express from 'express';
import { userRoutes } from './modules/user/user.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);
