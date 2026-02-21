import { PrismaClient } from '@prisma/client';

// ── BigInt JSON serialization ─────────────────────────────────────────
// Prisma uses BigInt for IDs. JSON.stringify cannot serialize BigInt natively.
// This polyfill converts BigInt to string during JSON serialization.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
    return this.toString();
};

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'warn', 'error']
                : ['warn', 'error'],
    });

// Prevent multiple Prisma Client instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
