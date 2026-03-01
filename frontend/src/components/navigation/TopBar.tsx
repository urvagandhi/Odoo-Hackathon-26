/**
 * TopBar — Drivergo-inspired clean white header.
 * Page title on left, search + bell + user avatar + logout on right.
 * Supports dark mode.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronDown,
  Search,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role ?? "MANAGER";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={`h-16 border-b px-4 md:px-6 flex items-center gap-4 shrink-0 ${isDark ? 'bg-[#090D0B]/80 backdrop-blur-xl border-[#1A2620]' : 'bg-white border-slate-100'}`}>
      {/* Mobile hamburger */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDark ? 'text-[#6B7C6B] hover:text-[#E4E6DE] hover:bg-[#162018]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Left — Page title */}
      <div className="flex items-center gap-4">
        <h1 className={`text-xl font-bold ${isDark ? 'text-[#E4E6DE]' : 'text-slate-900'}`}>
          {t(`topBar.pageTitles.${role}`)}
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button aria-label={t("common.search")} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isDark ? 'text-[#6B7C6B] hover:text-[#E4E6DE] hover:bg-[#162018]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
          <Search className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button aria-label={t("layout.notifications")} className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isDark ? 'text-[#6B7C6B] hover:text-[#E4E6DE] hover:bg-[#162018]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className={`absolute top-2 right-2.5 w-2 h-2 bg-[#4ADE80] rounded-full ring-2 ${isDark ? 'ring-[#090D0B]' : 'ring-white'}`} />
        </button>

        {/* Divider */}
        <div className={`w-px h-8 ${isDark ? 'bg-[#1E2B22]' : 'bg-slate-200'}`} />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
            className={`flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-200 ${isDark ? 'hover:bg-[#162018]' : 'hover:bg-slate-50'}`}
          >
            <div className="w-9 h-9 rounded-full bg-[#1A2620] text-[#4ADE80] font-bold flex items-center justify-center text-xs">
              {(user?.fullName ?? "User").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="text-left hidden sm:block">
              <p className={`text-[13px] font-semibold leading-tight ${isDark ? 'text-[#E4E6DE]' : 'text-slate-900'}`}>
                {user?.fullName ?? "User"}
              </p>
              <p className={`text-[11px] leading-tight ${isDark ? 'text-[#6B7C6B]' : 'text-slate-400'}`}>
                {t(`roleLabelsShort.${role}`)}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDark ? 'text-[#4A5C4A]' : 'text-slate-300'} ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl py-1 z-50 ${isDark ? 'bg-[#111A15] border-[#1E2B22] shadow-black/50' : 'bg-white border-slate-200'}`}>
              <div className={`px-3 py-2 border-b ${isDark ? 'border-[#1E2B22]' : 'border-slate-100'}`}>
                <p className={`text-[11px] font-semibold ${isDark ? 'text-[#B0B8A8]' : 'text-slate-700'}`}>{user?.email}</p>
                <p className={`text-[10px] ${isDark ? 'text-[#6B7C6B]' : 'text-slate-400'}`}>{t(`roleLabelsShort.${role}`)}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-all duration-200 ${isDark ? 'text-[#6B7C6B] hover:text-[#E4E6DE] hover:bg-[#1A2620]' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4" />
                {t("topBar.myProfile")}
              </button>
              <button
                onClick={handleLogout}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-all duration-200 text-red-500 hover:text-red-400 ${isDark ? 'hover:bg-[#1A2620]' : 'hover:bg-red-50'}`}
              >
                <LogOut className="w-4 h-4" />
                {t("common.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
