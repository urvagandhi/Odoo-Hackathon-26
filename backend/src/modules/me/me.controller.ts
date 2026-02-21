import { Request, Response, NextFunction } from 'express';
import { meService } from './me.service';
import { DriverStatusSelfUpdateSchema, SelfLocationSchema } from './me.validator';

export class MeController {
    async getDriverProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driver = await meService.getMyDriverProfile(BigInt(req.user!.sub));
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status } = DriverStatusSelfUpdateSchema.parse(req.body);
            const driver = await meService.updateMyStatus(BigInt(req.user!.sub), status);
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async postLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payload = SelfLocationSchema.parse(req.body);
            const result = await meService.postMyLocation(BigInt(req.user!.sub), payload);
            res.status(201).json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getMyTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const trips = await meService.getMyTrips(BigInt(req.user!.sub));
            res.json({ success: true, data: trips });
        } catch (err) { next(err); }
    }
}

export const meController = new MeController();
