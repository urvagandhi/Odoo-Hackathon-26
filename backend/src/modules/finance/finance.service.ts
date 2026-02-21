import { VehicleStatus } from '@prisma/client';
import prisma from '../../prisma';
import { ApiError } from '../../middleware/errorHandler';
import { writeAuditLog, serializeForAudit } from '../../middleware/auditLogger';
import {
    CreateFuelLogInput,
    CreateExpenseInput,
    CreateMaintenanceLogInput,
} from './finance.validator';

export class FinanceService {
    // ── Fuel Logs ──────────────────────────────────────────────────

    async createFuelLog(input: CreateFuelLogInput, actorId: bigint) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        // Anti-fraud: odometer must be >= current vehicle odometer
        if (input.odometerAtFill < Number(vehicle.currentOdometer)) {
            throw new ApiError(
                409,
                `Odometer at fill (${input.odometerAtFill}) must be >= vehicle's current odometer (${vehicle.currentOdometer}).`,
            );
        }

        // Verify trip exists if provided
        if (input.tripId) {
            const trip = await prisma.trip.findUnique({ where: { id: BigInt(input.tripId) } });
            if (!trip) throw new ApiError(404, `Trip #${input.tripId} not found.`);
        }

        const totalCost = input.liters * input.costPerLiter;

        const fuelLog = await prisma.$transaction(async (tx) => {
            const log = await tx.fuelLog.create({
                data: {
                    vehicleId: BigInt(input.vehicleId),
                    tripId: input.tripId ? BigInt(input.tripId) : undefined,
                    liters: input.liters,
                    costPerLiter: input.costPerLiter,
                    totalCost,
                    odometerAtFill: input.odometerAtFill,
                    fuelStation: input.fuelStation,
                },
            });

            // Update vehicle odometer
            await tx.vehicle.update({
                where: { id: BigInt(input.vehicleId) },
                data: { currentOdometer: input.odometerAtFill },
            });

            return log;
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'FuelLog',
            entityId: fuelLog.id,
            action: 'CREATE',
            newValues: serializeForAudit(fuelLog),
        });

