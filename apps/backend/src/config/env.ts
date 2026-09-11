import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = schema.parse(process.env);
