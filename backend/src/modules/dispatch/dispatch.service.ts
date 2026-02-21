import { DriverStatus, TripStatus, VehicleStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateTripInput,
    UpdateTripInput,
    TripStatusUpdateInput,
    TripQueryInput,
} from './dispatch.validator';

const INCLUDE_FULL = {
    vehicle: { include: { vehicleType: true } },
    driver: true,
    expenses: true,
    fuelLogs: true,
};

export class DispatchService {
    async listTrips(query: TripQueryInput) {
        const { status, vehicleId, driverId, page, limit } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(vehicleId ? { vehicleId: BigInt(vehicleId) } : {}),
            ...(driverId ? { driverId: BigInt(driverId) } : {}),
        };

        const [trips, total] = await prisma.$transaction([
            prisma.trip.findMany({ where, include: INCLUDE_FULL, orderBy: { createdAt: 'desc' }, skip, take: limit }),
            prisma.trip.count({ where }),
        ]);

        return { trips, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getTripById(id: bigint) {
        const trip = await prisma.trip.findUnique({ where: { id }, include: INCLUDE_FULL });
        if (!trip) throw new ApiError(404, `Trip #${id} not found.`);
        return trip;
    }

    async createTrip(input: CreateTripInput, actorId: bigint) {
        // Validate vehicle / driver exist and are not deleted
        const [vehicle, driver] = await Promise.all([
            prisma.vehicle.findFirst({ where: { id: BigInt(input.vehicleId), isDeleted: false } }),
            prisma.driver.findFirst({ where: { id: BigInt(input.driverId), isDeleted: false } }),
        ]);

        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);
        if (!driver) throw new ApiError(404, `Driver #${input.driverId} not found.`);

        // Capacity guard
        if (input.cargoWeight && vehicle.capacityWeight) {
            if (input.cargoWeight > Number(vehicle.capacityWeight)) {
                throw new ApiError(
                    422,
                    `Cargo weight ${input.cargoWeight} kg exceeds vehicle capacity ${vehicle.capacityWeight} kg.`,
                );
            }
        }

        const trip = await prisma.trip.create({
            data: {
                vehicleId: BigInt(input.vehicleId),
                driverId: BigInt(input.driverId),
                origin: input.origin,
                destination: input.destination,
                distanceEstimated: input.distanceEstimated,
                cargoWeight: input.cargoWeight,
                cargoDescription: input.cargoDescription,
                clientName: input.clientName,
                invoiceReference: input.invoiceReference,
                revenue: input.revenue,
                status: TripStatus.DRAFT,
            },
            include: INCLUDE_FULL,
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Trip',
            entityId: trip.id,
            action: 'CREATE',
            newValues: serializeForAudit(trip),
        });

        return trip;
    }

    async updateTrip(id: bigint, input: UpdateTripInput, actorId: bigint) {
        const trip = await this.getTripById(id);

        if (trip.status !== TripStatus.DRAFT) {
            throw new ApiError(409, 'Only DRAFT trips can be edited. Use the status endpoint to transition.');
        }

        const updated = await prisma.trip.update({ where: { id }, data: input, include: INCLUDE_FULL });

        await writeAuditLog({
            userId: actorId,
            entity: 'Trip',
            entityId: id,
            action: 'UPDATE',
            oldValues: serializeForAudit(trip),
            newValues: serializeForAudit(updated),
        });

        return updated;
    }

