import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { AppDataSource } from './database/data-source.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { recruiterRoutes } from './modules/recruiter/recruiter.routes.js';
import { userRoutes } from './modules/user/user.routes.js';

export const app = express();

// Security Middlewares
app.use(helmet());
app.use(globalRateLimiter);

// Performance: gzip all JSON responses.
app.use(compression());

// Credentials: true so the httpOnly session cookie flows cross-origin in dev.
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
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
app.use('/api/admin', adminRoutes);
app.use('/api', recruiterRoutes);
app.use(errorHandler);
