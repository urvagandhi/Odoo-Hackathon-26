/**
 * Layout — FleetFlow sidebar + top nav.
 * Sidebar filters nav items by role. Live sidebar KPIs from analytics API.
 */
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  Truck, LayoutDashboard, Settings, Bell, ChevronDown, LogOut, User,
  Car, Route, DollarSign, Users, AlertTriangle, Wrench, Sun, Moon,
  BarChart3, Fuel, Shield,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem,
} from "./ui/DropdownMenu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi, type DashboardKPIs } from "../api/client";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE_ANALYST: "Finance Analyst",
};

// Nav items with role restrictions (empty = all roles can see)
const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: [] },
  { label: "Fleet", path: "/fleet", icon: Car, roles: ["MANAGER", "DISPATCHER", "SAFETY_OFFICER"] },
  { label: "Dispatch", path: "/dispatch", icon: Route, roles: ["MANAGER", "DISPATCHER"] },
  { label: "Maintenance", path: "/maintenance", icon: Wrench, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { label: "Fuel & Expenses", path: "/fuel-expenses", icon: Fuel, roles: ["MANAGER", "FINANCE_ANALYST"] },
  { label: "Drivers", path: "/drivers", icon: Users, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { label: "Analytics", path: "/analytics", icon: BarChart3, roles: ["MANAGER", "FINANCE_ANALYST"] },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    analyticsApi.getDashboardKPIs().then(setKpis).catch(() => { });
  }, []);

  const visibleNav = NAV_ITEMS.filter(item =>
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  const initials = user
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDark ? "bg-neutral-900" : "bg-[#f0f4f0]"}`}>
      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════ */}
      <aside className="w-[260px] bg-[#0d1f1a] text-white flex flex-col shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">FleetFlow</span>
          </Link>
        </div>

        {/* Live KPI mini-stats */}
        {kpis && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-2">Fleet Overview</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{kpis.fleet.onTrip}</p>
                <p className="text-[10px] text-neutral-400">On Trip</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">{kpis.fleet.available}</p>
                <p className="text-[10px] text-neutral-400">Available</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-400">{kpis.fleet.inShop}</p>
                <p className="text-[10px] text-neutral-400">In Shop</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{kpis.fleet.utilizationRate}</p>
                <p className="text-[10px] text-neutral-400">Utilization</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts badge */}
        {kpis && (kpis.alerts.maintenanceAlerts > 0 || kpis.alerts.expiringLicenses > 0) && (
          <div className="mx-4 mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            {kpis.alerts.maintenanceAlerts > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{kpis.alerts.maintenanceAlerts} vehicles in shop</span>
              </div>
            )}
            {kpis.alerts.expiringLicenses > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>{kpis.alerts.expiringLicenses} licenses expiring</span>
              </div>
            )}
          </div>
        )}

        <div className="mx-4 border-t border-white/10 mb-3" />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5">
          {visibleNav.map(item => {
            const isActive = item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-neutral-500">{ROLE_LABELS[user?.role ?? ""] ?? user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={`border-b px-6 py-3 transition-colors duration-200 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
          }`}>
          <div className="flex items-center justify-end gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                }`}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notifications */}
            <button className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              }`}>
              <Bell className="w-[18px] h-[18px]" />
              {kpis && (kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses) > 0 && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 ${isDark ? "border-neutral-900" : "border-white"}`} />
              )}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-2 p-1 pr-2 rounded-full transition-colors ${isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-xs font-semibold leading-tight ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>
                      {user?.fullName ?? "User"}
                    </p>
                    <p className={`text-[10px] leading-tight ${isDark ? "text-neutral-500" : "text-neutral-500"}`}>
                      {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <div className="px-4 py-3 border-b border-slate-100/50">
                  <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => navigate("/profile")}>
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={handleLogout}>
                  <LogOut className="w-4 h-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${isDark ? "bg-neutral-900" : "bg-[#f0f4f0]"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
