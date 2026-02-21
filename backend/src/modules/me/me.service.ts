/**
 * FleetFlow — Driver Self-Service ("me") Module
 * ──────────────────────────────────────────────
 * Allows a system User that is linked to a Driver record to manage
 * their own driver profile, duty status, and GPS location.
 *
 * Link is established by Manager via PATCH /api/v1/drivers/:id/link-user
 * A user can only have one linked driver profile.
 */

import { DriverStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitLocationUpdate } from '../../sockets/locationSocket';

export class MeService {
    /**
     * Returns the Driver record linked to the current authenticated user.
     * Throws 404 if no driver profile is linked.
     */
    async getMyDriverProfile(userId: bigint) {
        const driver = await prisma.driver.findFirst({
            where: { userId, isDeleted: false },
        });
        if (!driver) {
            throw new ApiError(
                404,
                'No driver profile linked to your account. Ask your Manager to link a driver record to your user.',
            );
        }
        return driver;
    }

    /**
     * Driver updates their own ON_DUTY / OFF_DUTY status.
     * SUSPENDED drivers cannot change their own status — requires Safety Officer.
     * ON_TRIP status is managed by the dispatch module, not the driver.
     */
    async updateMyStatus(userId: bigint, status: 'ON_DUTY' | 'OFF_DUTY') {
        const driver = await this.getMyDriverProfile(userId);

        if (driver.status === DriverStatus.SUSPENDED) {
            throw new ApiError(403, 'Your account is suspended. Contact your Safety Officer.');
        }

        if (driver.status === DriverStatus.ON_TRIP) {
            throw new ApiError(409, 'Cannot change status while ON_TRIP. Complete the active trip first.');
        }

        return prisma.driver.update({
            where: { id: driver.id },
            data: { status },
            select: { id: true, fullName: true, status: true, updatedAt: true },
        });
    }

    /**
     * Driver posts their current GPS location.
     * Persists to VehicleLocation (via linked active trip's vehicle) AND
     * broadcasts over Socket.io so the Leaflet map updates in real-time.
     */
    async postMyLocation(
        userId: bigint,
        payload: { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number },
    ) {
        const driver = await this.getMyDriverProfile(userId);

        // Find the active trip for this driver to get the vehicle
        const activeTrip = await prisma.trip.findFirst({
            where: { driverId: driver.id, status: 'DISPATCHED' },
            select: { vehicleId: true },
        });

        if (!activeTrip) {
            throw new ApiError(409, 'No active dispatched trip found. Location can only be posted while ON_TRIP.');
        }

        // Persist telemetry to VehicleLocation table
        await prisma.vehicleLocation.create({
            data: {
                vehicleId: activeTrip.vehicleId,
                latitude: payload.latitude,
                longitude: payload.longitude,
                speed: payload.speed,
                heading: payload.heading,
                accuracy: payload.accuracy,
            },
        });

        // Broadcast via Socket.io for real-time map update
        emitLocationUpdate({
            vehicleId: activeTrip.vehicleId.toString(),
            latitude: payload.latitude,
            longitude: payload.longitude,
            speed: payload.speed ?? null,
            heading: payload.heading ?? null,
            accuracy: payload.accuracy ?? null,
            recordedAt: new Date().toISOString(),
        });

        return { vehicleId: activeTrip.vehicleId.toString(), ...payload, recordedAt: new Date().toISOString() };
    }

    /**
     * Returns the driver's own active and recent trips.
     */
    async getMyTrips(userId: bigint) {
        const driver = await this.getMyDriverProfile(userId);

        return prisma.trip.findMany({
            where: { driverId: driver.id },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
                waypoints: { orderBy: { sequence: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
}

export const meService = new MeService();
