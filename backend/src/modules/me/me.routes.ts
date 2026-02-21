/**
 * Driver Self-Service routes — /api/v1/me
 *
 * Any authenticated user with a linked driver record can use these endpoints.
 * The Manager links a User account to a Driver via PATCH /api/v1/drivers/:id/link-user.
 *
 * Typical use case: driver uses a mobile app, logs in with DISPATCHER credentials,
 * and posts their GPS location or updates their duty status in real-time.
 */

import { Router } from 'express';
import { meController } from './me.controller';
import { authenticate } from '../../middleware/authenticate';

export const meRouter = Router();

meRouter.use(authenticate);

// GET  /api/v1/me/driver — get own linked driver profile
meRouter.get('/driver', meController.getDriverProfile.bind(meController));

// GET  /api/v1/me/trips — get own recent trips
meRouter.get('/trips', meController.getMyTrips.bind(meController));

// PATCH /api/v1/me/driver/status — update own duty status (ON_DUTY / OFF_DUTY)
meRouter.patch('/driver/status', meController.updateStatus.bind(meController));

// POST  /api/v1/me/location — post GPS location (persists + broadcasts via Socket.io)
meRouter.post('/location', meController.postLocation.bind(meController));
