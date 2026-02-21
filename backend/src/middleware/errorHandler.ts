import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────────
//  Error codes — machine-readable identifiers for API consumers.
//  Frontend clients can switch on error_code without parsing text.
// ─────────────────────────────────────────────────────────────────
export type ErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'VALIDATION_ERROR'
    | 'DUPLICATE_ENTRY'
    | 'FOREIGN_KEY_VIOLATION'
    | 'DB_VALIDATION_ERROR'
    | 'INTERNAL_ERROR';

/**
 * ApiError — throw this in any service/controller to return a structured HTTP error.
 * The errorCode is automatically derived from statusCode if not provided explicitly.
 */
export class ApiError extends Error {
    public readonly errorCode: ErrorCode;

    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
        this.errorCode = ApiError.codeFromStatus(statusCode);
    }

    static codeFromStatus(status: number): ErrorCode {
        switch (status) {
            case 400: return 'BAD_REQUEST';
            case 401: return 'UNAUTHORIZED';
            case 403: return 'FORBIDDEN';
            case 404: return 'NOT_FOUND';
            case 409: return 'CONFLICT';
            case 422: return 'VALIDATION_ERROR';
            default:  return 'INTERNAL_ERROR';
        }
    }
}

/**
 * Global error handler — must be the last middleware registered in app.ts.
 * Maps known error types to structured JSON responses.
 * All responses include error_code for machine-readable error handling.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    // ── Custom ApiError ───────────────────────────────────────────
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error_code: err.errorCode,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }

    // ── Zod validation errors ─────────────────────────────────────
    if (err instanceof ZodError) {
        res.status(422).json({
            success: false,
            error_code: 'VALIDATION_ERROR' as ErrorCode,
            message: 'Validation failed.',
            details: err.flatten().fieldErrors,
        });
        return;
    }

    // ── Prisma known request errors ───────────────────────────────
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    error_code: 'DUPLICATE_ENTRY' as ErrorCode,
                    message: 'Duplicate entry — a record with this value already exists.',
                    details: { fields: err.meta?.target },
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    error_code: 'NOT_FOUND' as ErrorCode,
                    message: 'Record not found.',
                });
                return;
            case 'P2003':
                res.status(409).json({
                    success: false,
                    error_code: 'FOREIGN_KEY_VIOLATION' as ErrorCode,
                    message: 'Foreign key constraint failed. Referenced record does not exist.',
                });
                return;
            case 'P2014':
                res.status(409).json({
                    success: false,
                    error_code: 'CONFLICT' as ErrorCode,
                    message: 'Cannot delete — this record is referenced by other records.',
                });
                return;
        }
    }

    // ── Prisma validation errors ──────────────────────────────────
    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({
            success: false,
            error_code: 'DB_VALIDATION_ERROR' as ErrorCode,
            message: 'Database validation error.',
            ...(env.NODE_ENV === 'development' ? { details: err.message } : {}),
        });
        return;
    }

    // ── Unknown / unhandled errors ────────────────────────────────
    console.error('❌  Unhandled server error:', err);
    res.status(500).json({
        success: false,
        error_code: 'INTERNAL_ERROR' as ErrorCode,
        message: 'Internal server error.',
        ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
}
