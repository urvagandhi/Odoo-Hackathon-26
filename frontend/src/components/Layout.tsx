/**
 * Layout — MoveIQ-inspired layout with dark sidebar + main content.
 * Fully supports light and dark theme via ThemeContext.
 */
import { useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  Truck,
  LayoutDashboard,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Car,
  MapPin,
  Route,
  DollarSign,
  Users,
  ChevronRight,
  Star,
  AlertTriangle,
  Wrench,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/DropdownMenu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Admin",
  MANAGER: "Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety",
  FINANCE_ANALYST: "Finance",
};

/* ─── Top nav tabs ──────────────────────────────────────────────── */
const NAV_TABS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Fleet", path: "/fleet", icon: Car },
  { label: "Dispatch", path: "/dispatch", icon: Route },
  { label: "Locations", path: "/locations", icon: MapPin },
  { label: "Analytics", path: "/analytics", icon: DollarSign },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const initials = user
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isDark ? "bg-neutral-900" : "bg-[#f5f5f0]"}`}>
      {/* ═══ LEFT SIDEBAR — always dark themed ═══════════════════════ */}
      <aside className="w-[280px] bg-[#1a1a1a] text-white flex flex-col shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-6 pt-6 pb-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">FleetFlow</span>
          </Link>
        </div>

        {/* Fleet Performance Overview */}
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-white mb-4">
            Fleet performance
            <br />
            overview
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatBox label="Utilization" value="78%" />
            <StatBox label="Fuel Efficiency" value="8.7 mpg" />
            <StatBox label="On-time Rate" value="92%" />
            <StatBox label="Idle Time" value="1h 12m" />
          </div>
        </div>

        <div className="mx-5 border-t border-white/10" />

        {/* Top Driver */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              LW
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Lukas Weber</p>
              <p className="text-xs text-neutral-400">Top driver</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
              <Star className="w-3 h-3" />
              9.7
            </div>
          </div>

          <button className="w-full flex items-center justify-between py-2.5 px-1 text-sm text-neutral-300 hover:text-white transition-colors group">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-neutral-500" />
              <span>4 vehicles</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-500">Needing service</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white" />
            </div>
          </button>

          <button className="w-full flex items-center justify-between py-2.5 px-1 text-sm text-neutral-300 hover:text-white transition-colors group">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-neutral-500" />
              <span>3 minor</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-500">Incidents this week</span>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white" />
            </div>
          </button>
        </div>

        <div className="mx-5 border-t border-white/10" />

        {/* Vehicle on the road card */}
        <div className="px-5 py-4 mt-auto">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 p-5">
            <div className="mb-3">
              <div className="w-full h-24 rounded-xl bg-neutral-700/50 flex items-center justify-center">
                <Truck className="w-12 h-12 text-neutral-500" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Vehicle on the road</h4>
            <p className="text-xs text-neutral-400 mb-3">
              Expedite cargo fleet with real-time tracking
            </p>
            <button className="flex items-center gap-2 bg-white text-neutral-900 text-xs font-semibold px-4 py-2 rounded-full hover:bg-neutral-100 transition-colors">
              Track vehicle
              <Settings className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className={`border-b px-6 py-3 transition-colors duration-200 ${
            isDark
              ? "bg-neutral-900 border-neutral-800"
              : "bg-[#f5f5f0] border-neutral-200/50"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Nav tabs */}
            <div className="flex items-center gap-1">
              {NAV_TABS.map((tab) => {
                const isActive =
                  tab.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(tab.path);
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? isDark
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "bg-[#1a1a1a] text-white shadow-sm"
                        : isDark
                        ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    : "text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-700"
                }`}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </button>

              {/* Notifications */}
              <button
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    : "text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-700"
                }`}
              >
                <Bell className="w-[18px] h-[18px]" />
                <span
                  className={`absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 ${
                    isDark ? "border-neutral-900" : "border-[#f5f5f0]"
                  }`}
                />
              </button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 p-1 pr-2 rounded-full transition-colors ${
                      isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-200/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p
                        className={`text-xs font-semibold leading-tight ${
                          isDark ? "text-neutral-200" : "text-neutral-900"
                        }`}
                      >
                        {user?.fullName ?? "User"}
                      </p>
                      <p
                        className={`text-[10px] leading-tight ${
                          isDark ? "text-neutral-500" : "text-neutral-500"
                        }`}
                      >
                        {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 ${
                        isDark ? "text-neutral-500" : "text-neutral-400"
                      }`}
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-[220px]">
                  <div className="px-4 py-3 border-b border-slate-100/50">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 text-neutral-600">
                      {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => navigate("/profile")}>
                      <User className="w-4 h-4 text-slate-400" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/settings")}>
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </DropdownMenuItem>
                    {user?.role === "SUPER_ADMIN" && (
                      <DropdownMenuItem onSelect={() => navigate("/admin/users")}>
                        <Users className="w-4 h-4 text-slate-400" />
                        Manage Users
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 overflow-y-auto p-6 transition-colors duration-200 ${
            isDark ? "bg-neutral-900" : "bg-[#f5f5f0]"
          }`}
        >
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Stat Box (sidebar — always dark) ────────────────────────────── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-800/50 rounded-xl px-3 py-2.5 border border-white/5">
      <p className="text-[10px] text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
