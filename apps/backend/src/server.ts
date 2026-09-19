import { app } from './app.js';
import { database } from './config/database.js';
import { env } from './config/env.js';
import { connectRedis, redisClient } from './config/redis.js';

const start = async () => {
  try {
    await database.connect();
    await connectRedis();
    console.log('Redis connected successfully.');
  } catch (err) {
    console.error('Unable to initialize connections:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(() => {
      redisClient.quit();
      void database.disconnect().finally(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

void start();
