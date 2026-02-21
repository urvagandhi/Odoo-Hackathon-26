import { Request, Response, NextFunction } from 'express';
import { locationsService } from './locations.service';
import { CreateLocationSchema } from './locations.validator';

export class LocationsController {
    async record(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateLocationSchema.parse(req.body);
            const location = await locationsService.recordLocation(input);
            res.status(201).json({ success: true, data: location });
        } catch (err) { next(err); }
    }

    async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const location = await locationsService.getLatestLocation(BigInt(req.params.vehicleId));
            res.json({ success: true, data: location });
        } catch (err) { next(err); }
    }

    async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = parseInt(String(req.query.limit ?? '50'), 10);
            const locations = await locationsService.getLocationHistory(BigInt(req.params.vehicleId), limit);
            res.json({ success: true, data: locations });
        } catch (err) { next(err); }
    }
}

export const locationsController = new LocationsController();
