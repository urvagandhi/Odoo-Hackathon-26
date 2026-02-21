import { Router } from 'express';
import { dispatchController } from './dispatch.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const dispatchRouter = Router();

dispatchRouter.use(authenticate);

// GET  /api/v1/trips
dispatchRouter.get('/', dispatchController.list.bind(dispatchController));

// GET  /api/v1/trips/:id
dispatchRouter.get('/:id', dispatchController.getById.bind(dispatchController));

// GET  /api/v1/trips/:id/ledger  — Manager and Finance Analyst only
dispatchRouter.get(
    '/:id/ledger',
    authorize([UserRole.MANAGER, UserRole.FINANCE_ANALYST]),
    dispatchController.getLedger.bind(dispatchController),
);

// POST /api/v1/trips  — Manager and Dispatcher
dispatchRouter.post(
    '/',
    authorize([UserRole.MANAGER, UserRole.DISPATCHER]),
    dispatchController.create.bind(dispatchController),
);

// PATCH /api/v1/trips/:id  — Manager and Dispatcher (DRAFT only)
dispatchRouter.patch(
    '/:id',
    authorize([UserRole.MANAGER, UserRole.DISPATCHER]),
    dispatchController.update.bind(dispatchController),
);

// PATCH /api/v1/trips/:id/status  — DRAFT→DISPATCHED→COMPLETED|CANCELLED (Manager / Dispatcher)
dispatchRouter.patch(
    '/:id/status',
    authorize([UserRole.MANAGER, UserRole.DISPATCHER]),
    dispatchController.updateStatus.bind(dispatchController),
);
