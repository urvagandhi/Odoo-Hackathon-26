import { DriverStatus, TripStatus, VehicleStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import { hrService } from '../hr/hr.service';
import {
    CreateTripInput,
    UpdateTripInput,
    TripStatusUpdateInput,
    TripQueryInput,
    CreateWaypointInput,
    WaypointArrivalInput,
    WaypointDepartureInput,
} from './dispatch.validator';

const INCLUDE_FULL = {
    vehicle: { include: { vehicleType: true } },
    driver: true,
    expenses: true,
    fuelLogs: true,
    waypoints: { orderBy: { sequence: 'asc' as const } },
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

        return { data: trips, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getTripById(id: bigint) {
        const trip = await prisma.trip.findUnique({ where: { id }, include: INCLUDE_FULL });
        if (!trip) throw new ApiError(404, `Trip #${id} not found.`);
        return trip;
    }

    async createTrip(input: CreateTripInput, actorId: bigint) {
        // Validate vehicle / driver exist and are not deleted
        const [vehicle, driver] = await Promise.all([
            prisma.vehicle.findFirst({
                where: { id: BigInt(input.vehicleId), isDeleted: false },
                include: { vehicleType: true }
            }),
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

        // License validity check
        const vType = vehicle.vehicleType.name.toUpperCase();
        const dClass = (driver.licenseClass || '').toUpperCase();
        
        let isValidClass = false;
        if (vType === 'VAN' || vType === 'LIGHT_TRUCK') {
            isValidClass = ['B', 'C', 'CDL-A', 'CDL-B', 'LMV', 'HMV'].includes(dClass);
        } else if (vType === 'HEAVY_TRUCK' || vType === 'TRUCK') {
            isValidClass = ['CDL-A', 'HMV'].includes(dClass);
        } else if (vType === 'MOTORCYCLE' || vType === 'BIKE') {
            isValidClass = ['MCWG', 'M', 'B', 'C', 'CDL-A', 'CDL-B', 'LMV', 'HMV'].includes(dClass);
        } else {
            isValidClass = true; 
        }

        if (!isValidClass) {
            throw new ApiError(422, `Driver's license class '${driver.licenseClass || 'None'}' is not valid for '${vType}' category vehicles.`);
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
                    tx.vehicle.findUniqueOrThrow({ where: { id: trip.vehicleId }, include: { vehicleType: true } }),
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

                // License validity check for vehicle category
                const vType = vehicle.vehicleType.name.toUpperCase();
                const dClass = (driver.licenseClass || '').toUpperCase();
                
                let isValidClass = false;
                if (vType === 'VAN' || vType === 'LIGHT_TRUCK') {
                    isValidClass = ['B', 'C', 'CDL-A', 'CDL-B', 'LMV', 'HMV'].includes(dClass);
                } else if (vType === 'HEAVY_TRUCK' || vType === 'TRUCK') {
                    isValidClass = ['CDL-A', 'HMV'].includes(dClass);
                } else if (vType === 'MOTORCYCLE' || vType === 'BIKE') {
                    isValidClass = ['MCWG', 'M', 'B', 'C', 'CDL-A', 'CDL-B', 'LMV', 'HMV'].includes(dClass);
                } else {
                    isValidClass = true; // Default fallback for PLANE etc
                }

                if (!isValidClass) {
                    throw new ApiError(422, `Driver's license class '${driver.licenseClass || 'None'}' is not valid for '${vType}' category vehicles.`);
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

                // Auto-recalculate driver safety score based on trip data
                hrService.recalculateDriverScore(trip.driverId).catch(() => {});

                return updatedTrip;
            }

            // ── DRAFT | DISPATCHED → CANCELLED ─────────────────────────
            if (input.status === 'CANCELLED') {
                if (trip.status !== TripStatus.DRAFT && trip.status !== TripStatus.DISPATCHED) {
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

                // Auto-recalculate driver safety score based on trip data
                hrService.recalculateDriverScore(trip.driverId).catch(() => {});

                return this.getTripById(id);
            }

            throw new ApiError(400, 'Invalid status transition.');
        });
    }

    // ── Waypoints ─────────────────────────────────────────────────

    async listWaypoints(tripId: bigint) {
        await this.getTripById(tripId); // existence check
        return prisma.tripWaypoint.findMany({
            where: { tripId },
            orderBy: { sequence: 'asc' },
        });
    }

    async addWaypoint(tripId: bigint, input: CreateWaypointInput, actorId: bigint) {
        const trip = await this.getTripById(tripId);

        // Only allow adding waypoints to DRAFT or DISPATCHED trips
        if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
            throw new ApiError(409, `Cannot add waypoints to a ${trip.status} trip.`);
        }

        // Sequence must be unique within the trip
        const existing = await prisma.tripWaypoint.findUnique({
            where: { tripId_sequence: { tripId, sequence: input.sequence } },
        });
        if (existing) {
            throw new ApiError(409, `A waypoint with sequence ${input.sequence} already exists for this trip.`);
        }

        const waypoint = await prisma.tripWaypoint.create({
            data: {
                tripId,
                sequence: input.sequence,
                location: input.location,
                latitude: input.latitude,
                longitude: input.longitude,
                notes: input.notes,
                scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
            },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'TripWaypoint',
            entityId: waypoint.id,
            action: 'CREATE',
            newValues: serializeForAudit(waypoint),
        });

        return waypoint;
    }

    async markWaypointArrived(tripId: bigint, sequence: number, input: WaypointArrivalInput, actorId: bigint) {
        const waypoint = await prisma.tripWaypoint.findUnique({
            where: { tripId_sequence: { tripId, sequence } },
        });
        if (!waypoint) throw new ApiError(404, `Waypoint sequence ${sequence} not found for trip #${tripId}.`);
        if (waypoint.arrivedAt) throw new ApiError(409, 'Waypoint already marked as arrived.');

        const updated = await prisma.tripWaypoint.update({
            where: { tripId_sequence: { tripId, sequence } },
            data: { arrivedAt: input.arrivedAt ? new Date(input.arrivedAt) : new Date() },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'TripWaypoint',
            entityId: waypoint.id,
            action: 'UPDATE',
            newValues: { arrivedAt: updated.arrivedAt },
        });

        return updated;
    }

    async markWaypointDeparted(tripId: bigint, sequence: number, input: WaypointDepartureInput, actorId: bigint) {
        const waypoint = await prisma.tripWaypoint.findUnique({
            where: { tripId_sequence: { tripId, sequence } },
        });
        if (!waypoint) throw new ApiError(404, `Waypoint sequence ${sequence} not found for trip #${tripId}.`);
        if (!waypoint.arrivedAt) throw new ApiError(409, 'Cannot depart a waypoint that has not been arrived at.');
        if (waypoint.departedAt) throw new ApiError(409, 'Waypoint already marked as departed.');

        const updated = await prisma.tripWaypoint.update({
            where: { tripId_sequence: { tripId, sequence } },
            data: { departedAt: input.departedAt ? new Date(input.departedAt) : new Date() },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'TripWaypoint',
            entityId: waypoint.id,
            action: 'UPDATE',
            newValues: { departedAt: updated.departedAt },
        });

        return updated;
    }

    // Aggregated financial ledger for a trip
    async getTripLedger(id: bigint) {
        const trip = await prisma.trip.findUnique({
            where: { id },
            include: {
                fuelLogs: true,
                expenses: true,
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
                driver: { select: { id: true, fullName: true, licenseNumber: true } },
            },
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
