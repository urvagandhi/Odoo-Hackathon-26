import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// Analytics visible to Manager and Finance Analyst
const analyticsRoles = [UserRole.MANAGER, UserRole.FINANCE_ANALYST];

// GET /api/v1/analytics/kpi
analyticsRouter.get(
    '/kpi',
    authorize(analyticsRoles),
    analyticsController.getDashboardKPIs.bind(analyticsController),
);

// GET /api/v1/analytics/fuel-efficiency?startDate=...&endDate=...
analyticsRouter.get(
    '/fuel-efficiency',
    authorize(analyticsRoles),
    analyticsController.getFuelEfficiency.bind(analyticsController),
);

// GET /api/v1/analytics/roi?startDate=...&endDate=...
analyticsRouter.get(
    '/roi',
    authorize(analyticsRoles),
    analyticsController.getVehicleROI.bind(analyticsController),
);

// GET /api/v1/analytics/monthly?year=2025
analyticsRouter.get(
    '/monthly',
    authorize(analyticsRoles),
    analyticsController.getMonthlyReport.bind(analyticsController),
);

// GET /api/v1/analytics/export/csv?startDate=...&endDate=...
analyticsRouter.get(
    '/export/csv',
    authorize(analyticsRoles),
    analyticsController.exportCSV.bind(analyticsController),
);
