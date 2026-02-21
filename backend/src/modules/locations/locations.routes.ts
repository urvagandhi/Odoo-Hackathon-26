import { Router } from 'express';
import { locationsController } from './locations.controller';
import { authenticate } from '../../middleware/authenticate';

export const locationsRouter = Router();

locationsRouter.use(authenticate);

// POST /api/v1/locations  — ingest GPS ping (called by IoT/mobile)
locationsRouter.post('/', locationsController.record.bind(locationsController));

// GET  /api/v1/locations/:vehicleId/latest
locationsRouter.get('/:vehicleId/latest', locationsController.getLatest.bind(locationsController));

// GET  /api/v1/locations/:vehicleId/history?limit=50
locationsRouter.get('/:vehicleId/history', locationsController.getHistory.bind(locationsController));
