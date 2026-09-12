import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://jobdev:jobdev@localhost:5432/jobdev?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export const env = schema.parse(process.env);

