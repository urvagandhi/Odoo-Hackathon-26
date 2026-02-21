import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { emitLocationUpdate } from '../../sockets/locationSocket';
import { CreateLocationInput } from './locations.validator';

export class LocationsService {
    async recordLocation(input: CreateLocationInput) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        const location = await prisma.vehicleLocation.create({
            data: {
                vehicleId: BigInt(input.vehicleId),
                latitude: input.latitude,
                longitude: input.longitude,
                speed: input.speed,
                heading: input.heading,
                accuracy: input.accuracy,
            },
        });

        // ── Real-time broadcast via Socket.io (Leaflet map update) ──
        emitLocationUpdate({
            vehicleId: input.vehicleId.toString(),
            latitude: input.latitude,
            longitude: input.longitude,
            speed: input.speed ?? null,
            heading: input.heading ?? null,
            accuracy: input.accuracy ?? null,
            recordedAt: location.recordedAt.toISOString(),
        });

        return location;
    }

    /**
     * getLatestLocationsAllVehicles — returns the most recent GPS ping
     * for every active vehicle. Used by the Leaflet fleet map to render
     * all vehicle markers in a single request.
     */
    async getLatestLocationsAllVehicles() {
        // Use raw SQL for DISTINCT ON — Prisma groupBy can't select non-grouped fields efficiently
        type RawLocation = {
            id: bigint;
            vehicle_id: bigint;
            latitude: string;
            longitude: string;
            speed: string | null;
            heading: string | null;
            accuracy: string | null;
            recorded_at: Date;
        };

        const rawLocations = await prisma.$queryRaw<RawLocation[]>`
            SELECT DISTINCT ON (vehicle_id)
                id,
                vehicle_id,
                latitude::text,
                longitude::text,
                speed::text,
                heading::text,
                accuracy::text,
                recorded_at
            FROM vehicle_locations
            ORDER BY vehicle_id, recorded_at DESC
        `;

        // Enrich with vehicle status for Leaflet marker coloring
        const vehicleIds = rawLocations.map((l) => l.vehicle_id);
        const vehicles = await prisma.vehicle.findMany({
            where: { id: { in: vehicleIds }, isDeleted: false },
            select: { id: true, licensePlate: true, status: true, make: true, model: true },
        });

        const vehicleMap = new Map(vehicles.map((v) => [v.id.toString(), v]));

        return rawLocations.map((loc) => {
            const vehicle = vehicleMap.get(loc.vehicle_id.toString());
            return {
                locationId: loc.id.toString(),
                vehicleId: loc.vehicle_id.toString(),
                latitude: parseFloat(loc.latitude),
                longitude: parseFloat(loc.longitude),
                speed: loc.speed ? parseFloat(loc.speed) : null,
                heading: loc.heading ? parseFloat(loc.heading) : null,
                accuracy: loc.accuracy ? parseFloat(loc.accuracy) : null,
                recordedAt: loc.recorded_at,
                vehicle: vehicle
                    ? {
                        licensePlate: vehicle.licensePlate,
                        status: vehicle.status,
                        make: vehicle.make,
                        model: vehicle.model,
                    }
                    : null,
            };
        });
    }

    async getLatestLocation(vehicleId: bigint) {
        const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, isDeleted: false } });
        if (!vehicle) throw new ApiError(404, `Vehicle #${vehicleId} not found.`);

        const location = await prisma.vehicleLocation.findFirst({
            where: { vehicleId },
            orderBy: { recordedAt: 'desc' },
        });

        if (!location) throw new ApiError(404, `No location data found for vehicle #${vehicleId}.`);
        return location;
    }

    async getLocationHistory(vehicleId: bigint, limit: number = 50) {
        const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, isDeleted: false } });
        if (!vehicle) throw new ApiError(404, `Vehicle #${vehicleId} not found.`);

        return prisma.vehicleLocation.findMany({
            where: { vehicleId },
            orderBy: { recordedAt: 'desc' },
            take: Math.min(limit, 500),
        });
    }
}

export const locationsService = new LocationsService();
