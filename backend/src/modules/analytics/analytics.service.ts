/**
 * FleetFlow — Analytics Service
 * ──────────────────────────────
 * Aggregation queries for the dashboard, financial reports, and data export.
 *
 * All monetary values returned as JavaScript numbers (via Number() cast from Decimal).
 * KPIs are computed via parallel Prisma queries for minimal latency.
 */

import prisma from '../../prisma';
import { VehicleStatus, TripStatus, DriverStatus } from '@prisma/client';

export class AnalyticsService {
    // ─────────────────────────────────────────────────────────────
    //  Dashboard KPIs
    // ─────────────────────────────────────────────────────────────

    async getDashboardKPIs() {
        const now = new Date();
        const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [
            totalVehicles,
            availableVehicles,
            onTripVehicles,
            inShopVehicles,
            retiredVehicles,
            totalDrivers,
            onDutyDrivers,
            suspendedDrivers,
            pendingTrips,
            activeTrips,
            completedTripsToday,
            expiringLicenses,
        ] = await Promise.all([
            // Fleet counts
            prisma.vehicle.count({ where: { isDeleted: false } }),
            prisma.vehicle.count({ where: { isDeleted: false, status: VehicleStatus.AVAILABLE } }),
            prisma.vehicle.count({ where: { isDeleted: false, status: VehicleStatus.ON_TRIP } }),
            prisma.vehicle.count({ where: { isDeleted: false, status: VehicleStatus.IN_SHOP } }),
            prisma.vehicle.count({ where: { isDeleted: false, status: VehicleStatus.RETIRED } }),
            // Driver counts
            prisma.driver.count({ where: { isDeleted: false } }),
            prisma.driver.count({ where: { isDeleted: false, status: DriverStatus.ON_DUTY } }),
            prisma.driver.count({ where: { isDeleted: false, status: DriverStatus.SUSPENDED } }),
            // Trip counts
            prisma.trip.count({ where: { status: TripStatus.DRAFT } }),
            prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
            prisma.trip.count({
                where: {
                    status: TripStatus.COMPLETED,
                    completionTime: { gte: new Date(now.setHours(0, 0, 0, 0)) },
                },
            }),
            // Compliance
            prisma.driver.count({
                where: {
                    isDeleted: false,
                    status: { not: DriverStatus.SUSPENDED },
                    licenseExpiryDate: { lte: thirtyDaysAhead },
                },
            }),
        ]);

        const activeFleet = availableVehicles + onTripVehicles;
        const utilizationRate = activeFleet > 0
            ? parseFloat(((onTripVehicles / activeFleet) * 100).toFixed(2))
            : 0;

        return {
            fleet: {
                total: totalVehicles,
                active: activeFleet,
                available: availableVehicles,
                onTrip: onTripVehicles,
                inShop: inShopVehicles,
                retired: retiredVehicles,
                utilizationRate: `${utilizationRate}%`,
            },
            drivers: {
                total: totalDrivers,
                onDuty: onDutyDrivers,
                suspended: suspendedDrivers,
                expiringLicenses,
            },
            trips: {
                pending: pendingTrips,
                active: activeTrips,
                completedToday: completedTripsToday,
            },
            alerts: {
                maintenanceAlerts: inShopVehicles,
                expiringLicenses,
                suspendedDrivers,
            },
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  Fuel Efficiency — km per liter per vehicle
    // ─────────────────────────────────────────────────────────────

    async getFuelEfficiency(startDate?: Date, endDate?: Date) {
        const dateFilter = startDate && endDate
            ? { gte: startDate, lte: endDate }
            : undefined;

        const vehicles = await prisma.vehicle.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                licensePlate: true,
                make: true,
                model: true,
                trips: {
                    where: {
                        status: TripStatus.COMPLETED,
                        ...(dateFilter ? { completionTime: dateFilter } : {}),
                    },
                    select: { distanceActual: true },
                },
                fuelLogs: {
                    where: dateFilter ? { loggedAt: dateFilter } : {},
                    select: { liters: true, totalCost: true },
                },
            },
            orderBy: { licensePlate: 'asc' },
        });

