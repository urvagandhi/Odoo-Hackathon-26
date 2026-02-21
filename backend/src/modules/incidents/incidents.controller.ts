import { Request, Response, NextFunction } from 'express';
import { incidentsService } from './incidents.service';
import {
    CreateIncidentSchema,
    UpdateIncidentSchema,
    CloseIncidentSchema,
    IncidentQuerySchema,
} from './incidents.validator';

export class IncidentsController {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = IncidentQuerySchema.parse(req.query);
            const result = await incidentsService.listIncidents(query);
            res.status(200).json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = BigInt(req.params.id);
            const incident = await incidentsService.getIncidentById(id);
            res.status(200).json({ success: true, data: incident });
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateIncidentSchema.parse(req.body);
            const actorId = BigInt(req.user!.sub);
            const incident = await incidentsService.createIncident(input, actorId);
            res.status(201).json({ success: true, data: incident });
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = BigInt(req.params.id);
            const input = UpdateIncidentSchema.parse(req.body);
            const actorId = BigInt(req.user!.sub);
            const incident = await incidentsService.updateIncident(id, input, actorId);
            res.status(200).json({ success: true, data: incident });
        } catch (err) { next(err); }
    }

    async close(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = BigInt(req.params.id);
            const input = CloseIncidentSchema.parse(req.body);
            const actorId = BigInt(req.user!.sub);
            const incident = await incidentsService.closeIncident(id, input, actorId);
            res.status(200).json({ success: true, data: incident });
        } catch (err) { next(err); }
    }
}

export const incidentsController = new IncidentsController();
