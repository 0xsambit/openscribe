import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Also try backend-local .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/openscribe?schema=public'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ENCRYPTION_MASTER_KEY: z.string().min(32),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  RATE_LIMIT_API_PER_HOUR: z.coerce.number().default(100),
  RATE_LIMIT_GENERATIONS_PER_DAY: z.coerce.number().default(50),
  RATE_LIMIT_GLOBAL_PER_HOUR: z.coerce.number().default(1000),

  UPLOAD_MAX_SIZE_MB: z.coerce.number().default(10),
  UPLOAD_DIR: z.string().default('./uploads'),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error(`❌ Environment validation failed:\n${missing}`);
    console.error('\nCopy .env.example to .env and fill in required values.');
    process.exit(1);
  }
  throw error;
}

export { env };
