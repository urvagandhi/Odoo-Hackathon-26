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
            orderBy: { dateLogged: 'desc' },
        });
    }

    // ── Maintenance Logs ───────────────────────────────────────────

    async createMaintenanceLog(input: CreateMaintenanceLogInput, actorId: bigint) {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: BigInt(input.vehicleId), isDeleted: false },
        });
        if (!vehicle) throw new ApiError(404, `Vehicle #${input.vehicleId} not found.`);

        if (input.odometerAtService < Number(vehicle.currentOdometer)) {
            throw new ApiError(
                409,
                `Odometer at service (${input.odometerAtService}) must be >= vehicle's current odometer (${vehicle.currentOdometer}).`,
            );
        }

        const log = await prisma.maintenanceLog.create({
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

        await writeAuditLog({
            userId: actorId,
            entity: 'MaintenanceLog',
            entityId: log.id,
            action: 'CREATE',
            newValues: serializeForAudit(log),
        });

        return log;
    }
}

export const financeService = new FinanceService();
