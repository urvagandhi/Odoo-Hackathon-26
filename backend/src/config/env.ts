import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file first, then fall back to base .env
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // fallback

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // DIRECT_URL required in production (Prisma migrations bypass pgBouncer)
    DIRECT_URL: z.string().optional(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(32).optional(),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    CORS_ORIGINS: z.string().default('http://localhost:5173'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100000),
    // ── SMTP (optional — falls back to Ethereal test account in dev) ──
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('FleetFlow Alerts <alerts@fleetflow.io>'),
    SMTP_ALERT_TO: z.string().default('manager@fleetflow.io'),
});

const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
    console.error('❌  Invalid environment variables:\n', _parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
