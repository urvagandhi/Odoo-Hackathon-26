import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * authorize — RBAC guard factory.
 * @param roles Array of roles that are permitted to access the route.
 * @returns Express middleware that returns 403 if the authenticated user's
 *          role is not in the allowed list.
 *
 * @example
 * // Only SuperAdmin and Manager may access this route:
 * router.delete('/vehicles/:id', authenticate, authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER]), controller)
 */
export function authorize(roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthenticated.' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
            });
            return;
        }

        next();
    };
}