        return vehicles.map((v) => {
            const totalDistanceKm = v.trips.reduce(
                (sum, t) => sum + Number(t.distanceActual ?? 0),
                0,
            );
            const totalLiters = v.fuelLogs.reduce(
                (sum, f) => sum + Number(f.liters),
                0,
            );
            const totalFuelCost = v.fuelLogs.reduce(
                (sum, f) => sum + Number(f.totalCost),
                0,
            );

            const kmPerLiter = totalLiters > 0
                ? parseFloat((totalDistanceKm / totalLiters).toFixed(3))
                : null;

            const costPerKm = totalDistanceKm > 0
                ? parseFloat((totalFuelCost / totalDistanceKm).toFixed(4))
                : null;

            return {
                vehicleId: v.id.toString(),
                licensePlate: v.licensePlate,
                make: v.make,
                model: v.model,
                totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
                totalLiters: parseFloat(totalLiters.toFixed(2)),
                totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
                kmPerLiter,
                costPerKm,
            };
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Vehicle ROI — profit = Revenue - (Fuel + Maintenance)
    //  Note: acquisitionCost is not in schema; profit margin returned instead.
    // ─────────────────────────────────────────────────────────────

    async getVehicleROI(startDate?: Date, endDate?: Date) {
        const dateFilter = startDate && endDate
            ? { gte: startDate, lte: endDate }
            : undefined;

        const vehicles = await prisma.vehicle.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                licensePlate: true,
                make: true,
                model: true,
                trips: {
                    where: {
                        status: TripStatus.COMPLETED,
                        ...(dateFilter ? { completionTime: dateFilter } : {}),
                    },
                    select: { revenue: true },
                },
                fuelLogs: {
                    where: dateFilter ? { loggedAt: dateFilter } : {},
                    select: { totalCost: true },
                },
                maintenanceLogs: {
                    where: dateFilter ? { serviceDate: dateFilter } : {},
                    select: { cost: true },
                },
                expenses: {
                    where: dateFilter ? { dateLogged: dateFilter } : {},
                    select: { amount: true },
                },
            },
            orderBy: { licensePlate: 'asc' },
        });

