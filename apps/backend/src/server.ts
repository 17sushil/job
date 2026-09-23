import { database } from './config/database.js';
import { env } from './config/env.js';
import { connectRedis, redisClient } from './config/redis.js';

const start = async () => {
  try {
    await database.connect();
  } catch (err) {
    console.error('Unable to initialize the database connection:', err);
    process.exit(1);
  }

  // Redis is optional: the API falls back to in-memory stores when it is down.
  await connectRedis();

  const { app } = await import('./app.js');

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
