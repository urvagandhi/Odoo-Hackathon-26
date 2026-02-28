import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import {
    LoginSchema,
    CreateUserSchema,
    ChangePasswordSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    AdminResetPasswordSchema,
    UpdateProfileSchema,
} from './auth.validator';

export class AuthController {
    /**
     * Login — available to all roles.
     * POST /api/v1/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = LoginSchema.parse(req.body);
            const result = await authService.login(input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get current user profile.
     * GET /api/v1/auth/me
     */
    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = BigInt(req.user!.sub);
            const user = await authService.getMe(userId);
            res.status(200).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Authenticated user updates their own profile.
     * PATCH /api/v1/auth/me
     */
    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = UpdateProfileSchema.parse(req.body);
            const userId = BigInt(req.user!.sub);
            const result = await authService.updateProfile(userId, input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Authenticated user changes their own password.
     * PUT /api/v1/auth/change-password
     */
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = ChangePasswordSchema.parse(req.body);
            const userId = BigInt(req.user!.sub);
            const result = await authService.changePassword(userId, input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Forgot password — generates reset token.
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = ForgotPasswordSchema.parse(req.body);
            const result = await authService.forgotPassword(input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Reset password — validates token + sets new password.
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = ResetPasswordSchema.parse(req.body);
            const result = await authService.resetPassword(input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    // ── Manager-only user management ──────────────────────────────

    /**
     * Admin-only: list all users.
     * GET /api/v1/auth/admin/users
     */
    async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await authService.listUsers();
            res.status(200).json({ success: true, data: users });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Admin-only: create a new user with an explicit role.
     * POST /api/v1/auth/admin/users
     */
    async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateUserSchema.parse(req.body);
            const user = await authService.createUser(input);
            res.status(201).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Admin-only: deactivate a user account.
     * PATCH /api/v1/auth/admin/users/:id/deactivate
     */
    async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const targetId = BigInt(req.params.id);
            const actorId = BigInt(req.user!.sub);
            const user = await authService.deactivateUser(targetId, actorId);
            res.status(200).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Admin-only: directly reset a user's password.
     * PATCH /api/v1/auth/admin/users/:id/reset-password
     */
    async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const targetId = BigInt(req.params.id);
            const { newPassword } = AdminResetPasswordSchema.parse(req.body);
            const result = await authService.resetUserPassword(targetId, newPassword);
            res.status(200).json({ success: true, data: result, message: 'Password reset successfully.' });
        } catch (err) {
            next(err);
        }
    }
}

export const authController = new AuthController();
