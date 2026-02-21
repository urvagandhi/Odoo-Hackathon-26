import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './prisma';

async function bootstrap(): Promise<void> {
    // Verify DB connection before accepting traffic
    try {
        await prisma.$connect();
        console.log('✅  PostgreSQL connected via Prisma');
    } catch (err) {
        console.error('❌  Failed to connect to PostgreSQL:', err);
        process.exit(1);
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
        console.log(`🚀  FleetFlow API running on http://localhost:${env.PORT}`);
        console.log(`📦  Environment: ${env.NODE_ENV}`);
        console.log(`📋  Health: http://localhost:${env.PORT}/health`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────
    const shutdown = async (signal: string) => {
        console.log(`\n🛑  ${signal} received. Gracefully shutting down...`);
        server.close(async () => {
            await prisma.$disconnect();
            console.log('✅  Prisma disconnected. Server closed.');
            process.exit(0);
        });

        // Force exit after 10s if graceful shutdown stalls
        setTimeout(() => {
            console.error('⚠️  Forced shutdown after timeout');
            process.exit(1);
        }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ── Unhandled rejections ──────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
        console.error('❌  Unhandled Promise Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
        console.error('❌  Uncaught Exception:', err);
        process.exit(1);
    });
}

bootstrap();
