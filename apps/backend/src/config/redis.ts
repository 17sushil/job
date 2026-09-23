import { createClient } from 'redis';

import { env } from './env.js';

/** True once a real Redis connection is established. */
export let redisConnected = false;

export const redisClient = createClient({
  url: env.REDIS_URL,
  // Fail fast when Redis is down so the API can fall back to in-memory stores.
  socket: { reconnectStrategy: false },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('end', () => {
  redisConnected = false;
});

/* In-memory fallback so the API keeps working on machines without Redis. */
const memory = new Map<string, { value: string; expiresAt: number | null }>();

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

/** Connects Redis when available, otherwise falls back to memory. Never throws. */
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    redisConnected = redisClient.isOpen;
    console.log('Redis connected successfully.');
  } catch {
    redisConnected = false;
    console.warn(
      'Redis unavailable - rate limiting and OTPs fall back to in-memory storage.',
    );
  }
};

export async function kvSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  if (redisConnected) {
    await redisClient.set(
      key,
      value,
      ttlSeconds ? { EX: ttlSeconds } : undefined,
    );
    return;
  }
  memory.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

export async function kvGet(key: string): Promise<string | null> {
  if (redisConnected) return redisClient.get(key);
  return memoryGet(key);
}

export async function kvDel(key: string): Promise<void> {
  if (redisConnected) {
    await redisClient.del(key);
    return;
  }
  memory.delete(key);
}