        return fuelLog;
    }

    async listFuelLogs(vehicleId?: bigint, tripId?: bigint) {
        return prisma.fuelLog.findMany({
            where: {
                ...(vehicleId ? { vehicleId } : {}),
                ...(tripId ? { tripId } : {}),
            },
            include: {
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
                trip: { select: { id: true, origin: true, destination: true, status: true } },
            },
            orderBy: { loggedAt: 'desc' },
        });
    }

    // ── Expenses ───────────────────────────────────────────────────

    async createExpense(input: CreateExpenseInput, actorId: bigint) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        if (input.tripId) {
            const trip = await prisma.trip.findUnique({ where: { id: BigInt(input.tripId) } });
            if (!trip) throw new ApiError(404, `Trip #${input.tripId} not found.`);
        }

        const expense = await prisma.expense.create({
            data: {
                vehicleId: BigInt(input.vehicleId),
                tripId: input.tripId ? BigInt(input.tripId) : undefined,
                amount: input.amount,
                category: input.category,
                description: input.description,
                loggedByUserId: actorId,
            },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'Expense',
            entityId: expense.id,
            action: 'CREATE',
            newValues: serializeForAudit(expense),
        });

        return expense;
    }

    async listExpenses(vehicleId?: bigint, tripId?: bigint) {
        return prisma.expense.findMany({
            where: {
                ...(vehicleId ? { vehicleId } : {}),
                ...(tripId ? { tripId } : {}),
            },
            include: {
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true } },
                trip: { select: { id: true, origin: true, destination: true, status: true } },
            },
            orderBy: { dateLogged: 'desc' },
        });
    }

    async listMaintenanceLogs(vehicleId?: bigint) {
        return prisma.maintenanceLog.findMany({
            where: {
                ...(vehicleId ? { vehicleId } : {}),
            },
            include: {
                vehicle: { select: { id: true, licensePlate: true, make: true, model: true, status: true } },
            },
            orderBy: { serviceDate: 'desc' },
        });
    }

    // ── Maintenance Logs ───────────────────────────────────────────

    async createMaintenanceLog(input: CreateMaintenanceLogInput, actorId: bigint) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        // Cannot add maintenance to a RETIRED vehicle
        if (vehicle.status === VehicleStatus.RETIRED) {
            throw new ApiError(409, 'Cannot add maintenance to a RETIRED vehicle.');
        }

        if (input.odometerAtService < Number(vehicle.currentOdometer)) {
            throw new ApiError(
                409,
                `Odometer at service (${input.odometerAtService}) must be >= vehicle's current odometer (${vehicle.currentOdometer}).`,
            );
        }

        // ── Auto-lock: atomically create log + set vehicle → IN_SHOP ──
        const log = await prisma.$transaction(async (tx) => {
            const maintenanceLog = await tx.maintenanceLog.create({
                data: {
                    vehicleId: BigInt(input.vehicleId),
                    serviceType: input.serviceType,
                    description: input.description,
                    cost: input.cost,
                    odometerAtService: input.odometerAtService,
                    technicianName: input.technicianName,
                    shopName: input.shopName,
                    serviceDate: new Date(input.serviceDate),
                    nextServiceDue: input.nextServiceDue ? new Date(input.nextServiceDue) : undefined,
                },
            });

            // Lock vehicle into IN_SHOP — hides it from dispatcher selection
            await tx.vehicle.update({
                where: { id: BigInt(input.vehicleId) },
                data: { status: VehicleStatus.IN_SHOP },
            });

            return maintenanceLog;
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'MaintenanceLog',
            entityId: log.id,
            action: 'CREATE',
            newValues: serializeForAudit(log),
            reason: `Vehicle #${input.vehicleId} moved to IN_SHOP for: ${input.serviceType}`,
        });

        return log;
    }

    /**
     * closeMaintenanceLog — completes a maintenance session.
     * Transitions vehicle: IN_SHOP → AVAILABLE.
     * Idempotent: if vehicle is already AVAILABLE, skip the status change.
     */
    async closeMaintenanceLog(logId: bigint, actorId: bigint) {
        const log = await prisma.maintenanceLog.findUnique({
            where: { id: logId },
            include: { vehicle: true },
        });

        if (!log) throw new ApiError(404, `Maintenance log #${logId} not found.`);
        if (log.vehicle.isDeleted) throw new ApiError(404, `Vehicle for this log has been deleted.`);

        if (log.vehicle.status === VehicleStatus.RETIRED) {
            throw new ApiError(409, 'Cannot release a RETIRED vehicle.');
        }

        // If already AVAILABLE, it's a no-op (idempotent)
        if (log.vehicle.status === VehicleStatus.AVAILABLE) {
            return { log, message: 'Vehicle is already AVAILABLE. No status change needed.' };
        }

        if (log.vehicle.status !== VehicleStatus.IN_SHOP) {
            throw new ApiError(
                409,
                `Vehicle is currently ${log.vehicle.status}. Can only close maintenance when vehicle is IN_SHOP.`,
            );
        }

        await prisma.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: VehicleStatus.AVAILABLE },
        });

        await writeAuditLog({
            userId: actorId,
            entity: 'MaintenanceLog',
            entityId: logId,
            action: 'UPDATE',
            oldValues: { vehicleStatus: VehicleStatus.IN_SHOP },
            newValues: { vehicleStatus: VehicleStatus.AVAILABLE },
            reason: `Maintenance closed: ${log.serviceType} on vehicle #${log.vehicleId}`,
        });

        return { log, message: `Vehicle #${log.vehicleId} released to AVAILABLE.` };
    }
}

export const financeService = new FinanceService();
