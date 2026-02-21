/**
 * TopBar — Drivergo-inspired clean white header.
 * Page title + Status dropdown on left, search + bell + user avatar on right.
 */
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Search,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../context/AuthContext";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCE: "Finance",
};

const ALL_ROLES: UserRole[] = ["ADMIN", "DISPATCHER", "SAFETY_OFFICER", "FINANCE"];

const PAGE_TITLES: Record<UserRole, string> = {
  ADMIN: "Shipment Track",
  DISPATCHER: "Trip Dispatch",
  SAFETY_OFFICER: "Safety Center",
  FINANCE: "Financial Reports",
};

export default function TopBar() {
  const { user, switchRole } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const role = user?.role ?? "ADMIN";

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center gap-4 shrink-0">
      {/* Left — Page title + Status */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900">{PAGE_TITLES[role]}</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-[13px] font-medium text-slate-600 hover:bg-slate-200 transition-colors">
          Status
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Search className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-violet-600 rounded-full ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200" />

        {/* User + Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            onBlur={() => setTimeout(() => setRoleMenuOpen(false), 200)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-1.5 transition-colors"
          >
            {/* Avatar */}
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName ?? "Admin")}&background=7c3aed&color=fff&size=36&font-size=0.4&bold=true`}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-semibold text-slate-900 leading-tight">
                {user?.fullName ?? "User"}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {ROLE_LABELS[role]}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Switch Role</p>
              </div>
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setRoleMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 text-[13px] transition-colors
                    ${r === role
                      ? "bg-violet-50 text-violet-700 font-medium"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }
                  `}
                >
                  {ROLE_LABELS[r]}
                  {r === role && <span className="float-right text-violet-600">●</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
