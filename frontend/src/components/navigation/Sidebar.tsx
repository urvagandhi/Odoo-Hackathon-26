/**
 * Sidebar — clean white sidebar with section labels and active indicator.
 * Supports dark mode and i18n.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  Bell,
  MessageSquare,
  Activity,
  HelpCircle,
  User,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import Logo from "../Branding/Logo";

/* ── Types ──────────────────────────────────────────────── */
interface NavItem {
  labelKey: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

/* ── Nav sections per role ──────────────────────────────── */
const NAV_SECTIONS: Record<string, NavSection[]> = {
  MANAGER: [
    {
      titleKey: "nav.sections.mainMenu",
      items: [
        { labelKey: "nav.items.fleetHub", icon: LayoutDashboard, path: "/dashboard" },
        { labelKey: "nav.items.vehicleRegistry", icon: Truck, path: "/fleet/vehicles" },
        { labelKey: "nav.items.dispatchControl", icon: Route, path: "/dispatch/trips" },
        { labelKey: "nav.items.communications", icon: MessageSquare, path: "/messages", badge: 6 },
        { labelKey: "nav.items.operationalFeed", icon: Activity, path: "/activity" },
      ],
    },
    {
      titleKey: "nav.sections.general",
      items: [
        { labelKey: "nav.items.financialReports", icon: FileText, path: "/finance/reports" },
        { labelKey: "nav.items.helpCenter", icon: HelpCircle, path: "/support" },
        { labelKey: "nav.items.myIdentity", icon: User, path: "/settings" },
      ],
    },
    {
      titleKey: "nav.sections.others",
      items: [
        { labelKey: "nav.items.settings", icon: Settings, path: "/settings/general" },
      ],
    },
  ],
  DISPATCHER: [
    {
      titleKey: "nav.sections.mainMenu",
      items: [
        { labelKey: "nav.items.fleetHub", icon: LayoutDashboard, path: "/dashboard" },
        { labelKey: "nav.items.tripLedger", icon: Route, path: "/dispatch/trips" },
        { labelKey: "nav.items.initiateTrip", icon: Route, path: "/dispatch/new" },
      ],
    },
    {
      titleKey: "nav.sections.fleet",
      items: [
        { labelKey: "nav.items.fleetCatalog", icon: Truck, path: "/fleet/vehicles" },
        { labelKey: "nav.items.crewRecords", icon: Users, path: "/hr/drivers" },
      ],
    },
    {
      titleKey: "nav.sections.others",
      items: [
        { labelKey: "nav.items.alertCenter", icon: Bell, path: "/notifications" },
        { labelKey: "nav.items.settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
  SAFETY_OFFICER: [
    {
      titleKey: "nav.sections.mainMenu",
      items: [
        { labelKey: "nav.items.fleetHub", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      titleKey: "nav.sections.safety",
      items: [
        { labelKey: "nav.items.safetyLog", icon: AlertTriangle, path: "/safety/incidents" },
        { labelKey: "nav.items.crewRecords", icon: Users, path: "/hr/drivers" },
        { labelKey: "nav.items.crewScores", icon: BarChart3, path: "/hr/performance" },
      ],
    },
    {
      titleKey: "nav.sections.maintenance",
      items: [
        { labelKey: "nav.items.serviceLogs", icon: Wrench, path: "/fleet/maintenance" },
        { labelKey: "nav.items.fleetCatalog", icon: Truck, path: "/fleet/vehicles" },
      ],
    },
    {
      titleKey: "nav.sections.others",
      items: [
        { labelKey: "nav.items.incidentIntel", icon: FileText, path: "/safety/reports" },
        { labelKey: "nav.items.settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
  FINANCE_ANALYST: [
    {
      titleKey: "nav.sections.mainMenu",
      items: [
        { labelKey: "nav.items.fleetHub", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      titleKey: "nav.sections.finance",
      items: [
        { labelKey: "nav.items.revenueStream", icon: DollarSign, path: "/finance/ledger" },
        { labelKey: "nav.items.fuelIntel", icon: Fuel, path: "/finance/fuel" },
        { labelKey: "nav.items.profitLoss", icon: DollarSign, path: "/finance/pnl" },
      ],
    },
    {
      titleKey: "nav.sections.reports",
      items: [
        { labelKey: "nav.items.financialReports", icon: FileText, path: "/finance/reports" },
        { labelKey: "nav.items.costIntel", icon: BarChart3, path: "/finance/cost-analysis" },
      ],
    },
    {
      titleKey: "nav.sections.others",
      items: [
        { labelKey: "nav.items.operationsIntel", icon: BarChart3, path: "/analytics" },
        { labelKey: "nav.items.settings", icon: Settings, path: "/settings" },
      ],
    },
  ],
  DRIVER: [
    {
      titleKey: "nav.sections.mainMenu",
      items: [
        { labelKey: "nav.items.crewGateway", icon: LayoutDashboard, path: "/driver" },
      ],
    },
    {
      titleKey: "nav.sections.general",
      items: [
        { labelKey: "nav.items.helpCenter", icon: HelpCircle, path: "/support" },
        { labelKey: "nav.items.myIdentity", icon: User, path: "/settings" },
      ],
    },
  ],
};

/* ── Props ──────────────────────────────────────────────── */
interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const role = user?.role ?? "MANAGER";
  const sections = NAV_SECTIONS[role] ?? NAV_SECTIONS["MANAGER"];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col h-screen border-r
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:static md:z-auto md:translate-x-0 md:shrink-0
      ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'}
    `}>
      {/* ── Logo ─────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-5 h-16 shrink-0 border-b ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
        <Logo size="sm" className="bg-white" />
        <span className={`text-[15px] font-bold tracking-tight whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
          FleetFlow
        </span>
        <div className="flex-1" />
        {onClose && (
          <button
            onClick={onClose}
            className={`md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.titleKey && (
              <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>
                {t(section.titleKey)}
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
                    <span className="flex-1 text-left whitespace-nowrap">{t(item.labelKey)}</span>
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
          <span>{t("common.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
