import { Router } from 'express';
import { fleetController } from './fleet.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const fleetRouter = Router();

// All fleet routes require authentication
fleetRouter.use(authenticate);

// GET  /api/v1/fleet/types  — all roles
fleetRouter.get('/types', fleetController.listVehicleTypes.bind(fleetController));

// GET  /api/v1/fleet/vehicles  — all roles
fleetRouter.get('/vehicles', fleetController.list.bind(fleetController));

// GET  /api/v1/fleet/vehicles/:id  — all roles
fleetRouter.get('/vehicles/:id', fleetController.getById.bind(fleetController));

// GET  /api/v1/fleet/vehicles/:id/maintenance  — all roles
fleetRouter.get('/vehicles/:id/maintenance', fleetController.getMaintenanceLogs.bind(fleetController));

// POST /api/v1/fleet/vehicles  — Manager only (asset creation)
fleetRouter.post(
    '/vehicles',
    authorize([UserRole.MANAGER]),
    fleetController.create.bind(fleetController),
);

// PATCH /api/v1/fleet/vehicles/:id  — Manager only (edit specs)
fleetRouter.patch(
    '/vehicles/:id',
    authorize([UserRole.MANAGER]),
    fleetController.update.bind(fleetController),
);

// PATCH /api/v1/fleet/vehicles/:id/status  — Manager or Safety Officer
//   Safety Officer sends vehicles to IN_SHOP after inspection
fleetRouter.patch(
    '/vehicles/:id/status',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    fleetController.updateStatus.bind(fleetController),
);

// DELETE /api/v1/fleet/vehicles/:id  — Manager only (soft-delete)
fleetRouter.delete(
    '/vehicles/:id',
    authorize([UserRole.MANAGER]),
    fleetController.remove.bind(fleetController),
);
