import { Router } from 'express';
import { financeController } from './finance.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const financeRouter = Router();

financeRouter.use(authenticate);

// Finance Analyst logs fuel/expenses; Manager has view + override access
const financeRoles = [UserRole.MANAGER, UserRole.FINANCE_ANALYST];

// Fuel logs
financeRouter.post('/fuel', authorize(financeRoles), financeController.createFuelLog.bind(financeController));
financeRouter.get('/fuel', authorize(financeRoles), financeController.listFuelLogs.bind(financeController));

// Expenses
financeRouter.post('/expenses', authorize(financeRoles), financeController.createExpense.bind(financeController));
financeRouter.get('/expenses', authorize(financeRoles), financeController.listExpenses.bind(financeController));

// Maintenance logs
financeRouter.get(
    '/maintenance',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER, UserRole.FINANCE_ANALYST]),
    financeController.listMaintenanceLogs.bind(financeController),
);
financeRouter.post(
    '/maintenance',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    financeController.createMaintenanceLog.bind(financeController),
);

// PATCH /api/v1/finance/maintenance/:id/close
// Releases vehicle from IN_SHOP → AVAILABLE when maintenance is complete
financeRouter.patch(
    '/maintenance/:id/close',
    authorize([UserRole.MANAGER, UserRole.SAFETY_OFFICER]),
    financeController.closeMaintenanceLog.bind(financeController),
);
