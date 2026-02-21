import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateDriverInput,
    UpdateDriverInput,
    DriverStatusUpdateInput,
    AdjustSafetyScoreInput,
    DriverQueryInput,
} from './hr.validator';
import { DriverStatus } from '@prisma/client';

export class HrService {
    async listDrivers(query: DriverQueryInput) {
        const { status, page, limit } = query;
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false,
            ...(status ? { status } : {}),
        };

        const [drivers, total] = await prisma.$transaction([
            prisma.driver.findMany({
                where,
                orderBy: { fullName: 'asc' },
                skip,
                take: limit,
            }),
            prisma.driver.count({ where }),
        ]);

        return { drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getDriverById(id: bigint) {
        const driver = await prisma.driver.findFirst({ where: { id, isDeleted: false } });
        if (!driver) throw new ApiError(404, `Driver #${id} not found.`);
        return driver;
    }

    async createDriver(input: CreateDriverInput, actorId: bigint) {
        const expiryDate = new Date(input.licenseExpiryDate);
        if (expiryDate <= new Date()) {
            throw new ApiError(422, 'License expiry date must be in the future.');
        }

        const driver = await prisma.driver.create({
            data: {
                licenseNumber: input.licenseNumber,
                fullName: input.fullName,
                phone: input.phone,
                email: input.email,
                dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
                licenseExpiryDate: expiryDate,
                licenseClass: input.licenseClass,
                safetyScore: input.safetyScore ?? 100,
            },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: driver.id,
            action: 'CREATE',
            newValues: serializeForAudit(driver),
        });

        return driver;
    }

    async updateDriver(id: bigint, input: UpdateDriverInput, actorId: bigint) {
        const existing = await this.getDriverById(id);

        const data: Record<string, unknown> = { ...input };
        if (input.licenseExpiryDate) data.licenseExpiryDate = new Date(input.licenseExpiryDate);
        if (input.dateOfBirth) data.dateOfBirth = new Date(input.dateOfBirth);

        const updated = await prisma.driver.update({ where: { id }, data });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: id,
            action: 'UPDATE',
            oldValues: serializeForAudit(existing),
            newValues: serializeForAudit(updated),
        });

        return updated;
    }

    async updateDriverStatus(id: bigint, input: DriverStatusUpdateInput, actorId: bigint) {
        const driver = await this.getDriverById(id);

        // Driver ON_TRIP state is exclusively managed by the dispatch service
        if (driver.status === DriverStatus.ON_TRIP) {
            throw new ApiError(409, 'Driver is ON_TRIP. Status is managed by the dispatch module.');
        }

        const updated = await prisma.driver.update({
            where: { id },
            data: { status: input.status },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: id,
            action: 'UPDATE',
            oldValues: { status: driver.status },
            newValues: { status: updated.status },
            reason: input.reason,
        });

        return updated;
    }

    async adjustSafetyScore(id: bigint, input: AdjustSafetyScoreInput, actorId: bigint) {
        const driver = await this.getDriverById(id);
        const currentScore = Number(driver.safetyScore);
        const newScore = Math.min(100, Math.max(0, currentScore + input.adjustment));

        const updated = await prisma.driver.update({
            where: { id },
            data: { safetyScore: newScore },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: id,
            action: 'UPDATE',
            oldValues: { safetyScore: currentScore },
            newValues: { safetyScore: newScore },
            reason: input.reason,
        });

        return updated;
    }

    async softDeleteDriver(id: bigint, actorId: bigint) {
        const driver = await this.getDriverById(id);

        if (driver.status === DriverStatus.ON_TRIP) {
            throw new ApiError(409, 'Cannot delete a driver that is currently ON_TRIP.');
        }

        const updated = await prisma.driver.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: id,
            action: 'DELETE',
            oldValues: serializeForAudit(driver),
        });

        return updated;
    }

    // Drivers with license expiring within N days — for dashboard alerts
    async getExpiringLicenses(daysAhead: number = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + daysAhead);

        return prisma.driver.findMany({
            where: {
                isDeleted: false,
                status: { not: DriverStatus.SUSPENDED },
                licenseExpiryDate: { lte: cutoff },
            },
            orderBy: { licenseExpiryDate: 'asc' },
        });
    }
}

export const hrService = new HrService();
