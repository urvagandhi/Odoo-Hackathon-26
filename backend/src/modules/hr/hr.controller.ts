import { Request, Response, NextFunction } from 'express';
import { hrService } from './hr.service';
import {
    CreateDriverSchema,
    UpdateDriverSchema,
    DriverStatusUpdateSchema,
    DriverQuerySchema,
} from './hr.validator';

export class HrController {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = DriverQuerySchema.parse(req.query);
            const result = await hrService.listDrivers(query);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driver = await hrService.getDriverById(BigInt(req.params.id));
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateDriverSchema.parse(req.body);
            const driver = await hrService.createDriver(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = UpdateDriverSchema.parse(req.body);
            const driver = await hrService.updateDriver(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = DriverStatusUpdateSchema.parse(req.body);
            const driver = await hrService.updateDriverStatus(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async adjustSafetyScore(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Recalculate score from trip data (trip-based, not manual)
            const driverId = BigInt(req.params.id);
            const score = await hrService.recalculateDriverScore(driverId);
            const driver = await hrService.getDriverById(driverId);
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }

    async getTripStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stats = await hrService.getDriverTripStats(BigInt(req.params.id));
            res.json({ success: true, data: stats });
        } catch (err) { next(err); }
    }

    async getDriverTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const trips = await hrService.getDriverTrips(BigInt(req.params.id));
            res.json({ success: true, data: trips });
        } catch (err) { next(err); }
    }

    async rateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const tripId = BigInt(req.params.tripId);
            const { rating } = req.body;
            if (typeof rating !== 'number' || rating < 0 || rating > 100) {
                res.status(400).json({ success: false, message: 'Rating must be a number between 0 and 100.' });
                return;
            }
            const trip = await hrService.rateTrip(tripId, rating);
            res.json({ success: true, data: trip });
        } catch (err) { next(err); }
    }

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await hrService.softDeleteDriver(BigInt(req.params.id), BigInt(req.user!.sub));
            res.json({ success: true, message: 'Driver soft-deleted.' });
        } catch (err) { next(err); }
    }

    async getExpiringLicenses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const daysAhead = parseInt(String(req.query.days ?? '30'), 10);
            const drivers = await hrService.getExpiringLicenses(daysAhead);
            res.json({ success: true, data: drivers });
        } catch (err) { next(err); }
    }

    async linkUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = BigInt(req.params.id);
            const actorId = BigInt(req.user!.sub);
            // userId: null = unlink, number = link
            const userId = req.body.userId != null ? BigInt(req.body.userId) : null;
            const driver = await hrService.linkUserToDriver(driverId, userId, actorId);
            res.json({ success: true, data: driver });
        } catch (err) { next(err); }
    }
}

export const hrController = new HrController();
