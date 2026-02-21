import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const authRouter = Router();

// ── Public ────────────────────────────────────────────────────────

// POST /api/v1/auth/register  — creates a DISPATCHER account (lowest-privilege default)
authRouter.post('/register', authController.register.bind(authController));

// POST /api/v1/auth/login
authRouter.post('/login', authController.login.bind(authController));

// ── Authenticated ─────────────────────────────────────────────────

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, authController.getMe.bind(authController));

// ── Manager-only: user management ────────────────────────────────

// GET  /api/v1/auth/users  — list all users in the organization
authRouter.get(
    '/users',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.listUsers.bind(authController),
);

// POST /api/v1/auth/users  — create user with an explicit role assignment
authRouter.post(
    '/users',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.createUser.bind(authController),
);

// PATCH /api/v1/auth/users/:id/deactivate  — disable a user's login access
authRouter.patch(
    '/users/:id/deactivate',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.deactivateUser.bind(authController),
);

// PATCH /api/v1/auth/users/:id/reset-password  — Manager directly resets user password
authRouter.patch(
    '/users/:id/reset-password',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.resetUserPassword.bind(authController),
);
