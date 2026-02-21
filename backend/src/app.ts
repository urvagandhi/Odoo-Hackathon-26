import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';

// Module routers
import { authRouter } from './modules/auth/auth.routes';
import { fleetRouter } from './modules/fleet/fleet.routes';
import { dispatchRouter } from './modules/dispatch/dispatch.routes';
import { hrRouter } from './modules/hr/hr.routes';
import { financeRouter } from './modules/finance/finance.routes';
import { locationsRouter } from './modules/locations/locations.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';

export function createApp(): Application {
    const app = express();

    // ── Security headers ──────────────────────────────────────────
    app.use(helmet());

    // ── CORS ──────────────────────────────────────────────────────
    const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`Origin ${origin} not allowed by CORS`));
                }
            },
            credentials: true,
        }),
    );

    // ── Request logging ───────────────────────────────────────────
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // ── Body parsing ──────────────────────────────────────────────
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ── Global rate limiter ───────────────────────────────────────
    const limiter = rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests — please try again later.',
        },
    });
    app.use('/api/', limiter);

    // ── Health check (no auth) ────────────────────────────────────
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    });

    // ── Swagger UI — GET /api/docs ────────────────────────────────
    // Helmet sets a strict CSP globally; override it for the docs route
    // so Swagger UI can load its inline scripts and styles.
    app.use('/api/docs', (_req: Request, res: Response, next: NextFunction) => {
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
        );
        next();
    });
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'FleetFlow API Docs',
        swaggerOptions: { persistAuthorization: true },
    }));

    // ── API v1 Routes ─────────────────────────────────────────────
    const v1 = '/api/v1';
    app.use(`${v1}/auth`, authRouter);
    app.use(`${v1}/fleet`, fleetRouter);
    app.use(`${v1}/trips`, dispatchRouter);
    app.use(`${v1}/drivers`, hrRouter);
    app.use(`${v1}/finance`, financeRouter);
    app.use(`${v1}/locations`, locationsRouter);
    app.use(`${v1}/analytics`, analyticsRouter);

    // ── 404 catch-all ─────────────────────────────────────────────
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: `Route ${req.method} ${req.originalUrl} not found`,
        });
    });

    // ── Global error handler (must be last) ───────────────────────
    app.use(errorHandler);

    return app;
}
