/**
 * Sidebar — Drivergo-inspired clean white sidebar with section labels
 * and a violet active state indicator.
 * Receives live KPI data from Layout for the mini fleet overview panel.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  DollarSign,
  Fuel,
  Wrench,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  AlertTriangle,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import type { DashboardKPIs } from "../../api/client";

/* ── Types ──────────────────────────────────────────────── */
interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

/* ── Nav sections per role ──────────────────────────────── */
const NAV_SECTIONS: Record<string, NavSection[]> = {
  MANAGER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard",     icon: LayoutDashboard, path: "/dashboard" },
        { label: "Fleet",         icon: Truck,           path: "/fleet" },
        { label: "Dispatch",      icon: Route,           path: "/dispatch" },
        { label: "Drivers",       icon: Users,           path: "/drivers" },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { label: "Maintenance",   icon: Wrench,          path: "/maintenance" },
        { label: "Fuel & Expenses", icon: Fuel,          path: "/fuel-expenses" },
        { label: "Analytics",     icon: BarChart3,       path: "/analytics" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "Settings",      icon: Settings,        path: "/settings" },
      ],
    },
  ],
  DISPATCHER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard",     icon: LayoutDashboard, path: "/dashboard" },
        { label: "Dispatch",      icon: Route,           path: "/dispatch" },
      ],
    },
    {
      title: "FLEET",
      items: [
        { label: "Vehicles",      icon: Truck,           path: "/fleet" },
        { label: "Drivers",       icon: Users,           path: "/drivers" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Settings",      icon: Settings,        path: "/settings" },
      ],
    },
  ],
  SAFETY_OFFICER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard",     icon: LayoutDashboard, path: "/dashboard" },
        { label: "Drivers",       icon: Users,           path: "/drivers" },
      ],
    },
    {
      title: "MAINTENANCE",
      items: [
        { label: "Service Logs",  icon: Wrench,          path: "/maintenance" },
        { label: "Vehicles",      icon: Truck,           path: "/fleet" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Reports",       icon: FileText,        path: "/analytics" },
        { label: "Settings",      icon: Settings,        path: "/settings" },
      ],
    },
  ],
  FINANCE_ANALYST: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard",     icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Fuel & Expenses", icon: Fuel,          path: "/fuel-expenses" },
        { label: "Analytics",     icon: BarChart3,       path: "/analytics" },
        { label: "Revenue",       icon: DollarSign,      path: "/analytics" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Settings",      icon: Settings,        path: "/settings" },
      ],
    },
  ],
};

interface SidebarProps {
  kpis?: DashboardKPIs | null;
}

export default function Sidebar({ kpis }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const role = user?.role ?? "MANAGER";
  const sections = NAV_SECTIONS[role] ?? NAV_SECTIONS["MANAGER"];

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <aside className={`w-[230px] flex flex-col h-screen shrink-0 border-r ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-100"}`}>

      {/* ── Logo ─────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 h-16 shrink-0 border-b ${isDark ? "border-neutral-800" : "border-slate-100"}`}>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${isDark ? "text-white" : "text-slate-900"}`}>
          FleetFlow
        </span>
      </div>

      {/* ── Live Fleet Overview ───────────────────────── */}
      {kpis && (
        <div className={`mx-3 mt-3 p-3 rounded-xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-slate-50 border-slate-100"}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-violet-400" : "text-violet-600"}`}>
            Fleet Overview
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{kpis.fleet.onTrip}</p>
              <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>On Trip</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-500">{kpis.fleet.available}</p>
              <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Available</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">{kpis.fleet.inShop}</p>
              <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>In Shop</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{kpis.fleet.utilizationRate}</p>
              <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Utilization</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts banner ────────────────────────────── */}
      {kpis && (kpis.alerts.maintenanceAlerts > 0 || kpis.alerts.expiringLicenses > 0) && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
          {kpis.alerts.maintenanceAlerts > 0 && (
            <div className="flex items-center gap-2 text-amber-700 text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{kpis.alerts.maintenanceAlerts} vehicle{kpis.alerts.maintenanceAlerts > 1 ? "s" : ""} in shop</span>
            </div>
          )}
          {kpis.alerts.expiringLicenses > 0 && (
            <div className="flex items-center gap-2 text-amber-700 text-xs">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>{kpis.alerts.expiringLicenses} license{kpis.alerts.expiringLicenses > 1 ? "s" : ""} expiring</span>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150
                      ${active
                        ? "bg-violet-600 text-white"
                        : isDark
                          ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-violet-600"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-white" : ""}`} />
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User + Logout ─────────────────────────────── */}
      <div className={`p-3 shrink-0 border-t ${isDark ? "border-neutral-800" : "border-slate-100"}`}>
        {/* User info */}
        <div className={`flex items-center gap-2.5 px-3 py-2 mb-1 rounded-lg ${isDark ? "bg-neutral-800" : "bg-slate-50"}`}>
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
            {user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??"}
          </div>
          <div className="min-w-0">
            <p className={`text-[12px] font-semibold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{user?.fullName}</p>
            <p className={`text-[10px] truncate ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{user?.role}</p>
          </div>
        </div>
        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isDark ? "text-neutral-500 hover:text-red-400 hover:bg-red-900/20" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
