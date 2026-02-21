import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import prisma from '../../prisma';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/errorHandler';
import { LoginInput, RegisterInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validator';
import { JwtPayload } from '../../middleware/authenticate';

export class AuthService {
    /**
     * Create a new user. Called by admin only (controller enforces SUPER_ADMIN).
     */
    async register(input: RegisterInput) {
        const existing = await prisma.user.findUnique({ where: { email: input.email } });
        if (existing) {
            throw new ApiError(409, 'A user with this email already exists.');
        }

        const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: input.email,
                passwordHash,
                fullName: input.fullName,
                role: (input.role as UserRole) ?? UserRole.DISPATCHER,
            },
            select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        });

        return {
            ...user,
            id: user.id.toString(),
        };
    }

    /**
     * Validate credentials and return signed JWT.
     */
    async login(input: LoginInput) {
        const user = await prisma.user.findUnique({ where: { email: input.email } });

        if (!user || !user.isActive) {
            throw new ApiError(401, 'Invalid email or password.');
        }

        const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!passwordValid) {
            throw new ApiError(401, 'Invalid email or password.');
        }

        const payload: JwtPayload = {
            sub: user.id.toString(),
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        });

        return {
            token,
            user: {
                id: user.id.toString(),
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }

    /**
     * Return the currently authenticated user's profile.
     */
    async getMe(userId: bigint) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
        });

        if (!user) throw new ApiError(404, 'User not found.');
        return {
            ...user,
            id: user.id.toString(),
        };
    }

    /**
     * Change the authenticated user's own password.
     */
    async changePassword(userId: bigint, input: ChangePasswordInput) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, 'User not found.');

        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new ApiError(401, 'Current password is incorrect.');

        const newHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });

        return { message: 'Password changed successfully.' };
    }

    /**
     * List all users (admin only).
     */
    async listUsers() {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
        return users.map(u => ({ ...u, id: u.id.toString() }));
    }

    /**
     * Forgot password — generates a reset token, stores it in DB.
     * In production you'd email the link; here we return the token directly
     * so the frontend can navigate to /reset-password?token=xxx.
     */
    async forgotPassword(input: ForgotPasswordInput) {
        const user = await prisma.user.findUnique({ where: { email: input.email } });

        // Always return success even if user doesn't exist (security best practice)
        if (!user || !user.isActive) {
            return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExpiry: expiry },
        });

        // NOTE: In production, send an email with the reset link instead.
        // For development / hackathon, we return the token directly.
        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
            // DEV ONLY — remove in production:
            resetToken: token,
        };
    }

    /**
     * Reset password — validates token, updates password, clears token.
     */
    async resetPassword(input: ResetPasswordInput) {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: input.token,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new ApiError(400, 'Invalid or expired reset token.');
        }

        const newHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return { message: 'Password has been reset successfully. You can now log in.' };
    }
}

export const authService = new AuthService();
