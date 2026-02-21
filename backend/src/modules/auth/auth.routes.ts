import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

// POST /api/v1/auth/register
authRouter.post('/register', authController.register.bind(authController));

// POST /api/v1/auth/login
authRouter.post('/login', authController.login.bind(authController));

// GET /api/v1/auth/me  (requires auth)
authRouter.get('/me', authenticate, authController.getMe.bind(authController));
