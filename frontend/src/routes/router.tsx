/**
 * React Router configuration.
 * Single login page for all roles. Role is determined from the database.
 */
import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import ItemsList from "../pages/ItemsList";
import CreateItem from "../pages/CreateItem";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";
import UIDemo from "../pages/UIDemo";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import DashboardShell from "../layouts/DashboardShell";
import { RoleDashboard, AdminDashboard, DispatcherDashboard, SafetyOfficerDashboard, FinanceDashboard } from "../pages/dashboards";

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
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
      { path: "items", element: <ItemsList /> },
      { path: "items/new", element: <CreateItem /> },
      { path: "demo", element: <UIDemo /> },
      { path: "fleet/*", element: <RoleDashboard /> },
      { path: "dispatch/*", element: <RoleDashboard /> },
      { path: "hr/*", element: <RoleDashboard /> },
      { path: "finance/*", element: <RoleDashboard /> },
      { path: "safety/*", element: <RoleDashboard /> },
      { path: "maintenance/*", element: <RoleDashboard /> },
      { path: "analytics", element: <RoleDashboard /> },
      { path: "notifications", element: <RoleDashboard /> },
    ],
  },

  // ── Legacy layout (kept for compatibility) ───────────────
  {
    path: "/legacy",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "items", element: <ItemsList /> },
      { path: "items/new", element: <CreateItem /> },
      { path: "demo", element: <UIDemo /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────
  {
    path: "*",
    element: <NotFound />,
  },
]);
