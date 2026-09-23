import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { redisClient, redisConnected } from '../config/redis.js';

const redisStore = () =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

// General rate limiter for all routes (Redis-backed when Redis is up).
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  ...(redisConnected ? { store: redisStore() } : {}),
});

// Stricter rate limiter for auth routes (e.g. login, register, otp).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisConnected ? { store: redisStore() } : {}),
});
