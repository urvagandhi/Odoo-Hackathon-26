import { Router } from 'express';
import { incidentsController } from './incidents.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const incidentsRouter = Router();

incidentsRouter.use(authenticate);

// Safety Officer files and manages incidents; Manager has full oversight
const incidentRoles = [UserRole.MANAGER, UserRole.SAFETY_OFFICER];

// GET  /api/v1/incidents
incidentsRouter.get('/', authorize(incidentRoles), incidentsController.list.bind(incidentsController));

// GET  /api/v1/incidents/:id
incidentsRouter.get('/:id', authorize(incidentRoles), incidentsController.getById.bind(incidentsController));

// POST /api/v1/incidents — Safety Officer files a new incident report
incidentsRouter.post(
    '/',
    authorize([UserRole.SAFETY_OFFICER]),
    incidentsController.create.bind(incidentsController),
);

// PATCH /api/v1/incidents/:id — Update details / transition status
incidentsRouter.patch(
    '/:id',
    authorize(incidentRoles),
    incidentsController.update.bind(incidentsController),
);

// PATCH /api/v1/incidents/:id/close — Resolve and close with written resolution
incidentsRouter.patch(
    '/:id/close',
    authorize(incidentRoles),
    incidentsController.close.bind(incidentsController),
);
