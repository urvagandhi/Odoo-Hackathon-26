import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginSchema, RegisterSchema } from './auth.validator';

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
}

export const authController = new AuthController();
