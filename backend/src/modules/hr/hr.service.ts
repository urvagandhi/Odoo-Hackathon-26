import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateDriverInput,
    UpdateDriverInput,
    DriverStatusUpdateInput,
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
                include: {
                    userAccount: { select: { id: true, email: true, fullName: true, role: true } },
                    trips: { where: { status: 'DISPATCHED' }, select: { id: true, status: true, origin: true, destination: true }, take: 1 },
                },
                orderBy: { fullName: 'asc' },
                skip,
                take: limit,
            }),
            prisma.driver.count({ where }),
        ]);

        return { data: drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getDriverById(id: bigint) {
        const driver = await prisma.driver.findFirst({
            where: { id, isDeleted: false },
            include: {
                userAccount: { select: { id: true, email: true, fullName: true, role: true } },
                trips: { orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, status: true, origin: true, destination: true, revenue: true, createdAt: true } },
                incidents: { orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, incidentType: true, title: true, status: true, createdAt: true } },
            },
        });
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

    /**
     * Get trip-based stats for a driver: completed, cancelled, total trips, incidents.
     * Also includes unrated completed trip count and average rating.
     */
    async getDriverTripStats(driverId: bigint) {
        const [completed, cancelled, dispatched, total, incidents, ratedTrips] = await prisma.$transaction([
            prisma.trip.count({ where: { driverId, status: 'COMPLETED' } }),
            prisma.trip.count({ where: { driverId, status: 'CANCELLED' } }),
            prisma.trip.count({ where: { driverId, status: 'DISPATCHED' } }),
            prisma.trip.count({ where: { driverId } }),
            prisma.incidentReport.count({ where: { driverId } }),
            prisma.trip.findMany({
                where: { driverId, status: 'COMPLETED', rating: { not: null } },
                select: { rating: true },
            }),
        ]);

        const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 100;

        // Rating stats
        const unrated = completed - ratedTrips.length;
        const avgRating = ratedTrips.length > 0
            ? Math.round(ratedTrips.reduce((s, t) => s + (t.rating ?? 0), 0) / ratedTrips.length * 10) / 10
            : null;

        // Safety score: blend completion rate, incidents, and avg trip rating
        // Base = completion rate (0-100), deduct 5 per incident
        let baseScore = total > 0 ? (completed / total) * 100 : 100;
        baseScore = Math.max(0, baseScore - (incidents * 5));

        // Incorporate avg trip rating when available (60% base, 40% rating)
        let score: number;
        if (avgRating !== null && ratedTrips.length > 0) {
            score = baseScore * 0.6 + avgRating * 0.4;
        } else {
            score = baseScore;
        }
        score = Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;

        return { completed, cancelled, dispatched, total, incidents, completionRate, score, unrated, avgRating };
    }

    /**
     * Get all trips for a specific driver, ordered by most recent first.
     * Includes vehicle info for display.
     */
    async getDriverTrips(driverId: bigint) {
        const driver = await prisma.driver.findFirst({ where: { id: driverId, isDeleted: false } });
        if (!driver) throw new ApiError(404, `Driver #${driverId} not found.`);

        const trips = await prisma.trip.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                origin: true,
                destination: true,
                status: true,
                rating: true,
                revenue: true,
                distanceEstimated: true,
                distanceActual: true,
                createdAt: true,
                completionTime: true,
                cancelledReason: true,
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
            },
        });

        return trips;
    }

    /**
     * Rate a completed trip (0–100) for a specific driver.
     * Validates that the trip belongs to the given driver.
     * Uses a transaction to ensure rating + score recalculation are atomic.
     */
    async rateTripForDriver(driverId: bigint, tripId: bigint, rating: number) {
        const trip = await prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) throw new ApiError(404, `Trip #${tripId} not found.`);
        if (trip.driverId !== driverId) {
            throw new ApiError(403, `Trip #${tripId} does not belong to driver #${driverId}.`);
        }
        if (trip.status !== 'COMPLETED') {
            throw new ApiError(400, 'Only completed trips can be rated.');
        }
        if (rating < 0 || rating > 100) {
            throw new ApiError(400, 'Rating must be between 0 and 100.');
        }

        const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.trip.update({
                where: { id: tripId },
                data: { rating },
            });

            // Recalculate driver safety score within the same transaction
            const stats = await this.getDriverTripStats(driverId);
            await tx.driver.update({
                where: { id: driverId },
                data: { safetyScore: stats.score },
            });

            return result;
        });

        return updated;
    }

    /**
     * Recalculate and persist a driver's safety score from trip data.
     * Called automatically when trips complete / cancel.
     */
    async recalculateDriverScore(driverId: bigint) {
        const stats = await this.getDriverTripStats(driverId);
        await prisma.driver.update({
            where: { id: driverId },
            data: { safetyScore: stats.score },
        });
        return stats.score;
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

    /**
     * Manager-only: link a system User account to a Driver record.
     * Enables driver self-service (status updates, GPS location posting).
     * Passing userId=null unlinks the account.
     */
    async linkUserToDriver(driverId: bigint, userId: bigint | null, actorId: bigint) {
        const driver = await prisma.driver.findFirst({ where: { id: driverId, isDeleted: false } });
        if (!driver) throw new ApiError(404, `Driver #${driverId} not found.`);

        if (userId !== null) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new ApiError(404, `User #${userId} not found.`);
            if (!user.isActive) throw new ApiError(400, 'Cannot link a deactivated user account.');

            // Check no other driver is already linked to this user
            const conflict = await prisma.driver.findFirst({ where: { userId, isDeleted: false } });
            if (conflict && conflict.id !== driverId) {
                throw new ApiError(409, `User #${userId} is already linked to driver #${conflict.id}.`);
            }
        }

        const updated = await prisma.driver.update({
            where: { id: driverId },
            data: { userId },
            select: { id: true, fullName: true, licenseNumber: true, userId: true },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Driver',
            entityId: driverId,
            action: 'UPDATE',
            oldValues: { userId: driver.userId?.toString() ?? null },
            newValues: { userId: userId?.toString() ?? null },
            reason: userId ? `Linked to user #${userId}` : 'User account unlinked',
        });

        return updated;
    }
}

export const hrService = new HrService();
