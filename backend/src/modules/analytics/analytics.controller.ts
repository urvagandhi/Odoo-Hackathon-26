import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { z } from 'zod';

const DateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

const YearSchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
});

const CSVExportSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export class AnalyticsController {
    async getDashboardKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const kpis = await analyticsService.getDashboardKPIs();
            res.json({ success: true, data: kpis });
        } catch (err) { next(err); }
    }

    async getFuelEfficiency(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = DateRangeSchema.parse(req.query);
            const data = await analyticsService.getFuelEfficiency(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined,
            );
            res.json({ success: true, data });
        } catch (err) { next(err); }
    }

    async getVehicleROI(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = DateRangeSchema.parse(req.query);
            const data = await analyticsService.getVehicleROI(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined,
            );
            res.json({ success: true, data });
        } catch (err) { next(err); }
    }

    async getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { year } = YearSchema.parse(req.query);
            const data = await analyticsService.getMonthlyReport(year);
            res.json({ success: true, data });
        } catch (err) { next(err); }
    }

    async getDriverPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = DateRangeSchema.parse(req.query);
            const data = await analyticsService.getDriverPerformance(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined,
            );
            res.json({ success: true, data });
        } catch (err) { next(err); }
    }

    async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = CSVExportSchema.parse(req.query);
            const csv = await analyticsService.exportTripsCSV(
                new Date(startDate),
                new Date(endDate),
            );

            const filename = `fleetflow-trips-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}.csv`;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csv);
        } catch (err) { next(err); }
    }
}

export const analyticsController = new AnalyticsController();
