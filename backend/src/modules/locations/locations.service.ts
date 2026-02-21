import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { CreateLocationInput } from './locations.validator';

export class LocationsService {
    async recordLocation(input: CreateLocationInput) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        return prisma.vehicleLocation.create({
            data: {
                vehicleId: BigInt(input.vehicleId),
                latitude: input.latitude,
                longitude: input.longitude,
                speed: input.speed,
                heading: input.heading,
                accuracy: input.accuracy,
            },
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
