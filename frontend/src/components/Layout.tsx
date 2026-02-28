/**
 * Layout — FleetFlow sidebar + top nav.
 * Sidebar filters nav items by role. Live sidebar KPIs from analytics API.
 */
import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Settings, Bell, ChevronDown, LogOut, User,
  Car, Route, Users, AlertTriangle, Wrench, Sun, Moon,
  BarChart3, Fuel, Shield, Menu, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem,
} from "./ui/DropdownMenu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi, type DashboardKPIs } from "../api/client";

// Nav items with role restrictions (empty = all roles can see)
const NAV_ITEMS = [
  { labelKey: "nav.items.fleetHub", path: "/dashboard", icon: LayoutDashboard, roles: [] },
  { labelKey: "nav.items.vehicleRegistry", path: "/fleet", icon: Car, roles: ["MANAGER", "DISPATCHER", "SAFETY_OFFICER"] },
  { labelKey: "nav.items.dispatchControl", path: "/dispatch", icon: Route, roles: ["MANAGER", "DISPATCHER"] },
  { labelKey: "nav.items.serviceLogs", path: "/maintenance", icon: Wrench, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { labelKey: "nav.items.fuelIntel", path: "/fuel-expenses", icon: Fuel, roles: ["MANAGER", "FINANCE_ANALYST"] },
  { labelKey: "nav.items.crewGateway", path: "/drivers", icon: Users, roles: ["MANAGER", "SAFETY_OFFICER"] },
  { labelKey: "nav.items.operationsIntel", path: "/analytics", icon: BarChart3, roles: ["MANAGER", "FINANCE_ANALYST"] },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "nav.items.fleetHub",
  "/fleet": "nav.items.vehicleRegistry",
  "/dispatch": "nav.items.dispatchControl",
  "/maintenance": "nav.items.serviceLogs",
  "/fuel-expenses": "nav.items.fuelIntel",
  "/drivers": "nav.items.crewGateway",
  "/analytics": "nav.items.operationsIntel",
  "/profile": "topBar.myProfile",
  "/settings": "layout.systemConfig",
};

export default function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

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
    const key = PAGE_TITLE_KEYS[location.pathname] ||
                   NAV_ITEMS.find(item => location.pathname.startsWith(item.path))?.labelKey ||
                   "layout.intelligenceInMotion";
    document.title = `FleetFlow | ${t(key)}`;
  }, [location.pathname, t]);

  const visibleNav = NAV_ITEMS.filter(item =>
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  const initials = user
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ═══ MOBILE BACKDROP ════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ═══ LEFT SIDEBAR (drawer on mobile, static on md+) ═══ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col overflow-y-auto border-r
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:z-auto md:translate-x-0 md:w-[260px] md:shrink-0
        ${isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"}
      `}>
        {/* Logo + Mobile Close */}
        <div className="px-5 pt-6 pb-6 flex items-center justify-between">
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
          <button
            onClick={() => setSidebarOpen(false)}
            className={`md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live KPI mini-stats */}
        {kpis && (
          <div className={`mx-4 mb-4 p-3.5 rounded-2xl border transition-colors ${
            isDark ? "bg-slate-900/50 border-slate-800/80 backdrop-blur-sm" : "bg-slate-50 border-slate-100"
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}>{t("layout.fleetOverview")}</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpis.fleet.onTrip}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t("layout.onTrip")}</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-teal-400" : "text-teal-600"}`}>{kpis.fleet.available}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t("layout.available")}</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-amber-400" : "text-amber-600"}`}>{kpis.fleet.inShop}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t("layout.inShop")}</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpis.fleet.utilizationRate}</p>
                <p className={`text-[10px] font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>{t("layout.utilization")}</p>
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
                <span>{t("layout.vehiclesInShop", { count: kpis.alerts.maintenanceAlerts })}</span>
              </div>
            )}
            {kpis.alerts.expiringLicenses > 0 && (
              <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                <Shield className="w-4 h-4" />
                <span>{t("layout.licensesExpiring", { count: kpis.alerts.expiringLicenses })}</span>
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
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* ═══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={`border-b px-4 md:px-6 py-3.5 transition-colors duration-300 z-10 sticky top-0 backdrop-blur-md ${
          isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Spacer — pushes controls right */}
            <div className="flex-1" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              title={isDark ? t("common.switchToLight") : t("common.switchToDark")}
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
                    <span>{t("layout.notifications")}</span>
                    {kpis && <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 font-bold uppercase tracking-wider">{t("layout.notifNew", { count: kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses + kpis.alerts.suspendedDrivers + kpis.fleet.retired })}</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {kpis && kpis.alerts.maintenanceAlerts > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("layout.maintenanceAlert")}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("layout.maintenanceAlertMsg", { count: kpis.alerts.maintenanceAlerts })}</p>
                          <p className="text-[10px] text-amber-500 font-medium mt-1">{t("layout.highPriority")}</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.alerts.expiringLicenses > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("layout.licenseExpiryWarning")}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("layout.licenseExpiryMsg", { count: kpis.alerts.expiringLicenses })}</p>
                          <p className="text-[10px] text-red-500 font-medium mt-1">{t("layout.urgent")}</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.alerts.suspendedDrivers > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("layout.suspendedDrivers")}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("layout.suspendedDriversMsg", { count: kpis.alerts.suspendedDrivers })}</p>
                          <p className="text-[10px] text-violet-500 font-medium mt-1">{t("layout.actionRequired")}</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.fleet.retired > 0 && (
                      <div className={`px-4 py-3 flex items-start gap-3 border-b ${isDark ? "border-neutral-700" : "border-neutral-50"}`}>
                        <div className="w-8 h-8 rounded-lg bg-neutral-500/10 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4 text-neutral-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{t("layout.retiredVehicles")}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("layout.retiredVehiclesMsg", { count: kpis.fleet.retired })}</p>
                          <p className="text-[10px] text-neutral-500 font-medium mt-1">{t("layout.informational")}</p>
                        </div>
                      </div>
                    )}
                    {kpis && kpis.fleet.inShop === 0 && kpis.alerts.expiringLicenses === 0 && kpis.alerts.suspendedDrivers === 0 && kpis.fleet.retired === 0 && (
                      <div className="px-4 py-8 text-center">
                        <Bell className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-neutral-600" : "text-neutral-300"}`} />
                        <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("layout.allClear")}</p>
                      </div>
                    )}
                  </div>
                  <div className={`px-4 py-3 border-t text-center ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
                    <button onClick={() => { setShowNotifs(false); navigate("/dashboard"); }} className="text-xs text-blue-500 font-bold hover:text-blue-600 transition-colors">{t("common.viewDashboard")}</button>
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
                      {t(`roleLabelsShort.${user?.role ?? ""}`)}
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
                    {t(`roleLabelsShort.${user?.role ?? ""}`)}
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => navigate("/profile")}>
                    <User className="w-4 h-4 text-slate-400" /> {t("common.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 text-slate-400" /> {t("common.settings")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={handleLogout}>
                  <LogOut className="w-4 h-4" /> {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-300 ${isDark ? "bg-[#0B1120]" : "bg-slate-50/50"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
