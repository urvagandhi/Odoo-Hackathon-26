import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import {
    CreateFuelLogSchema,
    CreateExpenseSchema,
    CreateMaintenanceLogSchema,
} from './finance.validator';

export class FinanceController {
    async createFuelLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateFuelLogSchema.parse(req.body);
            const log = await financeService.createFuelLog(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: log });
        } catch (err) { next(err); }
    }

    async listFuelLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const vehicleId = req.query.vehicleId ? BigInt(String(req.query.vehicleId)) : undefined;
            const tripId = req.query.tripId ? BigInt(String(req.query.tripId)) : undefined;
            const logs = await financeService.listFuelLogs(vehicleId, tripId);
            res.json({ success: true, data: logs });
        } catch (err) { next(err); }
    }

    async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateExpenseSchema.parse(req.body);
            const expense = await financeService.createExpense(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: expense });
        } catch (err) { next(err); }
    }

    async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const vehicleId = req.query.vehicleId ? BigInt(String(req.query.vehicleId)) : undefined;
            const tripId = req.query.tripId ? BigInt(String(req.query.tripId)) : undefined;
            const expenses = await financeService.listExpenses(vehicleId, tripId);
            res.json({ success: true, data: expenses });
        } catch (err) { next(err); }
    }

    async createMaintenanceLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateMaintenanceLogSchema.parse(req.body);
            const log = await financeService.createMaintenanceLog(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: log });
        } catch (err) { next(err); }
    }

    async closeMaintenanceLog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await financeService.closeMaintenanceLog(
                BigInt(req.params.id),
                BigInt(req.user!.sub),
            );
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }
}

export const financeController = new FinanceController();
