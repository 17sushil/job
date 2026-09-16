import cors from 'cors';
import express from 'express';
import { AppDataSource } from './database/data-source.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database connection has not been initialized');
    }
    await AppDataSource.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);
