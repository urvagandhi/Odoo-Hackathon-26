/**
 * React Router configuration.
 * Single login page for all roles. Role is determined from the database.
 */
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import DashboardShell from "../layouts/DashboardShell";
import { RoleDashboard, AdminDashboard, DispatcherDashboard, SafetyOfficerDashboard, FinanceDashboard } from "../pages/dashboards";
import VehicleRegistry from "../pages/VehicleRegistry";
import DriverManagement from "../pages/DriverManagement";
import TripDispatcher from "../pages/TripDispatcher";
import Maintenance from "../pages/Maintenance";
import Expenses from "../pages/Expenses";
import CommandCenter from "../pages/CommandCenter";
import Analytics from "../pages/Analytics";
import Incidents from "../pages/Incidents";
import DriverPerformance from "../pages/DriverPerformance";
import FinancialReports from "../pages/FinancialReports";
import ComingSoon from "../pages/ComingSoon";

export const router = createBrowserRouter([
  // ── Public auth routes ──────────────────────────────────
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },

  // ── FleetFlow Dashboard routes (sidebar shell) ──────────
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <RoleDashboard /> },
      { path: "dashboard/admin", element: <AdminDashboard /> },
      { path: "dashboard/dispatcher", element: <DispatcherDashboard /> },
      { path: "dashboard/safety", element: <SafetyOfficerDashboard /> },
      { path: "dashboard/finance", element: <FinanceDashboard /> },

      // ── Domain pages ─────────────────────────────────────
      { path: "fleet/vehicles", element: <VehicleRegistry /> },
      { path: "fleet/maintenance", element: <Maintenance /> },
      { path: "dispatch/trips", element: <TripDispatcher /> },
      { path: "dispatch/new", element: <TripDispatcher /> },
      { path: "hr/drivers", element: <DriverManagement /> },
      { path: "hr/performance", element: <DriverPerformance /> },
      { path: "finance/fuel", element: <Expenses /> },
      { path: "finance/expenses", element: <Expenses /> },
      { path: "finance/ledger", element: <Expenses /> },
      { path: "finance/reports", element: <FinancialReports /> },
      { path: "finance/pnl", element: <FinancialReports /> },
      { path: "finance/cost-analysis", element: <FinancialReports /> },
      { path: "analytics", element: <Analytics /> },
      { path: "safety/incidents", element: <Incidents /> },
      { path: "safety/licenses", element: <ComingSoon /> },
      { path: "safety/reports", element: <Incidents /> },
      { path: "notifications", element: <ComingSoon /> },
      { path: "messages", element: <ComingSoon /> },
      { path: "activity", element: <ComingSoon /> },
      { path: "support", element: <ComingSoon /> },

      // ── Utility pages ────────────────────────────────────
      { path: "settings", element: <Settings /> },
      { path: "settings/general", element: <Settings /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────
  {
    path: "*",
    element: <NotFound />,
  },
]);
