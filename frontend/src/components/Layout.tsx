/**
 * Layout — FleetFlow app shell.
 * Uses our Drivergo-inspired Sidebar (violet/white) + teammate's polished top bar
 * (theme toggle, notification badge, user dropdown).
 */
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Settings, Sun, Moon, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuItem,
} from "./ui/DropdownMenu";
import Sidebar from "./navigation/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi, type DashboardKPIs } from "../api/client";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE_ANALYST: "Finance Analyst",
};

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    analyticsApi.getDashboardKPIs().then(setKpis).catch(() => {});
  }, []);

  const initials = user
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleLogout = () => { logout(); navigate("/login"); };

  const alertCount = kpis
    ? (kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses)
    : 0;

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>

      {/* ═══ LEFT SIDEBAR (Drivergo-inspired, violet accent) ═══ */}
      <Sidebar kpis={kpis} />

      {/* ═══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className={`border-b px-6 py-3 transition-colors duration-200 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-end gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-slate-100 hover:text-neutral-700"}`}
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notifications */}
            <button
              aria-label="Notifications"
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-white" : "text-neutral-500 hover:bg-slate-100 hover:text-neutral-700"}`}
            >
              <Bell className="w-[18px] h-[18px]" />
              {alertCount > 0 && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 ${isDark ? "border-neutral-900" : "border-white"}`} />
              )}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-2 p-1 pr-2 rounded-full transition-colors ${isDark ? "hover:bg-neutral-800" : "hover:bg-slate-100"}`}>
                  <div className="w-8 h-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-xs">
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
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-50 text-violet-700">
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
        <main className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
