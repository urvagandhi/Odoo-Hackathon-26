import { Request, Response, NextFunction } from 'express';
import { fleetService } from './fleet.service';
import {
    CreateVehicleSchema,
    UpdateVehicleSchema,
    VehicleStatusUpdateSchema,
    VehicleQuerySchema,
    CreateVehicleDocumentSchema,
    UpdateVehicleDocumentSchema,
} from './fleet.validator';

export class FleetController {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = VehicleQuerySchema.parse(req.query);
            const result = await fleetService.listVehicles(query);
            res.json({ success: true, data: result });
        } catch (err) { next(err); }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const vehicle = await fleetService.getVehicleById(BigInt(req.params.id));
            res.json({ success: true, data: vehicle });
        } catch (err) { next(err); }
    }

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateVehicleSchema.parse(req.body);
            const vehicle = await fleetService.createVehicle(input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: vehicle });
        } catch (err) { next(err); }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = UpdateVehicleSchema.parse(req.body);
            const vehicle = await fleetService.updateVehicle(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: vehicle });
        } catch (err) { next(err); }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = VehicleStatusUpdateSchema.parse(req.body);
            const vehicle = await fleetService.updateVehicleStatus(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.json({ success: true, data: vehicle });
        } catch (err) { next(err); }
    }

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await fleetService.softDeleteVehicle(BigInt(req.params.id), BigInt(req.user!.sub));
            res.json({ success: true, message: 'Vehicle soft-deleted.' });
        } catch (err) { next(err); }
    }

    async getMaintenanceLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const logs = await fleetService.getVehicleMaintenanceLogs(BigInt(req.params.id));
            res.json({ success: true, data: logs });
        } catch (err) { next(err); }
    }

    async listVehicleTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const types = await fleetService.listVehicleTypes();
            res.json({ success: true, data: types });
        } catch (err) { next(err); }
    }

    // ── Vehicle Documents ─────────────────────────────────────────

    async listDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const docs = await fleetService.listVehicleDocuments(BigInt(req.params.id));
            res.json({ success: true, data: docs });
        } catch (err) { next(err); }
    }

    async getDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const doc = await fleetService.getVehicleDocument(BigInt(req.params.id), BigInt(req.params.docId));
            res.json({ success: true, data: doc });
        } catch (err) { next(err); }
    }

    async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateVehicleDocumentSchema.parse(req.body);
            const doc = await fleetService.addVehicleDocument(BigInt(req.params.id), input, BigInt(req.user!.sub));
            res.status(201).json({ success: true, data: doc });
        } catch (err) { next(err); }
    }

    async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = UpdateVehicleDocumentSchema.parse(req.body);
            const doc = await fleetService.updateVehicleDocument(BigInt(req.params.id), BigInt(req.params.docId), input, BigInt(req.user!.sub));
            res.json({ success: true, data: doc });
        } catch (err) { next(err); }
    }

    async deactivateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await fleetService.deactivateVehicleDocument(BigInt(req.params.id), BigInt(req.params.docId), BigInt(req.user!.sub));
            res.json({ success: true, message: 'Document deactivated.' });
        } catch (err) { next(err); }
    }

    async listExpiringDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
            const docs = await fleetService.listExpiringDocuments(days);
            res.json({ success: true, data: docs });
        } catch (err) { next(err); }
    }
}

export const fleetController = new FleetController();
