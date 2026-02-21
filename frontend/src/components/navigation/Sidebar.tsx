/**
 * Sidebar — Drivergo-inspired clean white sidebar with section labels
 * and a purple/violet active state indicator.
 * Matches reference: white bg, grouped nav with MAIN MENU / GENERAL / OTHERS.
 * Supports dark mode.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Shield,
  DollarSign,
  Fuel,
  Wrench,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Bell,
  MessageSquare,
  Activity,
  HelpCircle,
  User,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

/* ── Types ──────────────────────────────────────────────── */
interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

/* ── Nav sections per role ──────────────────────────────── */
const NAV_SECTIONS: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Shipment", icon: Truck, path: "/fleet/vehicles" },
        { label: "Orders", icon: Route, path: "/dispatch/trips" },
        { label: "Message", icon: MessageSquare, path: "/messages", badge: 6 },
        { label: "Activity", icon: Activity, path: "/activity" },
      ],
    },
    {
      title: "GENERAL",
      items: [
        { label: "Report", icon: FileText, path: "/finance/reports" },
        { label: "Support", icon: HelpCircle, path: "/support" },
        { label: "Account", icon: User, path: "/settings" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Settings", icon: Settings, path: "/settings/general" },
      ],
    },
  ],
  MANAGER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Shipment", icon: Truck, path: "/fleet/vehicles" },
        { label: "Orders", icon: Route, path: "/dispatch/trips" },
        { label: "Message", icon: MessageSquare, path: "/messages", badge: 6 },
        { label: "Activity", icon: Activity, path: "/activity" },
      ],
    },
    {
      title: "GENERAL",
      items: [
        { label: "Report", icon: FileText, path: "/finance/reports" },
        { label: "Support", icon: HelpCircle, path: "/support" },
        { label: "Account", icon: User, path: "/settings" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Settings", icon: Settings, path: "/settings/general" },
      ],
    },
  ],
  DISPATCHER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "All Trips", icon: Route, path: "/dispatch/trips" },
        { label: "Create Trip", icon: Route, path: "/dispatch/new" },
      ],
    },
    {
      title: "FLEET",
      items: [
        { label: "Vehicles", icon: Truck, path: "/fleet/vehicles" },
        { label: "Drivers", icon: Users, path: "/hr/drivers" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Notifications", icon: Bell, path: "/notifications" },
        { label: "Settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
  SAFETY_OFFICER: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      title: "SAFETY",
      items: [
        { label: "Incidents", icon: AlertTriangle, path: "/safety/incidents" },
        { label: "Drivers", icon: Users, path: "/hr/drivers" },
        { label: "Performance", icon: BarChart3, path: "/hr/performance" },
      ],
    },
    {
      title: "MAINTENANCE",
      items: [
        { label: "Service Logs", icon: Wrench, path: "/fleet/maintenance" },
        { label: "Vehicles", icon: Truck, path: "/fleet/vehicles" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Reports", icon: FileText, path: "/safety/reports" },
        { label: "Settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
  FINANCE_ANALYST: [
    {
      title: "MAIN MENU",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Revenue", icon: DollarSign, path: "/finance/ledger" },
        { label: "Fuel", icon: Fuel, path: "/finance/fuel" },
        { label: "P&L", icon: DollarSign, path: "/finance/pnl" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { label: "Reports", icon: FileText, path: "/finance/reports" },
        { label: "Cost Analysis", icon: BarChart3, path: "/finance/cost-analysis" },
      ],
    },
    {
      title: "OTHERS",
      items: [
        { label: "Analytics", icon: BarChart3, path: "/analytics" },
        { label: "Settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const role = user?.role ?? "SUPER_ADMIN";
  const sections = NAV_SECTIONS[role] ?? NAV_SECTIONS["SUPER_ADMIN"];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`w-[230px] flex flex-col h-screen shrink-0 border-r ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'}`}>
      {/* ── Logo ─────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 h-16 shrink-0 border-b ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Truck className="w-4.5 h-4.5 text-white" />
        </div>
        <span className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
          FleetFlow
        </span>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
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
                    {item.badge && (
                      <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        active ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom section ────────────────────────────── */}
      <div className={`p-3 space-y-1 shrink-0 border-t ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isDark ? 'text-neutral-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
