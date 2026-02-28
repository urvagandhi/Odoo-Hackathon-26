/**
 * Profile page — shows the authenticated user's details from auth context.
 * Follows FleetFlow UI theme: emerald accents, dark-green sidebar palette.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, type DashboardKPIs } from "../api/client";

/* ── Animation helpers ────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

// Role labels are now from i18n: t("roles.MANAGER") etc.

const ROLE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  MANAGER: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-600" },
  DISPATCHER: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", accent: "bg-blue-600" },
  SAFETY_OFFICER: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", accent: "bg-amber-600" },
  FINANCE_ANALYST: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", accent: "bg-violet-600" },
};

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    if (user?.role === "MANAGER" || user?.role === "FINANCE_ANALYST") {
      analyticsApi.getDashboardKPIs().then(setKpis).catch(() => {});
    }
  }, [user?.role]);

  if (!user) return null;

  const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.MANAGER;
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-[1200px] mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* ── Hero Card ────────────────────────────── */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className={`h-2 w-full ${roleStyle.accent}`} />
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ${roleStyle.bg} flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow`}>
                  <span className={`text-2xl sm:text-3xl font-bold ${roleStyle.text}`}>{initials}</span>
                </div>
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm" title="Online" />
              </div>

              {/* Name & role */}
              <div className="text-center sm:text-left flex-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${roleStyle.bg} border border-current/10 mb-3`}>
                  <Shield className={`w-3.5 h-3.5 ${roleStyle.text}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${roleStyle.text}`}>
                    {t(`roles.${user.role}`)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {user.fullName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Info Cards Grid ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Contact & Role Details */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/30 dark:bg-neutral-800/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" />
                {t("profile.accountDetails")}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {[
                { icon: User, label: t("profile.fullName"), value: user.fullName },
                { icon: Mail, label: t("profile.email"), value: user.email },
                { icon: Shield, label: t("profile.role"), value: t(`roles.${user.role}`) },
                { icon: Calendar, label: t("profile.userId"), value: `#${user.id}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Role Capabilities */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/30 dark:bg-neutral-800/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                {t("profile.yourCapabilities")}
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {(t(`profile.capabilities.${user.role}`, { returnObjects: true }) as string[]).map((cap) => (
                <div key={cap} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-neutral-300">{cap}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Quick KPI Summary (MANAGER / FINANCE only) ── */}
        {kpis && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("profile.kpi.totalVehicles"), value: kpis.fleet.total, icon: Truck, color: "text-emerald-600" },
              { label: t("profile.kpi.activeTrips"), value: kpis.trips.active, icon: MapPin, color: "text-blue-600" },
              { label: t("profile.kpi.fleetUtilization"), value: kpis.fleet.utilizationRate, icon: Activity, color: "text-violet-600" },
              { label: t("profile.kpi.alerts"), value: kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses + kpis.alerts.suspendedDrivers, icon: AlertTriangle, color: "text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
