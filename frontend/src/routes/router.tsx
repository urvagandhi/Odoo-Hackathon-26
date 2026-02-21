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
      { path: "dispatch/trips", element: <TripDispatcher /> },
      { path: "dispatch/new", element: <ComingSoon /> },
      { path: "hr/drivers", element: <DriverManagement /> },
      { path: "hr/performance", element: <ComingSoon /> },
      { path: "fleet/maintenance", element: <ComingSoon /> },
      { path: "finance/fuel", element: <ComingSoon /> },
      { path: "finance/expenses", element: <ComingSoon /> },
      { path: "finance/ledger", element: <ComingSoon /> },
      { path: "finance/reports", element: <ComingSoon /> },
      { path: "finance/pnl", element: <ComingSoon /> },
      { path: "finance/cost-analysis", element: <ComingSoon /> },
      { path: "analytics", element: <ComingSoon /> },
      { path: "safety/licenses", element: <ComingSoon /> },
      { path: "safety/reports", element: <ComingSoon /> },
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
