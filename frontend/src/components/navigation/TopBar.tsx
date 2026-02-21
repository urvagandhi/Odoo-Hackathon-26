/**
 * TopBar — Drivergo-inspired clean white header.
 * Page title on left, search + bell + user avatar + logout on right.
 * Supports dark mode.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Search,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE_ANALYST: "Finance Analyst",
};

const PAGE_TITLES: Record<string, string> = {
  MANAGER: "Fleet Management",
  DISPATCHER: "Trip Dispatch",
  SAFETY_OFFICER: "Safety Center",
  FINANCE_ANALYST: "Financial Reports",
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role ?? "MANAGER";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={`h-16 border-b px-6 flex items-center gap-4 shrink-0 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'}`}>
      {/* Left — Page title */}
      <div className="flex items-center gap-4">
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {PAGE_TITLES[role]}
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
          <Search className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className={`absolute top-2 right-2.5 w-2 h-2 bg-violet-600 rounded-full ring-2 ${isDark ? 'ring-neutral-900' : 'ring-white'}`} />
        </button>

        {/* Divider */}
        <div className={`w-px h-8 ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
            className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-slate-50'}`}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "User")}&background=7c3aed&color=fff&size=36&font-size=0.4&bold=true`}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="text-left hidden sm:block">
              <p className={`text-[13px] font-semibold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.fullName ?? "User"}
              </p>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                {ROLE_LABELS[role] ?? role}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDark ? 'text-neutral-600' : 'text-slate-300'} ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl py-1 z-50 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-200'}`}>
              <div className={`px-3 py-2 border-b ${isDark ? 'border-neutral-700' : 'border-slate-100'}`}>
                <p className={`text-[11px] font-semibold ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>{user?.email}</p>
                <p className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>{ROLE_LABELS[role] ?? role}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-700' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors text-red-500 hover:text-red-600 ${isDark ? 'hover:bg-neutral-700' : 'hover:bg-red-50'}`}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
