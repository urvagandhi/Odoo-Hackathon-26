import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import prisma from '../../prisma';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/errorHandler';
import {
    LoginInput,
    RegisterInput,
    CreateUserInput,
    ChangePasswordInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    UpdateProfileInput,
} from './auth.validator';
import { JwtPayload } from '../../middleware/authenticate';

export class AuthService {
    /**
     * Create a new user. Called by admin only (controller enforces MANAGER role).
     * Always creates a DISPATCHER unless role is explicitly specified.
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
                role: UserRole.DISPATCHER,
            },
            select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        });

        return user;
    }

    /**
     * Manager-only: create a user with an explicit role assignment.
     */
    async createUser(input: CreateUserInput) {
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
                role: input.role as UserRole,
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
     * Update the authenticated user's own profile (fullName, email).
     */
    async updateProfile(userId: bigint, input: UpdateProfileInput) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, 'User not found.');

        // If email is changing, check for conflicts
        if (input.email && input.email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email: input.email } });
            if (existing) throw new ApiError(409, 'A user with this email already exists.');
        }

        const data: Record<string, string> = {};
        if (input.fullName) data.fullName = input.fullName;
        if (input.email) data.email = input.email;

        if (Object.keys(data).length === 0) {
            return { id: user.id.toString(), email: user.email, fullName: user.fullName, role: user.role };
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, fullName: true, role: true },
        });

        return { ...updated, id: updated.id.toString() };
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
     * Manager-only: list all system users.
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
        const hashedToken = await bcrypt.hash(token, 10);
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: hashedToken, resetTokenExpiry: expiry },
        });

        // NOTE: In production, send an email with the reset link instead.
        // For development / hackathon, we return the raw token directly.
        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
            resetToken: token,
        };
    }

    /**
     * Reset password — validates token, updates password, clears token.
     */
    async resetPassword(input: ResetPasswordInput) {
        // Find all users with a non-expired reset token, then compare hashes
        const candidates = await prisma.user.findMany({
            where: {
                resetToken: { not: null },
                resetTokenExpiry: { gt: new Date() },
            },
        });

        let user: (typeof candidates)[0] | null = null;
        for (const candidate of candidates) {
            if (candidate.resetToken && await bcrypt.compare(input.token, candidate.resetToken)) {
                user = candidate;
                break;
            }
        }

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

    /**
     * Manager-only: deactivate a user account.
     * Prevents self-deactivation to avoid accidental lockout.
     */
    async deactivateUser(targetId: bigint, actorId: bigint) {
        if (targetId === actorId) {
            throw new ApiError(400, 'Cannot deactivate your own account.');
        }

        const user = await prisma.user.findUnique({ where: { id: targetId } });
        if (!user) throw new ApiError(404, 'User not found.');
        if (!user.isActive) throw new ApiError(409, 'User is already deactivated.');

        return prisma.user.update({
            where: { id: targetId },
            data: { isActive: false },
            select: { id: true, email: true, fullName: true, role: true, isActive: true },
        });
    }

    /**
     * Manager-only: directly reset a user's password (no token required).
     */
    async resetUserPassword(targetId: bigint, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: targetId } });
        if (!user) throw new ApiError(404, 'User not found.');

        const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

        await prisma.user.update({
            where: { id: targetId },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return { id: user.id.toString(), email: user.email, fullName: user.fullName };
    }
}

export const authService = new AuthService();
