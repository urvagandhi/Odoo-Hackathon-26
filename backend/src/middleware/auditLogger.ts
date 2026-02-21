import { AuditAction, Prisma } from '@prisma/client';
import prisma from '../prisma';

interface AuditLogInput {
    userId?: bigint | null;
    entity: string;
    entityId: bigint;
    action: AuditAction;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * writeAuditLog — inserts an immutable audit record.
 * Call this inside Prisma $transaction blocks or as standalone.
 * Never throws — audit failures are logged to stderr but never block
 * the primary operation to preserve operational continuity.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: input.userId ?? null,
                entity: input.entity,
                entityId: input.entityId,
                action: input.action,
                oldValues: (input.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
                newValues: (input.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
                reason: input.reason,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            },
        });
    } catch (err) {
        // Audit failures MUST NOT crash the API — log and continue
        console.error('⚠️  Audit log write failed (non-fatal):', err);
    }
}

/**
 * Serializes a Prisma entity for storage in audit log JSON fields.
 * Converts BigInt values to strings for JSON serialization safety.
 */
export function serializeForAudit(obj: unknown): Record<string, unknown> {
    return JSON.parse(
        JSON.stringify(obj, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value,
        ),
    );
}
