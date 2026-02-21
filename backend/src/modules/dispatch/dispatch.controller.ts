import { Request, Response, NextFunction } from 'express';
import { dispatchService } from './dispatch.service';
import {
    CreateTripSchema,
    UpdateTripSchema,
    TripStatusUpdateSchema,
    TripQuerySchema,
} from './dispatch.validator';

export class DispatchController {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = TripQuerySchema.parse(req.query);
            const result = await dispatchService.listTrips(query);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const trip = await dispatchService.getTripById(BigInt(req.params.id));
            res.json({ success: true, data: trip });
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateTripSchema.parse(req.body);
            const trip = await dispatchService.createTrip(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: trip });
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = UpdateTripSchema.parse(req.body);
            const trip = await dispatchService.updateTrip(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: trip });
        } catch (err) { next(err); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = TripStatusUpdateSchema.parse(req.body);
            const trip = await dispatchService.transitionTripStatus(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: trip });
        } catch (err) { next(err); }
    }

    async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const ledger = await dispatchService.getTripLedger(BigInt(req.params.id));
            res.json({ success: true, data: ledger });
        } catch (err) { next(err); }
    }
}

export const dispatchController = new DispatchController();
