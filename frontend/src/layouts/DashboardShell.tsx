/**
 * DashboardShell — Drivergo-inspired app shell.
 * White sidebar + white top bar, light gray content area.
 */
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import TopBar from "../components/navigation/TopBar";

export default function DashboardShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FD]">
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