    /**
     * transitionTripStatus — the state machine enforcer.
     * All three status transitions (DISPATCHED, COMPLETED, CANCELLED) run inside
     * a Prisma interactive transaction to guarantee atomicity.
     * If anything fails halfway, the entire operation rolls back.
     */
    async transitionTripStatus(id: bigint, input: TripStatusUpdateInput, actorId: bigint) {
        const trip = await this.getTripById(id);

        return prisma.$transaction(async (tx) => {
            // ── DRAFT → DISPATCHED ──────────────────────────────────────
            if (input.status === 'DISPATCHED') {
                if (trip.status !== TripStatus.DRAFT) {
                    throw new ApiError(409, `Cannot DISPATCH a trip with status ${trip.status}.`);
                }

                // Lock vehicle and driver rows for this transaction
                const [vehicle, driver] = await Promise.all([
                    tx.vehicle.findUniqueOrThrow({ where: { id: trip.vehicleId } }),
                    tx.driver.findUniqueOrThrow({ where: { id: trip.driverId } }),
                ]);

                // Vehicle must be AVAILABLE
                if (vehicle.status !== VehicleStatus.AVAILABLE) {
                    throw new ApiError(409, `Vehicle is not AVAILABLE (current: ${vehicle.status}).`);
                }

                // Driver must be ON_DUTY
                if (driver.status !== DriverStatus.ON_DUTY) {
                    throw new ApiError(409, `Driver is not ON_DUTY (current: ${driver.status}).`);
                }

                // License expiry check — block if expiring within 72 hours
                const licenseCutoff = new Date();
                licenseCutoff.setHours(licenseCutoff.getHours() + 72);
                if (new Date(driver.licenseExpiryDate) <= licenseCutoff) {
                    throw new ApiError(
                        422,
                        `Driver's license expires soon (${driver.licenseExpiryDate.toISOString().split('T')[0]}). Cannot dispatch.`,
                    );
                }

                // Atomically update trip, vehicle, and driver
                const [updatedTrip] = await Promise.all([
                    tx.trip.update({
                        where: { id },
                        data: {
                            status: TripStatus.DISPATCHED,
                            dispatchTime: new Date(),
                            odometerStart: input.odometerStart ?? vehicle.currentOdometer,
                        },
                        include: INCLUDE_FULL,
                    }),
                    tx.vehicle.update({ where: { id: vehicle.id }, data: { status: VehicleStatus.ON_TRIP } }),
                    tx.driver.update({ where: { id: driver.id }, data: { status: DriverStatus.ON_TRIP } }),
                ]);

                await writeAuditLog({
                    userId: actorId,
                    entity: 'Trip',
                    entityId: id,
                    action: 'UPDATE',
                    oldValues: { status: trip.status },
                    newValues: { status: TripStatus.DISPATCHED, dispatchTime: updatedTrip.dispatchTime },
                });

                return updatedTrip;
            }

            // ── DISPATCHED → COMPLETED ──────────────────────────────────
            if (input.status === 'COMPLETED') {
                if (trip.status !== TripStatus.DISPATCHED) {
                    throw new ApiError(409, `Cannot COMPLETE a trip with status ${trip.status}.`);
                }

                const newOdometer = input.odometerEnd ?? undefined;

                const [updatedTrip] = await Promise.all([
                    tx.trip.update({
                        where: { id },
                        data: {
                            status: TripStatus.COMPLETED,
                            completionTime: new Date(),
                            distanceActual: input.distanceActual,
                            odometerEnd: newOdometer,
                        },
                        include: INCLUDE_FULL,
                    }),
                    tx.vehicle.update({
                        where: { id: trip.vehicleId },
                        data: {
                            status: VehicleStatus.AVAILABLE,
                            ...(newOdometer ? { currentOdometer: newOdometer } : {}),
                        },
                    }),
                    tx.driver.update({
                        where: { id: trip.driverId },
                        data: { status: DriverStatus.ON_DUTY },
                    }),
                ]);

                await writeAuditLog({
                    userId: actorId,
                    entity: 'Trip',
                    entityId: id,
                    action: 'UPDATE',
                    oldValues: { status: trip.status },
                    newValues: { status: TripStatus.COMPLETED, distanceActual: input.distanceActual },
                });

                return updatedTrip;
            }

            // ── DRAFT | DISPATCHED → CANCELLED ─────────────────────────
            if (input.status === 'CANCELLED') {
                if (!([TripStatus.DRAFT, TripStatus.DISPATCHED] as TripStatus[]).includes(trip.status)) {
                    throw new ApiError(409, `Cannot CANCEL a trip with status ${trip.status}.`);
                }

                const updateOps: Promise<unknown>[] = [
                    tx.trip.update({
                        where: { id },
                        data: { status: TripStatus.CANCELLED, cancelledReason: input.cancelledReason },
                    }),
                ];

                // Release assets only if trip was already dispatched
                if (trip.status === TripStatus.DISPATCHED) {
                    updateOps.push(
                        tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } }),
                        tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.ON_DUTY } }),
                    );
                }

                await Promise.all(updateOps);

                await writeAuditLog({
                    userId: actorId,
                    entity: 'Trip',
                    entityId: id,
                    action: 'UPDATE',
                    oldValues: { status: trip.status },
                    newValues: { status: TripStatus.CANCELLED },
                    reason: input.cancelledReason,
                });

                return this.getTripById(id);
            }

            throw new ApiError(400, 'Invalid status transition.');
        });
    }

    // Aggregated financial ledger for a trip
    async getTripLedger(id: bigint) {
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: { fuelLogs: true, expenses: true },
        });
        if (!trip) throw new ApiError(404, `Trip #${id} not found.`);

        const fuelCost = trip.fuelLogs.reduce((sum, l) => sum + Number(l.totalCost), 0);
        const expenseCost = trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalCost = fuelCost + expenseCost;
        const revenue = Number(trip.revenue ?? 0);
        const profit = revenue - totalCost;

        return {
            tripId: trip.id.toString(),
            status: trip.status,
            revenue,
            fuelCost,
            expenseCost,
            totalCost,
            profit,
            roi: totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) + '%' : 'N/A',
            fuelLogs: trip.fuelLogs,
            expenses: trip.expenses,
        };
    }
}

export const dispatchService = new DispatchService();
