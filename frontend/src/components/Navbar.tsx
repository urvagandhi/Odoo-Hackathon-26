/**
 * Navbar — clean top bar for internal pages.
 * Layout: [Logo] ──── [Search] [Notifications] [DarkMode] [Avatar▾]
 * Settings is inside the avatar dropdown, not as a standalone icon.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Truck,
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

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "FF";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Main bar */}
      <div className={`${isDark ? "bg-neutral-900/80 border-neutral-700/80" : "bg-white/80 border-slate-200/80"} backdrop-blur-lg border-b`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* ── Left: Logo ─────────────── */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors duration-200">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className={`text-lg font-bold hidden sm:block transition-colors duration-150 ${isDark ? "text-white group-hover:text-emerald-400" : "text-slate-900 group-hover:text-emerald-600"}`}>
                  FleetFlow
                </span>
              </Link>
            </div>

            {/* ── Spacer ────────────────────────────── */}
            <div className="flex-1" />

            {/* ── Right: Search + Icons + Avatar ────── */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <div
                className={`
                  relative flex items-center transition-all duration-300 ease-out
                  ${searchFocused ? "w-72" : "w-52"}
                `}
              >
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`w-full pl-10 pr-9 py-2 rounded-full text-sm border placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-300 transition-all duration-200 ${isDark ? "bg-neutral-800 border-neutral-700 text-neutral-200 focus:bg-neutral-700" : "bg-slate-50 border-slate-200 text-slate-700 focus:bg-white"}`}
                />
                {searchValue && (
                  <button
                    onClick={() => setSearchValue("")}
                    className={`absolute right-3 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-neutral-600 hover:bg-neutral-500" : "bg-slate-200 hover:bg-slate-300"}`}
                    aria-label="Clear search"
                  >
                    <X className={`w-3 h-3 ${isDark ? "text-neutral-300" : "text-slate-500"}`} />
                  </button>
                )}
              </div>

              {/* Notifications */}
              <button
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
              </button>

              {/* Dark mode */}
              <button
                onClick={toggleTheme}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isDark ? "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
                ) : (
                  <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                )}
              </button>

              {/* Divider */}
              <div className={`w-px h-8 mx-1 hidden sm:block ${isDark ? "bg-neutral-700" : "bg-slate-200"}`} aria-hidden="true" />

              {/* ── User dropdown ────────────────────── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-2 p-1 pr-2 rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isDark ? "hover:bg-neutral-800" : "hover:bg-slate-50"}`}
                    aria-label="User menu"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shadow-sm ring-1 ring-inset ring-emerald-600/10">
                        <span className="text-xs">{initials}</span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 hidden sm:block ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-[240px]">
                  <div className={`px-4 py-3 border-b ${isDark ? "border-neutral-700" : "border-slate-100/50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 ring-1 ring-inset ring-emerald-600/10">
                        <span className="text-sm font-bold">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                          {user?.fullName ?? "FleetFlow User"}
                        </p>
                        <p className={`text-xs truncate ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </div>
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
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    destructive
                    onSelect={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom border line */}
      <div className={`h-[1px] ${isDark ? "bg-neutral-700/60" : "bg-slate-200/60"}`} />
    </header>
  );
}
