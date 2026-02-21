/**
 * DashboardShell — Drivergo-inspired app shell.
 * White sidebar + white top bar, light gray content area.
 * Supports dark mode.
 */
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import TopBar from "../components/navigation/TopBar";
import { useTheme } from "../context/ThemeContext";

export default function DashboardShell() {
  const { isDark } = useTheme();

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-[#F8F9FD]'}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
