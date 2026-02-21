import { Router } from 'express';
import { hrController } from './hr.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const hrRouter = Router();

hrRouter.use(authenticate);

// GET  /api/v1/drivers
hrRouter.get('/', hrController.list.bind(hrController));

// GET  /api/v1/drivers/expiring — licenses expiring in ≤30 days (Manager / Safety Officer)
hrRouter.get(
    '/expiring',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.getExpiringLicenses.bind(hrController),
);

// GET  /api/v1/drivers/:id  — all roles
hrRouter.get('/:id', hrController.getById.bind(hrController));

// POST /api/v1/drivers  — Manager only (Driver Profile ownership)
hrRouter.post(
    '/',
    authorize([UserRole.MANAGER]),
    hrController.create.bind(hrController),
);

// PATCH /api/v1/drivers/:id  — Manager only (Driver Profile ownership)
hrRouter.patch(
    '/:id',
    authorize([UserRole.MANAGER]),
    hrController.update.bind(hrController),
);

// PATCH /api/v1/drivers/:id/status  — ON_DUTY/OFF_DUTY/SUSPENDED transitions (Manager + Safety Officer)
hrRouter.patch(
    '/:id/status',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.updateStatus.bind(hrController),
);

// PATCH /api/v1/drivers/:id/safety-score  — Safety Officer only (Driver Compliance ownership)
hrRouter.patch(
    '/:id/safety-score',
    authorize([UserRole.SAFETY_OFFICER]),
    hrController.adjustSafetyScore.bind(hrController),
);

// DELETE /api/v1/drivers/:id  — Manager only (soft-delete)
hrRouter.delete(
    '/:id',
    authorize([UserRole.MANAGER]),
    hrController.remove.bind(hrController),
);

// PATCH /api/v1/drivers/:id/link-user  — Manager only
// Body: { userId: number } to link a user account, or { userId: null } to unlink
hrRouter.patch(
    '/:id/link-user',
    authorize([UserRole.MANAGER]),
    hrController.linkUser.bind(hrController),
);
