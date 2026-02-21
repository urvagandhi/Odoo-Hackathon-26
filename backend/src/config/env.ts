import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(32).optional(),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
    console.error('❌  Invalid environment variables:\n', _parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
