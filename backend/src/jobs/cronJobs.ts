/**
 * FleetFlow — Background Cron Jobs
 * ──────────────────────────────────
 * Scheduled tasks that run without user interaction.
 *
 * Jobs:
 *   1. License Expiry Check  — daily at 00:05 UTC
 *      Auto-suspends drivers whose CDL has expired.
 *      Sends email alert to Manager.
 *
 *   2. Maintenance Reminder  — daily at 08:00 UTC
 *      Logs warning when a vehicle's nextServiceDue is within 7 days.
 *      Sends email alert to Manager.
 *
 *   3. Document Expiry Check — daily at 07:00 UTC
 *      Alerts when vehicle documents (insurance, registration, etc.)
 *      expire within 30 days. Sends email alert to Manager.
 *
 * Uses node-cron v4 (built-in TypeScript types, no @types needed).
 */

import cron from 'node-cron';
import prisma from '../prisma';
import { DriverStatus, AuditAction } from '@prisma/client';
import {
    sendLicenseExpiryAlert,
    sendMaintenanceAlert,
    sendDocumentExpiryAlert,
    LicenseExpiryAlert,
    MaintenanceAlert,
    DocumentExpiryAlert,
} from '../services/emailService';

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

        const emailAlerts: LicenseExpiryAlert[] = [];

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

            const expiryDate = driver.licenseExpiryDate.toISOString().split('T')[0];
            console.log(
                `  🔴  Auto-suspended driver ${driver.fullName} (${driver.licenseNumber}) — ` +
                `license expired: ${expiryDate}`,
            );

            emailAlerts.push({
                driverName: driver.fullName,
                licenseNumber: driver.licenseNumber,
                expiryDate,
                autoSuspended: true,
            });
        }

        // Send email alert to Manager
        await sendLicenseExpiryAlert(emailAlerts);
        console.log(`✅  [CRON] License expiry check complete. ${expiredDrivers.length} driver(s) suspended. Alert email sent.`);
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

        const upcomingServices = await prisma.maintenanceLog.findMany({
            where: {
                nextServiceDue: { gte: now, lte: cutoff },
                vehicle: { isDeleted: false },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
            },
            orderBy: { nextServiceDue: 'asc' },
        });

        const overdueServices = await prisma.maintenanceLog.findMany({
            where: {
                nextServiceDue: { lt: now },
                vehicle: { isDeleted: false, status: { not: 'IN_SHOP' } },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
            },
        });

        if (upcomingServices.length === 0 && overdueServices.length === 0) {
            console.log('✅  [CRON] No upcoming or overdue maintenance.');
            return;
        }

        const upcomingAlerts: MaintenanceAlert[] = upcomingServices.map((log) => ({
            licensePlate: log.vehicle.licensePlate,
            makeModel: `${log.vehicle.make} ${log.vehicle.model}`,
            serviceType: log.serviceType,
            dueDate: log.nextServiceDue!.toISOString().split('T')[0],
            overdue: false,
        }));

        const overdueAlerts: MaintenanceAlert[] = overdueServices.map((log) => ({
            licensePlate: log.vehicle.licensePlate,
            makeModel: `${log.vehicle.make} ${log.vehicle.model}`,
            serviceType: log.serviceType,
            dueDate: log.nextServiceDue!.toISOString().split('T')[0],
            overdue: true,
        }));

        if (upcomingAlerts.length > 0) {
            console.log(`⚠️  [CRON] ${upcomingAlerts.length} vehicle(s) have service due within 7 days:`);
            upcomingAlerts.forEach((a) => console.log(`  🔧  [${a.licensePlate}] ${a.serviceType} due: ${a.dueDate}`));
        }

        if (overdueAlerts.length > 0) {
            console.log(`🚨  [CRON] ${overdueAlerts.length} vehicle(s) have OVERDUE maintenance:`);
            overdueAlerts.forEach((a) => console.log(`  🚨  [${a.licensePlate}] ${a.serviceType} overdue since ${a.dueDate}`));
        }

        await sendMaintenanceAlert(upcomingAlerts, overdueAlerts);
        console.log('✅  [CRON] Maintenance reminder complete. Alert email sent.');
    } catch (err) {
        console.error('❌  [CRON] Maintenance reminder check failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
//  JOB 3 — Vehicle document expiry check (insurance, registration, etc.)
// ─────────────────────────────────────────────────────────────────

async function runDocumentExpiryCheck(): Promise<void> {
    console.log('🕐  [CRON] Running vehicle document expiry check...');

    try {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

        const expiringDocs = await prisma.vehicleDocument.findMany({
            where: {
                isActive: true,
                expiresAt: { lte: cutoff },
                vehicle: { isDeleted: false },
            },
            include: {
                vehicle: { select: { licensePlate: true, make: true, model: true } },
            },
            orderBy: { expiresAt: 'asc' },
        });

        if (expiringDocs.length === 0) {
            console.log('✅  [CRON] No expiring vehicle documents found.');
            return;
        }

        console.log(`⚠️  [CRON] ${expiringDocs.length} vehicle document(s) expiring within 30 days:`);

        const alerts: DocumentExpiryAlert[] = expiringDocs.map((doc) => {
            const expiresAt = doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt);
            const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const expiryDateStr = expiresAt.toISOString().split('T')[0];

            console.log(
                `  📄  [${doc.vehicle.licensePlate}] ${doc.documentType} — ` +
                `expires: ${expiryDateStr} (${daysUntilExpiry} days)`,
            );

            return {
                licensePlate: doc.vehicle.licensePlate,
                makeModel: `${doc.vehicle.make} ${doc.vehicle.model}`,
                documentType: doc.documentType,
                expiresAt: expiryDateStr,
                daysUntilExpiry,
            };
        });

        await sendDocumentExpiryAlert(alerts);
        console.log('✅  [CRON] Document expiry check complete. Alert email sent.');
    } catch (err) {
        console.error('❌  [CRON] Document expiry check failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
//  Register and start all cron jobs
// ─────────────────────────────────────────────────────────────────

export function startCronJobs(): void {
    // Job 1: License expiry — daily at 00:05 UTC
    cron.schedule('5 0 * * *', runLicenseExpiryCheck, { timezone: 'UTC' });
    console.log('✅  [CRON] License expiry check scheduled: daily at 00:05 UTC');

    // Job 2: Maintenance reminder — daily at 08:00 UTC
    cron.schedule('0 8 * * *', runMaintenanceReminder, { timezone: 'UTC' });
    console.log('✅  [CRON] Maintenance reminder scheduled: daily at 08:00 UTC');

    // Job 3: Document expiry — daily at 07:00 UTC
    cron.schedule('0 7 * * *', runDocumentExpiryCheck, { timezone: 'UTC' });
    console.log('✅  [CRON] Document expiry check scheduled: daily at 07:00 UTC');

    // Run license check immediately on startup to catch any overnight expirations
    runLicenseExpiryCheck();
}
