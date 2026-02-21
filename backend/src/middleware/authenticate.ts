import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

// ── Augment Express Request with user payload ─────────────────────
export interface JwtPayload {
    sub: string;       // User ID as string
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * authenticate middleware
 * Verifies Bearer JWT token and attaches decoded payload to req.user.
 * Returns 401 if token is missing, malformed, or expired.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Provide a Bearer token.',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        } else if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: 'Invalid token.' });
        } else {
            res.status(401).json({ success: false, message: 'Authentication failed.' });
        }
    }
}
