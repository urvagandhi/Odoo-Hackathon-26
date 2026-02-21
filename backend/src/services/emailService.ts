/**
 * FleetFlow — Email Notification Service
 * ─────────────────────────────────────────
 * Development: Auto-creates an Ethereal test account. Every sent email
 *   is captured at https://ethereal.email — preview URL logged to console.
 * Production:  Uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS from env.
 *
 * Used by cronJobs.ts to deliver:
 *   • License expiry alerts (driver auto-suspend warning)
 *   • Maintenance reminder alerts (upcoming + overdue)
 *   • Vehicle document expiry alerts (insurance, registration, etc.)
 */

import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

// ─────────────────────────────────────────────────────────────────
//  Transporter initialization
// ─────────────────────────────────────────────────────────────────

async function getTransporter(): Promise<Transporter> {
    if (transporter) return transporter;

    if (env.SMTP_HOST) {
        // Production / custom SMTP
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
        console.log(`📧  Email: using SMTP host ${env.SMTP_HOST}:${env.SMTP_PORT}`);
    } else {
        // Development: Ethereal fake SMTP — emails visible at ethereal.email
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`📧  Email: Ethereal test account created — ${testAccount.user}`);
        console.log(`📧  View sent emails at: https://ethereal.email`);
    }

    return transporter;
}

// ─────────────────────────────────────────────────────────────────
//  Core send helper
// ─────────────────────────────────────────────────────────────────

async function sendEmail(subject: string, html: string, to?: string): Promise<void> {
    try {
        const t = await getTransporter();
        const info = await t.sendMail({
            from: env.SMTP_FROM,
            to: to ?? env.SMTP_ALERT_TO,
            subject,
            html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧  Email preview: ${previewUrl}`);
        }
    } catch (err) {
        // Never crash the cron job if email fails
        console.error('📧  Email send failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────
//  Typed alert senders
// ─────────────────────────────────────────────────────────────────

export interface LicenseExpiryAlert {
    driverName: string;
    licenseNumber: string;
    expiryDate: string;
    autoSuspended: boolean;
}

export async function sendLicenseExpiryAlert(drivers: LicenseExpiryAlert[]): Promise<void> {
    if (drivers.length === 0) return;

    const rows = drivers
        .map(
            (d) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${d.driverName}</td>
        <td style="padding:8px;border:1px solid #ddd">${d.licenseNumber}</td>
        <td style="padding:8px;border:1px solid #ddd">${d.expiryDate}</td>
        <td style="padding:8px;border:1px solid #ddd;color:${d.autoSuspended ? '#c0392b' : '#e67e22'}">
          ${d.autoSuspended ? '🔴 AUTO-SUSPENDED' : '⚠️ Expiring Soon'}
        </td>
      </tr>`,
        )
        .join('');

    const html = `
    <h2 style="color:#c0392b">🚨 FleetFlow — Driver License Alert</h2>
    <p>${drivers.length} driver(s) require immediate attention:</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
      <thead>
        <tr style="background:#f2f2f2">
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Driver</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">License No.</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Expiry Date</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#7f8c8d;font-size:12px;margin-top:24px">
      Sent by FleetFlow automated cron job — ${new Date().toISOString()}
    </p>`;

    await sendEmail(`🚨 FleetFlow: ${drivers.length} Driver License(s) Require Attention`, html);
}

export interface MaintenanceAlert {
    licensePlate: string;
    makeModel: string;
    serviceType: string;
    dueDate: string;
    overdue: boolean;
}

export async function sendMaintenanceAlert(upcoming: MaintenanceAlert[], overdue: MaintenanceAlert[]): Promise<void> {
    if (upcoming.length === 0 && overdue.length === 0) return;

    const renderRows = (items: MaintenanceAlert[], isOverdue: boolean) =>
        items
            .map(
                (m) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${m.licensePlate}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.makeModel}</td>
        <td style="padding:8px;border:1px solid #ddd">${m.serviceType}</td>
        <td style="padding:8px;border:1px solid #ddd;color:${isOverdue ? '#c0392b' : '#e67e22'}">${m.dueDate}</td>
      </tr>`,
            )
            .join('');

    const html = `
    <h2 style="color:#e67e22">🔧 FleetFlow — Maintenance Alert</h2>
    ${overdue.length > 0 ? `
      <h3 style="color:#c0392b">🚨 Overdue (${overdue.length})</h3>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;margin-bottom:24px">
        <thead><tr style="background:#f2f2f2">
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Vehicle</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Make/Model</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Service</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Was Due</th>
        </tr></thead>
        <tbody>${renderRows(overdue, true)}</tbody>
      </table>` : ''}
    ${upcoming.length > 0 ? `
      <h3 style="color:#e67e22">⚠️ Due Within 7 Days (${upcoming.length})</h3>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
        <thead><tr style="background:#f2f2f2">
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Vehicle</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Make/Model</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Service</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Due Date</th>
        </tr></thead>
        <tbody>${renderRows(upcoming, false)}</tbody>
      </table>` : ''}
    <p style="color:#7f8c8d;font-size:12px;margin-top:24px">
      Sent by FleetFlow automated cron job — ${new Date().toISOString()}
    </p>`;

    const total = upcoming.length + overdue.length;
    await sendEmail(`🔧 FleetFlow: ${total} Vehicle Maintenance Alert(s)`, html);
}

export interface DocumentExpiryAlert {
    licensePlate: string;
    makeModel: string;
    documentType: string;
    expiresAt: string;
    daysUntilExpiry: number;
}

export async function sendDocumentExpiryAlert(documents: DocumentExpiryAlert[]): Promise<void> {
    if (documents.length === 0) return;

    const rows = documents
        .map(
            (d) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${d.licensePlate}</td>
        <td style="padding:8px;border:1px solid #ddd">${d.makeModel}</td>
        <td style="padding:8px;border:1px solid #ddd">${d.documentType}</td>
        <td style="padding:8px;border:1px solid #ddd">${d.expiresAt}</td>
        <td style="padding:8px;border:1px solid #ddd;color:${d.daysUntilExpiry <= 7 ? '#c0392b' : '#e67e22'}">
          ${d.daysUntilExpiry <= 0 ? 'EXPIRED' : `${d.daysUntilExpiry} days`}
        </td>
      </tr>`,
        )
        .join('');

    const html = `
    <h2 style="color:#8e44ad">📄 FleetFlow — Vehicle Document Expiry Alert</h2>
    <p>${documents.length} document(s) are expiring soon or have expired:</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
      <thead>
        <tr style="background:#f2f2f2">
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Vehicle</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Make/Model</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Document</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Expires</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:left">Days Left</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#7f8c8d;font-size:12px;margin-top:24px">
      Sent by FleetFlow automated cron job — ${new Date().toISOString()}
    </p>`;

    await sendEmail(`📄 FleetFlow: ${documents.length} Vehicle Document(s) Expiring`, html);
}
