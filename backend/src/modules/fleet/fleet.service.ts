import { VehicleStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateVehicleInput,
    UpdateVehicleInput,
    VehicleStatusUpdateInput,
    VehicleQueryInput,
    CreateVehicleDocumentInput,
    UpdateVehicleDocumentInput,
} from './fleet.validator';

export class FleetService {
    async listVehicles(query: VehicleQueryInput) {
        const { status, vehicleTypeId, page, limit } = query;
        const skip = (page - 1) * limit;

        const where = {
            isDeleted: false,
            ...(status ? { status } : {}),
            ...(vehicleTypeId ? { vehicleTypeId: BigInt(vehicleTypeId) } : {}),
        };

        const [vehicles, total] = await prisma.$transaction([
            prisma.vehicle.findMany({
                where,
                include: { vehicleType: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.vehicle.count({ where }),
        ]);

        return { vehicles, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getVehicleById(id: bigint) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id, isDeleted: false },
            include: { vehicleType: true },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${id} not found.`);
        return vehicle;
    }

    async createVehicle(input: CreateVehicleInput, actorId: bigint) {
        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate: input.licensePlate,
                make: input.make,
                model: input.model,
                year: input.year,
                color: input.color,
                vin: input.vin,
                vehicleTypeId: BigInt(input.vehicleTypeId),
                currentOdometer: input.currentOdometer ?? 0,
                capacityWeight: input.capacityWeight,
                capacityVolume: input.capacityVolume,
            },
            include: { vehicleType: true },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Vehicle',
            entityId: vehicle.id,
            action: 'CREATE',
            newValues: serializeForAudit(vehicle),
        });

        return vehicle;
    }

    async updateVehicle(id: bigint, input: UpdateVehicleInput, actorId: bigint) {
        const existing = await this.getVehicleById(id);

        const updated = await prisma.vehicle.update({
            where: { id },
            data: { ...input },
            include: { vehicleType: true },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Vehicle',
            entityId: id,
            action: 'UPDATE',
            oldValues: serializeForAudit(existing),
            newValues: serializeForAudit(updated),
        });

        return updated;
    }

    async updateVehicleStatus(id: bigint, input: VehicleStatusUpdateInput, actorId: bigint) {
        const vehicle = await this.getVehicleById(id);

        // Guard: RETIRED is a terminal state — no transitions out
        if (vehicle.status === VehicleStatus.RETIRED) {
            throw new ApiError(409, 'A RETIRED vehicle cannot change status.');
        }

        // Guard: ON_TRIP vehicles can only be changed by the trip service (dispatch module)
        if (vehicle.status === VehicleStatus.ON_TRIP && input.status !== 'IN_SHOP') {
            throw new ApiError(
                409,
                'A vehicle ON_TRIP can only be moved to IN_SHOP (breakdown). Use the trip completion flow to release it.',
            );
        }

        const updated = await prisma.vehicle.update({
            where: { id },
            data: { status: input.status },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Vehicle',
            entityId: id,
            action: 'UPDATE',
            oldValues: { status: vehicle.status },
            newValues: { status: updated.status },
            reason: input.reason,
        });

        return updated;
    }

    async softDeleteVehicle(id: bigint, actorId: bigint) {
        const vehicle = await this.getVehicleById(id);

        if (vehicle.status === VehicleStatus.ON_TRIP) {
            throw new ApiError(409, 'Cannot delete a vehicle that is currently ON_TRIP.');
        }

        const updated = await prisma.vehicle.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Vehicle',
            entityId: id,
            action: 'DELETE',
            oldValues: serializeForAudit(vehicle),
        });

        return updated;
    }

    async getVehicleMaintenanceLogs(id: bigint) {
        await this.getVehicleById(id); // existence check
        return prisma.maintenanceLog.findMany({
            where: { vehicleId: id },
            orderBy: { serviceDate: 'desc' },
        });
    }

    async listVehicleTypes() {
        return prisma.vehicleTypeRecord.findMany({ orderBy: { name: 'asc' } });
    }

    // ── Vehicle Documents ─────────────────────────────────────────

    async listVehicleDocuments(vehicleId: bigint) {
        await this.getVehicleById(vehicleId); // existence check
        return prisma.vehicleDocument.findMany({
            where: { vehicleId, isActive: true },
            orderBy: [{ documentType: 'asc' }, { expiresAt: 'asc' }],
        });
    }

    async getVehicleDocument(vehicleId: bigint, docId: bigint) {
        await this.getVehicleById(vehicleId);
        const doc = await prisma.vehicleDocument.findFirst({ where: { id: docId, vehicleId } });
        if (!doc) throw new ApiError(404, `Document #${docId} not found for vehicle #${vehicleId}.`);
        return doc;
    }

    async addVehicleDocument(vehicleId: bigint, input: CreateVehicleDocumentInput, actorId: bigint) {
        await this.getVehicleById(vehicleId);

        // Deactivate previous active document of same type (superseded)
        await prisma.vehicleDocument.updateMany({
            where: { vehicleId, documentType: input.documentType, isActive: true },
            data: { isActive: false },
        });

        const doc = await prisma.vehicleDocument.create({
            data: {
                vehicleId,
                documentType: input.documentType,
                documentNumber: input.documentNumber,
                issuedBy: input.issuedBy,
                issuedAt: input.issuedAt ? new Date(input.issuedAt) : undefined,
                expiresAt: new Date(input.expiresAt),
                notes: input.notes,
            },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'VehicleDocument',
            entityId: doc.id,
            action: 'CREATE',
            newValues: serializeForAudit(doc),
        });

        return doc;
    }

    async updateVehicleDocument(vehicleId: bigint, docId: bigint, input: UpdateVehicleDocumentInput, actorId: bigint) {
        const existing = await this.getVehicleDocument(vehicleId, docId);

        const updated = await prisma.vehicleDocument.update({
            where: { id: docId },
            data: {
                ...(input.documentType && { documentType: input.documentType }),
                ...(input.documentNumber !== undefined && { documentNumber: input.documentNumber }),
                ...(input.issuedBy !== undefined && { issuedBy: input.issuedBy }),
                ...(input.issuedAt && { issuedAt: new Date(input.issuedAt) }),
                ...(input.expiresAt && { expiresAt: new Date(input.expiresAt) }),
                ...(input.notes !== undefined && { notes: input.notes }),
            },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'VehicleDocument',
            entityId: docId,
            action: 'UPDATE',
            oldValues: serializeForAudit(existing),
            newValues: serializeForAudit(updated),
        });

        return updated;
    }

    async deactivateVehicleDocument(vehicleId: bigint, docId: bigint, actorId: bigint) {
        const existing = await this.getVehicleDocument(vehicleId, docId);
        if (!existing.isActive) throw new ApiError(409, 'Document is already inactive.');

        const updated = await prisma.vehicleDocument.update({
            where: { id: docId },
            data: { isActive: false },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'VehicleDocument',
            entityId: docId,
            action: 'DELETE',
            oldValues: serializeForAudit(existing),
        });

        return updated;
    }

    async listExpiringDocuments(daysAhead = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + daysAhead);

        return prisma.vehicleDocument.findMany({
            where: {
                isActive: true,
                expiresAt: { lte: cutoff },
                vehicle: { isDeleted: false },
            },
            include: {
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
            },
            orderBy: { expiresAt: 'asc' },
        });
    }
}

export const fleetService = new FleetService();
