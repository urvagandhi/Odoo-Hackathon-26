import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginSchema, RegisterSchema, CreateUserSchema, ResetPasswordSchema } from './auth.validator';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = RegisterSchema.parse(req.body);
            const user = await authService.register(input);
            res.status(201).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = LoginSchema.parse(req.body);
            const result = await authService.login(input);
            res.status(200).json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = BigInt(req.user!.sub);
            const user = await authService.getMe(userId);
            res.status(200).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

    // ── Manager-only user management ──────────────────────────────

    async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await authService.listUsers();
            res.status(200).json({ success: true, data: users });
        } catch (err) {
            next(err);
        }
    }

    async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const input = CreateUserSchema.parse(req.body);
            const user = await authService.createUser(input);
            res.status(201).json({ success: true, data: user });
        } catch (err) {
            next(err);
        }
    }

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

    async resetUserPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const targetId = BigInt(req.params.id);
            const { newPassword } = ResetPasswordSchema.parse(req.body);
            const result = await authService.resetUserPassword(targetId, newPassword);
            res.status(200).json({ success: true, data: result, message: 'Password reset successfully.' });
        } catch (err) {
            next(err);
        }
    }
}

export const authController = new AuthController();
