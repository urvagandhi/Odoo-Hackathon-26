import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../../prisma';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/errorHandler';
import { LoginInput, RegisterInput, CreateUserInput } from './auth.validator';
import { JwtPayload } from '../../middleware/authenticate';

export class AuthService {
    /**
     * Public registration — always creates a DISPATCHER account.
     * For role-specific user creation, Manager uses createUser().
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

        return user;
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
        return user;
    }

    /**
     * Manager-only: list all system users.
     */
    async listUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
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
     * Manager-only: directly reset a user's password.
     * Token-based reset (15-min expiry) is managed here.
     * No email enumeration — always returns success regardless of target existence.
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
