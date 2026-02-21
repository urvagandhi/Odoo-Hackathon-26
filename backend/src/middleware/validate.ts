import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * validate — Zod schema validation middleware factory.
 *
 * Usage (per api-agent.md pattern):
 *   router.post('/trips', authenticate, validate(CreateTripSchema), controller.create);
 *   router.get('/trips', authenticate, validate(TripQuerySchema, 'query'), controller.list);
 *
 * On success:  replaces req[source] with the parsed (coerced + stripped) value, then calls next().
 * On failure:  passes a ZodError to next(), which the global errorHandler maps to HTTP 422.
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body' | 'query' | 'params')
 */
export const validate =
    (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            next(result.error);
        } else {
            req[source] = result.data;
            next();
        }
    };
