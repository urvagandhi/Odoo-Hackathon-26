/**
 * Layout — FleetFlow sidebar + top nav.
 * Sidebar filters nav items by role. Live sidebar KPIs from analytics API.
 */
import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Settings, Bell, ChevronDown, LogOut, User,
  Car, Route, Users, AlertTriangle, Wrench, Sun, Moon,
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
  { label: "Fleet Hub", path: "/dashboard", icon: LayoutDashboard, roles: [] },
  { label: "Vehicle Registry", path: "/fleet", icon: Car, roles: ["MANAGER", "DISPATCHER", "SAFETY_OFFICER"] },
  { label: "Dispatch Control", path: "/dispatch", icon: Route, roles: ["MANAGER", "DISPATCHER"] },
  { label: "Service Station", path: "/maintenance", icon: Wrench, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { label: "Expense Ledger", path: "/fuel-expenses", icon: Fuel, roles: ["MANAGER", "FINANCE_ANALYST"] },
  { label: "Crew Gateway", path: "/drivers", icon: Users, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { label: "Operations Intel", path: "/analytics", icon: BarChart3, roles: ["MANAGER", "FINANCE_ANALYST"] },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Fleet Hub",
  "/fleet": "Vehicle Registry",
  "/dispatch": "Dispatch Control",
  "/maintenance": "Service Station",
  "/fuel-expenses": "Expense Ledger",
  "/drivers": "Crew Gateway",
  "/analytics": "Operations Intel",
  "/profile": "My Profile",
  "/settings": "System Config",
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    if (showNotifs) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  useEffect(() => {
    const fetchKpis = () => analyticsApi.getDashboardKPIs().then(setKpis).catch(() => { });
    fetchKpis();
    // Poll every 5s for near real-time KPI updates
    const interval = setInterval(fetchKpis, 5_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const section = PAGE_TITLES[location.pathname] || 
                   NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.label ||
                   "Intelligence in Motion";
    document.title = `FleetFlow | ${section}`;
  }, [location.pathname]);

  const visibleNav = NAV_ITEMS.filter(item =>
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  const initials = user
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ═══ LEFT SIDEBAR ═══════════════════════════════════ */}
      <aside className={`w-[260px] flex flex-col shrink-0 overflow-y-auto border-r transition-colors duration-300 ${
        isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"
      }`}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 overflow-hidden ${
              isDark ? "bg-slate-900 shadow-blue-900/50" : "bg-white shadow-blue-200"
            }`}>
              <img src="/logo-premium.png" alt="FleetFlow" className="w-full h-full object-cover" />
            </div>
            <span className={`text-xl font-bold tracking-tight bg-clip-text text-transparent ${
              isDark ? "bg-gradient-to-r from-blue-400 to-teal-400" : "bg-gradient-to-r from-blue-700 to-teal-600"
            }`}>
              FleetFlow
            </span>
          </Link>
        </div>

        {/* Live KPI mini-stats */}
        {kpis && (
          <div className={`mx-4 mb-4 p-3.5 rounded-2xl border transition-colors ${
            isDark ? "bg-slate-900/50 border-slate-800/80 backdrop-blur-sm" : "bg-slate-50 border-slate-100"
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Fleet Overview</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpis.fleet.onTrip}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>On Trip</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-teal-400" : "text-teal-600"}`}>{kpis.fleet.available}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>Available</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-amber-400" : "text-amber-600"}`}>{kpis.fleet.inShop}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>In Shop</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpis.fleet.utilizationRate}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>Utilization</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts badge */}
        {kpis && (kpis.alerts.maintenanceAlerts > 0 || kpis.alerts.expiringLicenses > 0) && (
          <div className={`mx-4 mb-4 p-3 rounded-xl border ${
            isDark ? "bg-amber-950/30 border-amber-900/50" : "bg-amber-50 border-amber-200"
          }`}>
            {kpis.alerts.maintenanceAlerts > 0 && (
              <div className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                <AlertTriangle className="w-4 h-4" />
                <span>{kpis.alerts.maintenanceAlerts} vehicles in shop</span>
              </div>
            )}
            {kpis.alerts.expiringLicenses > 0 && (
              <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                <Shield className="w-4 h-4" />
                <span>{kpis.alerts.expiringLicenses} licenses expiring</span>
              </div>
            )}
          </div>
        )}

        <div className={`mx-4 border-t mb-4 ${isDark ? "border-slate-800" : "border-slate-200"}`} />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {visibleNav.map(item => {
            const isActive = item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
            
            const activeClass = isDark
              ? "bg-blue-600/10 text-blue-400 border-blue-500/20"
              : "bg-blue-50 text-blue-700 border-blue-200";
              
            const idleClass = isDark
              ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent";

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  isActive ? activeClass : idleClass
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* ═══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={`border-b px-6 py-3.5 transition-colors duration-300 z-10 sticky top-0 backdrop-blur-md ${
          isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
        }`}>
          <div className="flex items-center justify-end gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                <Bell className="w-5 h-5" />
                {kpis && (kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses + kpis.alerts.suspendedDrivers + kpis.fleet.retired) > 0 && (
                  <span className={`absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 ${isDark ? "border-slate-950" : "border-white"}`} />
                )}
              </button>
              {showNotifs && (
                <div className={`absolute right-0 top-12 z-50 w-80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border overflow-hidden transition-all ${
                  isDark ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200"
                }`}>
                  <div className={`px-4 py-3 border-b font-bold text-sm flex items-center justify-between ${
                    isDark ? "border-slate-800 text-slate-100" : "border-slate-100 text-slate-900"
                  }`}>
                    <span>Notifications</span>
                    {kpis && <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 font-bold uppercase tracking-wider">{kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses + kpis.alerts.suspendedDrivers + kpis.fleet.retired} New</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {kpis && kpis.alerts.maintenanceAlerts > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>Maintenance Alert</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{kpis.alerts.maintenanceAlerts} vehicle{kpis.alerts.maintenanceAlerts > 1 ? "s" : ""} currently in the shop and require attention</p>
                          <p className="text-[10px] text-amber-500 font-medium mt-1">High Priority</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.alerts.expiringLicenses > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>License Expiry Warning</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{kpis.alerts.expiringLicenses} driver license{kpis.alerts.expiringLicenses > 1 ? "s" : ""} expiring within 30 days</p>
                          <p className="text-[10px] text-red-500 font-medium mt-1">Urgent</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.alerts.suspendedDrivers > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>Suspended Drivers</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{kpis.alerts.suspendedDrivers} driver{kpis.alerts.suspendedDrivers > 1 ? "s" : ""} currently suspended from duty</p>
                          <p className="text-[10px] text-violet-500 font-medium mt-1">Action Required</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.fleet.retired > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-neutral-500/10 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>Retired Vehicles</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{kpis.fleet.retired} vehicle{kpis.fleet.retired > 1 ? "s" : ""} have been retired from the fleet</p>
                          <p className="text-[10px] text-neutral-500 font-medium mt-1">Informational</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.fleet.inShop === 0 && kpis.alerts.expiringLicenses === 0 && kpis.alerts.suspendedDrivers === 0 && kpis.fleet.retired === 0 && (
                      <div className="px-4 py-8 text-center">
                        <Bell className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-neutral-600" : "text-neutral-300"}`} />
                        <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>All clear — no alerts</p>
                      </div>
                    )}
                  </div>
                  <div className={`px-4 py-3 border-t text-center ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
                    <button onClick={() => { setShowNotifs(false); navigate("/dashboard"); }} className="text-xs text-blue-500 font-bold hover:text-blue-600 transition-colors">View Dashboard →</button>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-2.5 p-1 pr-3 rounded-full transition-colors border ${
                  isDark ? "hover:bg-slate-800/80 border-transparent hover:border-slate-700" : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                }`}>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-sm font-bold leading-tight ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                      {user?.fullName ?? "User"}
                    </p>
                    <p className={`text-[10px] font-medium leading-tight uppercase tracking-wide ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                      {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
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
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 transition-colors duration-300 ${isDark ? "bg-[#0B1120]" : "bg-slate-50/50"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
