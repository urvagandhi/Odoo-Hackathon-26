/**
 * Profile page — connected to real auth context.
 * Shows user info from JWT, fleet-relevant stats, and dark mode support.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  Edit3,
  Shield,
  Activity,
  Truck,
  Navigation,
  Users,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi } from "../api/client";
import type { KpiData } from "../api/client";

/* ── Role formatting ──────────────────────────────── */

const ROLE_LABELS: Record<string, { label: string; color: string; darkColor: string; bg: string; darkBg: string }> = {
  MANAGER: { label: "Fleet Manager", color: "text-indigo-700", darkColor: "text-indigo-300", bg: "bg-indigo-50", darkBg: "bg-indigo-900/30" },
  DISPATCHER: { label: "Dispatcher", color: "text-blue-700", darkColor: "text-blue-300", bg: "bg-blue-50", darkBg: "bg-blue-900/30" },
  SAFETY_OFFICER: { label: "Safety Officer", color: "text-emerald-700", darkColor: "text-emerald-300", bg: "bg-emerald-50", darkBg: "bg-emerald-900/30" },
  FINANCE_ANALYST: { label: "Finance Analyst", color: "text-amber-700", darkColor: "text-amber-300", bg: "bg-amber-50", darkBg: "bg-amber-900/30" },
  SUPER_ADMIN: { label: "Super Administrator", color: "text-purple-700", darkColor: "text-purple-300", bg: "bg-purple-50", darkBg: "bg-purple-900/30" },
};

/* ── Animation variants ────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

/* ── Profile page ──────────────────────────────────── */

