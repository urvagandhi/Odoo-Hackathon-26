/**
 * Navbar — clean top bar for internal pages.
 * Layout: [Hamburger] [Logo] ──── [Search] [Notifications] [DarkMode] [Avatar▾]
 * Settings is inside the avatar dropdown, not as a standalone icon.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  // Menu,
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  // DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/DropdownMenu";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ }: NavbarProps) {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-50">
      {/* Main bar */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* ── Left: Hamburger + Logo ─────────────── */}
            <div className="flex items-center gap-3 shrink-0">
              {/* <button
                onClick={onToggleSidebar}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" strokeWidth={1.8} />
              </button> */}

              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors duration-200">
                  <span className="text-white text-sm font-bold">⚡</span>
                </div>
                <span className="text-lg font-bold text-slate-900 hidden sm:block group-hover:text-indigo-600 transition-colors duration-150">
                  HackStack
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
                  className="w-full pl-10 pr-9 py-2 rounded-full text-sm bg-slate-50 border border-slate-200 placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 focus:bg-white transition-all duration-200"
                />
                {searchValue && (
                  <button
                    onClick={() => setSearchValue("")}
                    className="absolute right-3 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>

              {/* Notifications */}
              <button
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white" />
              </button>

              {/* Dark mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
                ) : (
                  <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                )}
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" aria-hidden="true" />

              {/* ── User dropdown ────────────────────── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-slate-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label="User menu"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shadow-sm ring-1 ring-inset ring-indigo-600/10">
                        <span className="text-xs">UG</span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-[240px]">
                  <div className="px-4 py-3 border-b border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 ring-1 ring-inset ring-indigo-600/10">
                        <span className="text-sm font-bold">UG</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          Urva Gandhi
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          urva.gandhi@example.com
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
                    onSelect={() => navigate("/login")}
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

      {/* Subtle bottom border line instead of gradient */}
      <div className="h-[1px] bg-slate-200/60" />
    </header>
  );
}
