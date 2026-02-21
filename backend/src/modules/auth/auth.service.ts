import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../../prisma';
import { env } from '../../config/env';
import { ApiError } from '../../middleware/errorHandler';
import { LoginInput, RegisterInput } from './auth.validator';
import { JwtPayload } from '../../middleware/authenticate';

export class AuthService {
    /**
     * Register a new user. Only SUPER_ADMIN can assign elevated roles.
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
}

export const authService = new AuthService();
