import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

export const authRouter = Router();

// POST /api/v1/auth/login — any role
authRouter.post('/login', authController.login.bind(authController));

// GET /api/v1/auth/me — requires auth
authRouter.get('/me', authenticate, authController.getMe.bind(authController));

// PUT /api/v1/auth/change-password — requires auth
authRouter.put('/change-password', authenticate, authController.changePassword.bind(authController));

// POST /api/v1/auth/forgot-password — public
authRouter.post('/forgot-password', authController.forgotPassword.bind(authController));

// POST /api/v1/auth/reset-password — public
authRouter.post('/reset-password', authController.resetPassword.bind(authController));

// ── Admin-only routes ────────────────────────────────────────────
// POST /api/v1/auth/admin/users — create a new user (SUPER_ADMIN only)
authRouter.post('/admin/users', authenticate, authorize([UserRole.SUPER_ADMIN]), authController.createUser.bind(authController));

// GET /api/v1/auth/admin/users — list all users (SUPER_ADMIN only)
authRouter.get('/admin/users', authenticate, authorize([UserRole.SUPER_ADMIN]), authController.listUsers.bind(authController));
