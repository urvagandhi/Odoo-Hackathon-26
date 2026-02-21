import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const financeRouter = Router();

financeRouter.use(authenticate);

const financeRoles = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FINANCE_ANALYST, UserRole.DISPATCHER];

// Fuel logs
financeRouter.post('/fuel', authorize(financeRoles), financeController.createFuelLog.bind(financeController));
financeRouter.get('/fuel', authorize(financeRoles), financeController.listFuelLogs.bind(financeController));

// Expenses
financeRouter.post('/expenses', authorize(financeRoles), financeController.createExpense.bind(financeController));
financeRouter.get('/expenses', authorize(financeRoles), financeController.listExpenses.bind(financeController));

// Maintenance logs — Safety Officer can log maintenance
financeRouter.post(
    '/maintenance',
    authorize([UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    financeController.createMaintenanceLog.bind(financeController),
);
