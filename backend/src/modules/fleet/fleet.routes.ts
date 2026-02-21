import { Router } from 'express';
import { fleetController } from './fleet.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { UserRole } from '@prisma/client';
import {
    CreateVehicleSchema,
    UpdateVehicleSchema,
    VehicleStatusUpdateSchema,
    VehicleQuerySchema,
    CreateVehicleDocumentSchema,
    UpdateVehicleDocumentSchema,
} from './fleet.validator';

export const fleetRouter = Router();

// All fleet routes require authentication
fleetRouter.use(authenticate);

// GET  /api/v1/fleet/types  — all roles
fleetRouter.get('/types', fleetController.listVehicleTypes.bind(fleetController));

// GET  /api/v1/fleet/vehicles  — all roles
fleetRouter.get(
    '/vehicles',
    validate(VehicleQuerySchema, 'query'),
    fleetController.list.bind(fleetController),
);

// GET  /api/v1/fleet/vehicles/:id  — all roles
fleetRouter.get('/vehicles/:id', fleetController.getById.bind(fleetController));

// GET  /api/v1/fleet/vehicles/:id/maintenance  — all roles
fleetRouter.get('/vehicles/:id/maintenance', fleetController.getMaintenanceLogs.bind(fleetController));

// POST /api/v1/fleet/vehicles  — Manager only (asset creation)
fleetRouter.post(
    '/vehicles',
    authorize([UserRole.MANAGER]),
    validate(CreateVehicleSchema),
    fleetController.create.bind(fleetController),
);

// PATCH /api/v1/fleet/vehicles/:id  — Manager only (edit specs)
fleetRouter.patch(
    '/vehicles/:id',
    authorize([UserRole.MANAGER]),
    validate(UpdateVehicleSchema),
    fleetController.update.bind(fleetController),
);

// PATCH /api/v1/fleet/vehicles/:id/status  — Manager or Safety Officer
//   Safety Officer sends vehicles to IN_SHOP after inspection
fleetRouter.patch(
    '/vehicles/:id/status',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    validate(VehicleStatusUpdateSchema),
    fleetController.updateStatus.bind(fleetController),
);

// DELETE /api/v1/fleet/vehicles/:id  — Manager only (soft-delete)
fleetRouter.delete(
    '/vehicles/:id',
    authorize([UserRole.MANAGER]),
    fleetController.remove.bind(fleetController),
);

// ── Vehicle Documents ─────────────────────────────────────────────────────────

// GET  /api/v1/fleet/documents/expiring — all docs expiring soon (Manager + Safety Officer)
fleetRouter.get(
    '/documents/expiring',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.listExpiringDocuments.bind(fleetController),
);

// GET    /api/v1/fleet/vehicles/:id/documents  — all roles
fleetRouter.get('/vehicles/:id/documents', fleetController.listDocuments.bind(fleetController));

// GET    /api/v1/fleet/vehicles/:id/documents/:docId  — all roles
fleetRouter.get('/vehicles/:id/documents/:docId', fleetController.getDocument.bind(fleetController));

// POST   /api/v1/fleet/vehicles/:id/documents  — Manager + Safety Officer
fleetRouter.post(
    '/vehicles/:id/documents',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    validate(CreateVehicleDocumentSchema),
    fleetController.addDocument.bind(fleetController),
);

// PATCH  /api/v1/fleet/vehicles/:id/documents/:docId  — Manager + Safety Officer
fleetRouter.patch(
    '/vehicles/:id/documents/:docId',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    validate(UpdateVehicleDocumentSchema),
    fleetController.updateDocument.bind(fleetController),
);

// DELETE /api/v1/fleet/vehicles/:id/documents/:docId  — Manager only
fleetRouter.delete(
    '/vehicles/:id/documents/:docId',
    authorize([UserRole.MANAGER]),
    fleetController.deactivateDocument.bind(fleetController),
);