export default function Profile() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [kpi, setKpi] = useState<KpiData | null>(null);

  useEffect(() => {
    analyticsApi.getKpi().then(setKpi).catch(() => {});
  }, []);

  const roleInfo = ROLE_LABELS[user?.role ?? ""] ?? {
    label: user?.role ?? "User",
    color: "text-slate-700",
    darkColor: "text-slate-300",
    bg: "bg-slate-50",
    darkBg: "bg-slate-800",
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  // Fleet stats derived from KPI
  const STATS = [
    {
      label: "Vehicles",
      value: kpi?.fleet.total?.toString() ?? "—",
      icon: Truck,
      colorClass: isDark ? "text-indigo-400" : "text-indigo-600",
      bgClass: isDark ? "bg-indigo-900/30" : "bg-indigo-50",
    },
    {
      label: "Active Trips",
      value: kpi?.trips.active?.toString() ?? "—",
      icon: Navigation,
      colorClass: isDark ? "text-emerald-400" : "text-emerald-600",
      bgClass: isDark ? "bg-emerald-900/30" : "bg-emerald-50",
    },
    {
      label: "Drivers",
      value: kpi?.drivers.total?.toString() ?? "—",
      icon: Users,
      colorClass: isDark ? "text-amber-400" : "text-amber-600",
      bgClass: isDark ? "bg-amber-900/30" : "bg-amber-50",
    },
  ];

  const PERSONAL_DETAILS = [
    { icon: User, label: "Full Name", value: user?.fullName ?? "—" },
    { icon: Mail, label: "Email Address", value: user?.email ?? "—" },
    { icon: Shield, label: "Role", value: roleInfo.label },
    { icon: Briefcase, label: "Department", value: "Fleet Operations" },
  ];

  // Quick fleet overview for activity tab
  const FLEET_OVERVIEW = [
    { label: "Total Vehicles", value: kpi?.fleet.total ?? 0, icon: Truck, color: isDark ? "text-blue-400" : "text-blue-600" },
    { label: "On Trip", value: kpi?.fleet.onTrip ?? 0, icon: Navigation, color: isDark ? "text-emerald-400" : "text-emerald-600" },
    { label: "In Shop", value: kpi?.fleet.inShop ?? 0, icon: Wrench, color: isDark ? "text-amber-400" : "text-amber-600" },
    { label: "Utilization", value: `${kpi?.fleet.utilizationRate ?? 0}%`, icon: TrendingUp, color: isDark ? "text-indigo-400" : "text-indigo-600" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 lg:space-y-8"
      >
        {/* ── Hero Profile Card ────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className={`relative overflow-hidden rounded-3xl border shadow-sm hover:shadow-md transition-shadow duration-200 ${
            isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
          }`}
        >
          {/* Top accent line */}
          <div className="h-2 w-full bg-indigo-600" />

          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Left Identity Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar with initials */}
                <div className="relative shrink-0">
                  <div
                    className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border flex items-center justify-center shadow-sm ${
                      isDark
                        ? "border-neutral-600 bg-neutral-700"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span
                      className={`text-3xl sm:text-4xl font-bold ${
                        isDark ? "text-indigo-400" : "text-indigo-600"
                      }`}
                    >
                      {initials}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                </div>

                {/* Details */}
                <div className="text-center sm:text-left mt-2 sm:mt-4">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-3 sm:mb-4 ${
                      isDark
                        ? `${roleInfo.darkBg} border-neutral-600`
                        : `${roleInfo.bg} border-indigo-100`
                    }`}
                  >
                    <Shield className={`w-3.5 h-3.5 ${isDark ? roleInfo.darkColor : roleInfo.color}`} />
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? roleInfo.darkColor : roleInfo.color
                      }`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>
                  <h1
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {user?.fullName ?? "User"}
                  </h1>
                  <p
                    className={`text-base sm:text-lg font-medium mt-1 ${
                      isDark ? "text-neutral-400" : "text-slate-600"
                    }`}
                  >
                    {user?.email ?? "—"}
                  </p>
                </div>
              </div>

              {/* Right Action Button */}
              <div className="flex items-center justify-center sm:justify-end gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                <button
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto"
                  onClick={() => window.location.href = "/settings"}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div
              className={`mt-8 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                isDark ? "border-neutral-700" : "border-slate-100"
              }`}
            >
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl border ${
                    isDark
                      ? "bg-neutral-700/50 border-neutral-600/50"
                      : "bg-slate-50/50 border-slate-100/50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bgClass}`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.colorClass}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {stat.value}
                    </p>
                    <p
                      className={`text-xs font-medium uppercase tracking-widest ${
                        isDark ? "text-neutral-400" : "text-slate-500"
                      }`}
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Main Layout (Left: Content, Right: Sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Tab Navigation */}
            <motion.div
              variants={itemVariants}
              className={`flex items-center gap-2 p-1.5 rounded-2xl border shadow-sm inline-flex ${
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
              }`}
            >
              {(["overview", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                    ${
                      activeTab === tab
                        ? isDark
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "bg-slate-900 text-white shadow-sm"
                        : isDark
                        ? "text-neutral-400 hover:text-white hover:bg-neutral-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }
                  `}
                >
                  {tab === "overview" ? "Overview" : "Fleet Stats"}
                </button>
              ))}
            </motion.div>

            {/* Tab Views */}
            {activeTab === "overview" ? (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                {/* Contact Information Card */}
                <motion.div
                  variants={itemVariants}
                  className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-6 py-5 border-b ${
                      isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                    }`}
                  >
                    <h2
                      className={`text-base font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      <Briefcase className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                      Contact Information
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                    {PERSONAL_DETAILS.map((detail) => (
                      <div key={detail.label} className="min-w-0">
                        <p
                          className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
                            isDark ? "text-neutral-500" : "text-slate-400"
                          }`}
                        >
                          {detail.label}
                        </p>
                        <div
                          className={`flex items-center gap-2 text-sm font-medium ${
                            isDark ? "text-neutral-200" : "text-slate-900"
                          }`}
                        >
                          <detail.icon
                            className={`w-4 h-4 shrink-0 ${isDark ? "text-neutral-500" : "text-slate-400"}`}
                          />
                          <span className="truncate">{detail.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* About Card */}
                <motion.div
                  variants={itemVariants}
                  className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-6 py-5 border-b ${
                      isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                    }`}
                  >
                    <h2
                      className={`text-base font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      <User className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
                      About
                    </h2>
                  </div>
                  <div className="p-6">
                    <p
                      className={`text-sm leading-relaxed font-medium ${
                        isDark ? "text-neutral-300" : "text-slate-600"
                      }`}
                    >
                      {roleInfo.label} at FleetFlow, responsible for managing fleet operations,
                      ensuring timely deliveries, and maintaining vehicle efficiency across the
                      organization.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* Fleet Stats Tab View */
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                <motion.div
                  variants={itemVariants}
                  className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-6 py-5 border-b ${
                      isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                    }`}
                  >
                    <h2
                      className={`text-base font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      <Activity className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
                      Fleet Overview
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-4">
                    {FLEET_OVERVIEW.map((item) => (
                      <div
                        key={item.label}
                        className={`p-4 rounded-xl border ${
                          isDark ? "bg-neutral-700/50 border-neutral-600" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                          <span
                            className={`text-xs font-medium uppercase tracking-wider ${
                              isDark ? "text-neutral-400" : "text-slate-500"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Alerts */}
                <motion.div
                  variants={itemVariants}
                  className={`rounded-2xl border shadow-sm overflow-hidden ${
                    isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
                  }`}
                >
                  <div
                    className={`px-6 py-5 border-b ${
                      isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                    }`}
                  >
                    <h2
                      className={`text-base font-bold flex items-center gap-2 ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      <Shield className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                      Alerts Summary
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { label: "Maintenance Alerts", value: kpi?.alerts.maintenanceAlerts ?? 0, color: "text-amber-500" },
                      { label: "Expiring Licenses", value: kpi?.alerts.expiringLicenses ?? 0, color: "text-red-500" },
                      { label: "Suspended Drivers", value: kpi?.alerts.suspendedDrivers ?? 0, color: "text-red-500" },
                    ].map((alert) => (
                      <div
                        key={alert.label}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? "bg-neutral-700/50" : "bg-slate-50"
                        }`}
                      >
                        <span className={`text-sm font-medium ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                          {alert.label}
                        </span>
                        <span className={`text-lg font-bold ${alert.color}`}>{alert.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-6 lg:space-y-8">
            {/* Quick Details Sidebar Card */}
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-5 border-b ${
                  isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                }`}
              >
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <Calendar className={`w-5 h-5 ${isDark ? "text-neutral-400" : "text-slate-500"}`} />
                  Membership
                </h2>
              </div>
              <div className="p-6">
                <p className={`text-sm font-medium ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                  Member of <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>FleetFlow</span> fleet
                  management platform.
                </p>
              </div>
            </motion.div>

            {/* Role Permissions Card */}
            <motion.div
              variants={itemVariants}
              className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
              }`}
            >
              <div
                className={`px-6 py-5 border-b ${
                  isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-100/80 bg-slate-50/30"
                }`}
              >
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <Shield className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
                  Role & Access
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    isDark ? roleInfo.darkBg : roleInfo.bg
                  }`}
                >
                  <span className={`text-sm font-semibold ${isDark ? roleInfo.darkColor : roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  {user?.role === "MANAGER"
                    ? "Full access to all fleet operations, user management, analytics, and system settings."
                    : user?.role === "DISPATCHER"
                    ? "Manage trips, track vehicles, coordinate drivers, and handle dispatch operations."
                    : user?.role === "SAFETY_OFFICER"
                    ? "Monitor safety compliance, driver performance, incident reports, and license tracking."
                    : user?.role === "FINANCE_ANALYST"
                    ? "Access financial reports, fuel logs, expense tracking, and cost analysis dashboards."
                    : "Standard access to fleet management features."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
