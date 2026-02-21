/**
 * FleetFlow — Incident Report Service
 * ────────────────────────────────────
 * Manages the full lifecycle of safety incidents (accidents, breakdowns,
 * traffic violations, theft, cargo damage, near-misses).
 *
 * State machine: OPEN → INVESTIGATING → RESOLVED → CLOSED
 * Safety Officer creates/updates; Manager can also close and review.
 */

import { IncidentStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateIncidentInput,
    UpdateIncidentInput,
    CloseIncidentInput,
    IncidentQueryInput,
} from './incidents.validator';

const INCLUDE_FULL = {
    vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
    driver: { select: { id: true, fullName: true, licenseNumber: true } },
    trip: { select: { id: true, origin: true, destination: true, status: true } },
};

export class IncidentsService {
    async listIncidents(query: IncidentQueryInput) {
        const { status, incidentType, vehicleId, driverId, page, limit } = query;
        const skip = (page - 1) * limit;

        const where = {
            ...(status ? { status } : {}),
            ...(incidentType ? { incidentType } : {}),
            ...(vehicleId ? { vehicleId: BigInt(vehicleId) } : {}),
            ...(driverId ? { driverId: BigInt(driverId) } : {}),
        };

        const [incidents, total] = await prisma.$transaction([
            prisma.incidentReport.findMany({
                where,
                include: INCLUDE_FULL,
                orderBy: { incidentDate: 'desc' },
                skip,
                take: limit,
            }),
            prisma.incidentReport.count({ where }),
        ]);

        return { incidents, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getIncidentById(id: bigint) {
        const incident = await prisma.incidentReport.findUnique({ where: { id }, include: INCLUDE_FULL });
        if (!incident) throw new ApiError(404, `Incident #${id} not found.`);
        return incident;
    }

    async createIncident(input: CreateIncidentInput, actorId: bigint) {
        // Validate referenced entities exist
        if (input.vehicleId) {
            const vehicle = await prisma.vehicle.findFirst({ where: { id: BigInt(input.vehicleId), isDeleted: false } });
            if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);
        }
        if (input.driverId) {
            const driver = await prisma.driver.findFirst({ where: { id: BigInt(input.driverId), isDeleted: false } });
            if (!driver) throw new ApiError(404, `Driver #${input.driverId} not found.`);
        }
        if (input.tripId) {
            const trip = await prisma.trip.findUnique({ where: { id: BigInt(input.tripId) } });
            if (!trip) throw new ApiError(404, `Trip #${input.tripId} not found.`);
        }

        const incident = await prisma.incidentReport.create({
            data: {
                vehicleId: input.vehicleId ? BigInt(input.vehicleId) : undefined,
                driverId: input.driverId ? BigInt(input.driverId) : undefined,
                tripId: input.tripId ? BigInt(input.tripId) : undefined,
                incidentType: input.incidentType,
                title: input.title,
                description: input.description,
                incidentDate: new Date(input.incidentDate),
                location: input.location,
                injuriesReported: input.injuriesReported,
                damageEstimate: input.damageEstimate,
                reportedByUserId: actorId,
                status: IncidentStatus.OPEN,
            },
            include: INCLUDE_FULL,
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'IncidentReport',
            entityId: incident.id,
            action: 'CREATE',
            newValues: serializeForAudit(incident),
        });

        return incident;
    }

    async updateIncident(id: bigint, input: UpdateIncidentInput, actorId: bigint) {
        const existing = await this.getIncidentById(id);

        // Cannot edit a CLOSED incident
        if (existing.status === IncidentStatus.CLOSED) {
            throw new ApiError(409, 'A CLOSED incident cannot be modified.');
        }

        const updated = await prisma.incidentReport.update({
            where: { id },
            data: {
                ...(input.incidentType && { incidentType: input.incidentType }),
                ...(input.title && { title: input.title }),
                ...(input.description && { description: input.description }),
                ...(input.incidentDate && { incidentDate: new Date(input.incidentDate) }),
                ...(input.location !== undefined && { location: input.location }),
                ...(input.injuriesReported !== undefined && { injuriesReported: input.injuriesReported }),
                ...(input.damageEstimate !== undefined && { damageEstimate: input.damageEstimate }),
                ...(input.status && { status: input.status }),
                ...(input.resolution !== undefined && { resolution: input.resolution }),
            },
            include: INCLUDE_FULL,
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'IncidentReport',
            entityId: id,
            action: 'UPDATE',
            oldValues: serializeForAudit(existing),
            newValues: serializeForAudit(updated),
        });

        return updated;
    }

    async closeIncident(id: bigint, input: CloseIncidentInput, actorId: bigint) {
        const existing = await this.getIncidentById(id);

        if (existing.status === IncidentStatus.CLOSED) {
            throw new ApiError(409, 'Incident is already CLOSED.');
        }

        const updated = await prisma.incidentReport.update({
            where: { id },
            data: {
                status: IncidentStatus.CLOSED,
                resolution: input.resolution,
                resolvedAt: new Date(),
            },
            include: INCLUDE_FULL,
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'IncidentReport',
            entityId: id,
            action: 'UPDATE',
            oldValues: { status: existing.status },
            newValues: { status: IncidentStatus.CLOSED, resolution: input.resolution },
            reason: input.resolution,
        });

        return updated;
    }
}

export const incidentsService = new IncidentsService();