        return vehicles.map((v) => {
            const revenue = v.trips.reduce((sum, t) => sum + Number(t.revenue ?? 0), 0);
            const fuelCost = v.fuelLogs.reduce((sum, f) => sum + Number(f.totalCost), 0);
            const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + Number(m.cost), 0);
            const expenseCost = v.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalCost = fuelCost + maintenanceCost + expenseCost;
            const profit = revenue - totalCost;
            const profitMargin = revenue > 0
                ? parseFloat(((profit / revenue) * 100).toFixed(2))
                : null;

            return {
                vehicleId: v.id.toString(),
                licensePlate: v.licensePlate,
                make: v.make,
                model: v.model,
                revenue: parseFloat(revenue.toFixed(2)),
                fuelCost: parseFloat(fuelCost.toFixed(2)),
                maintenanceCost: parseFloat(maintenanceCost.toFixed(2)),
                expenseCost: parseFloat(expenseCost.toFixed(2)),
                totalCost: parseFloat(totalCost.toFixed(2)),
                profit: parseFloat(profit.toFixed(2)),
                profitMargin: profitMargin !== null ? `${profitMargin}%` : 'N/A',
            };
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  Monthly Report — trips, revenue, costs grouped by month
    // ─────────────────────────────────────────────────────────────

    async getMonthlyReport(year: number) {
        const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
        const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

        const [trips, fuelLogs, maintenanceLogs, expenses] = await Promise.all([
            prisma.trip.findMany({
                where: {
                    status: TripStatus.COMPLETED,
                    completionTime: { gte: startOfYear, lte: endOfYear },
                },
                select: { revenue: true, completionTime: true, distanceActual: true },
            }),
            prisma.fuelLog.findMany({
                where: { loggedAt: { gte: startOfYear, lte: endOfYear } },
                select: { totalCost: true, liters: true, loggedAt: true },
            }),
            prisma.maintenanceLog.findMany({
                where: { serviceDate: { gte: startOfYear, lte: endOfYear } },
                select: { cost: true, serviceDate: true },
            }),
            prisma.expense.findMany({
                where: { dateLogged: { gte: startOfYear, lte: endOfYear } },
                select: { amount: true, dateLogged: true },
            }),
        ]);

        // Build month-indexed buckets (1-12)
        const months: Record<number, {
            month: number;
            label: string;
            tripsCompleted: number;
            totalDistanceKm: number;
            revenue: number;
            fuelCost: number;
            maintenanceCost: number;
            otherExpenses: number;
            totalCost: number;
            profit: number;
        }> = {};

        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];

        for (let m = 1; m <= 12; m++) {
            months[m] = {
                month: m,
                label: `${monthNames[m - 1]} ${year}`,
                tripsCompleted: 0,
                totalDistanceKm: 0,
                revenue: 0,
                fuelCost: 0,
                maintenanceCost: 0,
                otherExpenses: 0,
                totalCost: 0,
                profit: 0,
            };
        }

        for (const trip of trips) {
            const m = new Date(trip.completionTime!).getUTCMonth() + 1;
            months[m].tripsCompleted += 1;
            months[m].revenue += Number(trip.revenue ?? 0);
            months[m].totalDistanceKm += Number(trip.distanceActual ?? 0);
        }

        for (const f of fuelLogs) {
            const m = new Date(f.loggedAt).getUTCMonth() + 1;
            months[m].fuelCost += Number(f.totalCost);
        }

        for (const ml of maintenanceLogs) {
            const m = new Date(ml.serviceDate).getUTCMonth() + 1;
            months[m].maintenanceCost += Number(ml.cost);
        }

        for (const e of expenses) {
            const m = new Date(e.dateLogged).getUTCMonth() + 1;
            months[m].otherExpenses += Number(e.amount);
        }

        return Object.values(months).map((m) => {
            m.totalCost = m.fuelCost + m.maintenanceCost + m.otherExpenses;
            m.profit = m.revenue - m.totalCost;
            // Round all numbers to 2dp
            return {
                ...m,
                totalDistanceKm: parseFloat(m.totalDistanceKm.toFixed(2)),
                revenue: parseFloat(m.revenue.toFixed(2)),
                fuelCost: parseFloat(m.fuelCost.toFixed(2)),
                maintenanceCost: parseFloat(m.maintenanceCost.toFixed(2)),
                otherExpenses: parseFloat(m.otherExpenses.toFixed(2)),
                totalCost: parseFloat(m.totalCost.toFixed(2)),
                profit: parseFloat(m.profit.toFixed(2)),
            };
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  CSV Export — Generates raw CSV string for monthly trip data
    // ─────────────────────────────────────────────────────────────

    async exportTripsCSV(startDate: Date, endDate: Date): Promise<string> {
        const trips = await prisma.trip.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
                driver: { select: { fullName: true, licenseNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const headers = [
            'Trip ID',
            'Status',
            'Origin',
            'Destination',
            'Vehicle',
            'Driver',
            'Cargo Weight (kg)',
            'Distance Estimated (km)',
            'Distance Actual (km)',
            'Revenue',
            'Client',
            'Invoice Ref',
            'Dispatch Time',
            'Completion Time',
            'Created At',
        ];

        const escape = (v: unknown): string => {
            if (v === null || v === undefined) return '';
            const s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const rows = trips.map((t) => [
            t.id.toString(),
            t.status,
            t.origin,
            t.destination,
            `${t.vehicle.make} ${t.vehicle.model} (${t.vehicle.licensePlate})`,
            `${t.driver.fullName} (${t.driver.licenseNumber})`,
            t.cargoWeight?.toString() ?? '',
            t.distanceEstimated.toString(),
            t.distanceActual?.toString() ?? '',
            t.revenue?.toString() ?? '',
            t.clientName ?? '',
            t.invoiceReference ?? '',
            t.dispatchTime?.toISOString() ?? '',
            t.completionTime?.toISOString() ?? '',
            t.createdAt.toISOString(),
        ].map(escape).join(','));

        return [headers.join(','), ...rows].join('\n');
    }

    // ─────────────────────────────────────────────────────────────
    //  Driver Performance
    // ─────────────────────────────────────────────────────────────

    async getDriverPerformance(startDate?: Date, endDate?: Date) {
        const dateFilter = startDate && endDate
            ? { gte: startDate, lte: endDate }
            : undefined;

        const drivers = await prisma.driver.findMany({
            where: { isDeleted: false },
            select: {
                id: true,
                fullName: true,
                licenseNumber: true,
                status: true,
                safetyScore: true,
                licenseExpiryDate: true,
                trips: {
                    where: dateFilter ? { dispatchTime: dateFilter } : undefined,
                    select: {
                        id: true,
                        status: true,
                        distanceActual: true,
                        revenue: true,
                        dispatchTime: true,
                        completionTime: true,
                    },
                },
                incidents: {
                    where: dateFilter ? { incidentDate: dateFilter } : undefined,
                    select: { id: true, incidentType: true, status: true },
                },
            },
            orderBy: { safetyScore: 'desc' },
        });

        return drivers.map((d) => {
            const completed  = d.trips.filter((t) => t.status === 'COMPLETED');
            const cancelled  = d.trips.filter((t) => t.status === 'CANCELLED');
            const totalKm    = completed.reduce((sum, t) => sum + Number(t.distanceActual ?? 0), 0);
            const totalRev   = completed.reduce((sum, t) => sum + Number(t.revenue ?? 0), 0);

            // Average trip duration in hours (dispatched → completed)
            const durations = completed
                .filter((t) => t.dispatchTime && t.completionTime)
                .map((t) => (t.completionTime!.getTime() - t.dispatchTime!.getTime()) / 3_600_000);
            const avgDurationHrs = durations.length
                ? durations.reduce((a, b) => a + b, 0) / durations.length
                : null;

            return {
                driverId:          Number(d.id),
                fullName:          d.fullName,
                licenseNumber:     d.licenseNumber,
                status:            d.status,
                safetyScore:       Number(d.safetyScore),
                licenseExpiryDate: d.licenseExpiryDate.toISOString().split('T')[0],
                trips: {
                    total:     d.trips.length,
                    completed: completed.length,
                    cancelled: cancelled.length,
                    active:    d.trips.length - completed.length - cancelled.length,
                },
                performance: {
                    totalKm:          Math.round(totalKm * 100) / 100,
                    totalRevenue:     Math.round(totalRev * 100) / 100,
                    avgTripDurationHrs: avgDurationHrs !== null
                        ? Math.round(avgDurationHrs * 100) / 100
                        : null,
                },
                incidents: {
                    total:    d.incidents.length,
                    open:     d.incidents.filter((i) => i.status === 'OPEN').length,
                    byType:   d.incidents.reduce<Record<string, number>>((acc, i) => {
                        acc[i.incidentType] = (acc[i.incidentType] ?? 0) + 1;
                        return acc;
                    }, {}),
                },
            };
        });
    }
}

export const analyticsService = new AnalyticsService();
