import { app } from './app.js';
import { database } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, async () => {
  console.log(`API running on http://localhost:${env.PORT}`);
  try {
    await database.connect();
  } catch (err) {
    console.error('Initial database connection warning:', err);
  }
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await database.disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

