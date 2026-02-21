import { Router } from 'express';
import { hrController } from './hr.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const hrRouter = Router();

hrRouter.use(authenticate);

// GET  /api/v1/drivers
hrRouter.get('/', hrController.list.bind(hrController));

// GET  /api/v1/drivers/expiring — dashboard alert: licenses expiring soon
hrRouter.get(
    '/expiring',
    authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.getExpiringLicenses.bind(hrController),
);

// GET  /api/v1/drivers/:id
hrRouter.get('/:id', hrController.getById.bind(hrController));

// POST /api/v1/drivers  (Manager / Safety Officer / SuperAdmin)
hrRouter.post(
    '/',
    authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.create.bind(hrController),
);

// PATCH /api/v1/drivers/:id
hrRouter.patch(
    '/:id',
    authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.update.bind(hrController),
);

// PATCH /api/v1/drivers/:id/status
hrRouter.patch(
    '/:id/status',
    authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    hrController.updateStatus.bind(hrController),
);

// PATCH /api/v1/drivers/:id/safety-score  (Safety Officer only)
hrRouter.patch(
    '/:id/safety-score',
    authorize([UserRole.SUPER_ADMIN, UserRole.SAFETY_OFFICER]),
    hrController.adjustSafetyScore.bind(hrController),
);

// DELETE /api/v1/drivers/:id  (SuperAdmin only)
hrRouter.delete(
    '/:id',
    authorize([UserRole.SUPER_ADMIN]),
    hrController.remove.bind(hrController),
);
