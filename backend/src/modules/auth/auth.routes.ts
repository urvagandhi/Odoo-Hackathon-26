import { Router } from 'express';
import { UserRole } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

export const authRouter = Router();

// ── Rate limiters ─────────────────────────────────────────────────

/** 5 login attempts per 15 minutes per IP */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error_code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** 3 forgot-password requests per 15 minutes per IP */
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, error_code: 'RATE_LIMIT_EXCEEDED', message: 'Too many password reset requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Public ────────────────────────────────────────────────────────

// POST /api/v1/auth/login
authRouter.post('/login', loginLimiter, authController.login.bind(authController));

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword.bind(authController));

// POST /api/v1/auth/reset-password
authRouter.post('/reset-password', authController.resetPassword.bind(authController));

// ── Authenticated ─────────────────────────────────────────────────

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, authController.getMe.bind(authController));

// PUT /api/v1/auth/change-password
authRouter.put('/change-password', authenticate, authController.changePassword.bind(authController));

// ── Manager-only: user management ────────────────────────────────

// GET  /api/v1/auth/admin/users — list all users in the organization
authRouter.get(
    '/admin/users',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.listUsers.bind(authController),
);

// POST /api/v1/auth/admin/users — create user with an explicit role assignment
authRouter.post(
    '/admin/users',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.createUser.bind(authController),
);

// PATCH /api/v1/auth/admin/users/:id/deactivate — disable a user's login access
authRouter.patch(
    '/admin/users/:id/deactivate',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.deactivateUser.bind(authController),
);

// PATCH /api/v1/auth/admin/users/:id/reset-password — Manager directly resets user password
authRouter.patch(
    '/admin/users/:id/reset-password',
    authenticate,
    authorize([UserRole.MANAGER]),
    authController.resetUserPassword.bind(authController),
);
