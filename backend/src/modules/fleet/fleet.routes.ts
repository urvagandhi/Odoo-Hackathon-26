import { Router } from 'express';
import { fleetController } from './fleet.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const fleetRouter = Router();

// All fleet routes require authentication
fleetRouter.use(authenticate);

// GET  /api/v1/vehicles/types  — all roles
fleetRouter.get('/types', fleetController.listVehicleTypes.bind(fleetController));

// ── Vehicle Documents (must be before /:id to avoid param conflicts) ──────────

// GET  /api/v1/vehicles/documents/expiring — all docs expiring soon (Manager + Safety Officer)
fleetRouter.get(
    '/documents/expiring',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.listExpiringDocuments.bind(fleetController),
);

// GET  /api/v1/vehicles  — all roles
fleetRouter.get('/', fleetController.list.bind(fleetController));

// GET  /api/v1/vehicles/:id  — all roles
fleetRouter.get('/:id', fleetController.getById.bind(fleetController));

// GET  /api/v1/vehicles/:id/maintenance  — all roles
fleetRouter.get('/:id/maintenance', fleetController.getMaintenanceLogs.bind(fleetController));

// POST /api/v1/vehicles  — Manager only (asset creation)
fleetRouter.post(
    '/',
    authorize([UserRole.MANAGER]),
    fleetController.create.bind(fleetController),
);

// PATCH /api/v1/vehicles/:id  — Manager only (edit specs)
fleetRouter.patch(
    '/:id',
    authorize([UserRole.MANAGER]),
    fleetController.update.bind(fleetController),
);

// PATCH /api/v1/vehicles/:id/status  — Manager or Safety Officer
//   Safety Officer sends vehicles to IN_SHOP after inspection
fleetRouter.patch(
    '/:id/status',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.updateStatus.bind(fleetController),
);

// DELETE /api/v1/vehicles/:id  — Manager only (soft-delete)
fleetRouter.delete(
    '/:id',
    authorize([UserRole.MANAGER]),
    fleetController.remove.bind(fleetController),
);

// GET    /api/v1/vehicles/:id/documents  — all roles
fleetRouter.get('/:id/documents', fleetController.listDocuments.bind(fleetController));

// GET    /api/v1/vehicles/:id/documents/:docId  — all roles
fleetRouter.get('/:id/documents/:docId', fleetController.getDocument.bind(fleetController));

// POST   /api/v1/vehicles/:id/documents  — Manager + Safety Officer
fleetRouter.post(
    '/:id/documents',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.addDocument.bind(fleetController),
);

// PATCH  /api/v1/vehicles/:id/documents/:docId  — Manager + Safety Officer
fleetRouter.patch(
    '/:id/documents/:docId',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.updateDocument.bind(fleetController),
);

// DELETE /api/v1/vehicles/:id/documents/:docId  — Manager only
fleetRouter.delete(
    '/:id/documents/:docId',
    authorize([UserRole.MANAGER]),
    fleetController.deactivateDocument.bind(fleetController),
);
