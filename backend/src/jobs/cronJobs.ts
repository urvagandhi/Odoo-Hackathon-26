/**
 * FleetFlow — Background Cron Jobs
 * ──────────────────────────────────
 * Scheduled tasks that run without user interaction.
 *
 * Jobs:
 *   1. License Expiry Check  — daily at 00:05 UTC
 *      Auto-suspends drivers whose CDL has expired.
 *
 *   2. Maintenance Reminder  — daily at 08:00 UTC
 *      Logs warning when a vehicle's nextServiceDue is within 7 days.
 *
 * Uses node-cron v4 (built-in TypeScript types, no @types needed).
 */

import cron from 'node-cron';
import prisma from '../prisma';
import { DriverStatus, AuditAction } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────
//  JOB 1 — Daily license expiry check & auto-suspend
// ─────────────────────────────────────────────────────────────────

async function runLicenseExpiryCheck(): Promise<void> {
    console.log('🕐  [CRON] Running license expiry check...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Find all non-suspended, non-deleted drivers with expired licenses
        const expiredDrivers = await prisma.driver.findMany({
            where: {
                isDeleted: false,
                status: { notIn: [DriverStatus.SUSPENDED, DriverStatus.ON_TRIP] },
                licenseExpiryDate: { lt: today },
            },
            select: { id: true, fullName: true, licenseNumber: true, licenseExpiryDate: true },
        });

        if (expiredDrivers.length === 0) {
            console.log('✅  [CRON] No expired licenses found.');
            return;
        }

        console.log(`⚠️  [CRON] Found ${expiredDrivers.length} driver(s) with expired licenses. Auto-suspending...`);

        for (const driver of expiredDrivers) {
            await prisma.$transaction(async (tx) => {
                await tx.driver.update({
                    where: { id: driver.id },
                    data: { status: DriverStatus.SUSPENDED },
                });

                await tx.auditLog.create({
                    data: {
                        userId: null,   // System action — no human actor
                        entity: 'Driver',
                        entityId: driver.id,
                        action: AuditAction.UPDATE,
                        oldValues: { status: 'ACTIVE' },
                        newValues: { status: DriverStatus.SUSPENDED },
                        reason: `Auto-suspended by system: license expired on ${driver.licenseExpiryDate.toISOString().split('T')[0]}`,
                        ipAddress: 'system-cron',
                    },
                });
            });

            console.log(
                `  🔴  Auto-suspended driver ${driver.fullName} (${driver.licenseNumber}) — ` +
                `license expired: ${driver.licenseExpiryDate.toISOString().split('T')[0]}`,
            );
        }

        console.log(`✅  [CRON] License expiry check complete. ${expiredDrivers.length} driver(s) suspended.`);
    } catch (err) {
        console.error('❌  [CRON] License expiry check failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
//  JOB 2 — Maintenance reminder (nextServiceDue within 7 days)
// ─────────────────────────────────────────────────────────────────

async function runMaintenanceReminder(): Promise<void> {
    console.log('🕐  [CRON] Running maintenance reminder check...');

    try {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

        // Find maintenance logs with upcoming nextServiceDue
        const upcomingServices = await prisma.maintenanceLog.findMany({
            where: {
                nextServiceDue: {
                    gte: now,
                    lte: cutoff,
                },
                vehicle: { isDeleted: false },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
            },
            orderBy: { nextServiceDue: 'asc' },
        });

        if (upcomingServices.length === 0) {
            console.log('✅  [CRON] No upcoming maintenance services due within 7 days.');
            return;
        }

        console.log(`⚠️  [CRON] ${upcomingServices.length} vehicle(s) have service due within 7 days:`);
        for (const log of upcomingServices) {
            const dueDate = log.nextServiceDue!.toISOString().split('T')[0];
            console.log(
                `  🔧  [${log.vehicle.licensePlate}] ${log.vehicle.make} ${log.vehicle.model} — ` +
                `Next ${log.serviceType} due: ${dueDate}`,
            );
        }

        // Additionally: warn about vehicles that have passed their nextServiceDue (overdue)
        const overdueServices = await prisma.maintenanceLog.findMany({
            where: {
                nextServiceDue: { lt: now },
                vehicle: { isDeleted: false, status: { not: 'IN_SHOP' } },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
            },
        });

        if (overdueServices.length > 0) {
            console.log(`🚨  [CRON] ${overdueServices.length} vehicle(s) have OVERDUE maintenance:`);
            for (const log of overdueServices) {
                const overdueSince = log.nextServiceDue!.toISOString().split('T')[0];
                console.log(
                    `  🚨  [${log.vehicle.licensePlate}] ${log.serviceType} overdue since ${overdueSince}`,
                );
            }
        }
    } catch (err) {
        console.error('❌  [CRON] Maintenance reminder check failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
//  Register and start all cron jobs
// ─────────────────────────────────────────────────────────────────

export function startCronJobs(): void {
    // Job 1: License expiry — daily at 00:05 UTC
    cron.schedule('5 0 * * *', runLicenseExpiryCheck, {
        timezone: 'UTC',
    });
    console.log('✅  [CRON] License expiry check scheduled: daily at 00:05 UTC');

    // Job 2: Maintenance reminder — daily at 08:00 UTC
    cron.schedule('0 8 * * *', runMaintenanceReminder, {
        timezone: 'UTC',
    });
    console.log('✅  [CRON] Maintenance reminder scheduled: daily at 08:00 UTC');

    // Run license check immediately on startup to catch any overnight expirations
    runLicenseExpiryCheck();
}
