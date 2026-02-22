/**
 * FleetFlow React Router configuration.
 * Role-aware routes: each role gets redirected to their primary page post-login.
 * Protected routes require authentication.
 */
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import FleetDashboard from "../pages/FleetDashboard";
import Fleet from "../pages/Fleet";
import Dispatch from "../pages/Dispatch";
import Maintenance from "../pages/Maintenance";
import FuelExpenses from "../pages/FuelExpenses";
import Drivers from "../pages/Drivers";
import Analytics from "../pages/Analytics";
import Landing from "../pages/Landing";
import Incidents from "../pages/Incidents";
import VehicleRegistry from "../pages/VehicleRegistry";
import TripDispatcher from "../pages/TripDispatcher";
import DriverDashboard from "../pages/DriverDashboard";

export const router = createBrowserRouter([
  // ── Public root route ───────────────────────────────────
  { path: "/", element: <Landing /> },

  // ── Public auth routes ──────────────────────────────────
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // ── Protected app routes ────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Core FleetFlow pages — role-gated
      { path: "driver", element: <ProtectedRoute roles={["DRIVER"]}><DriverDashboard /></ProtectedRoute> },
      { path: "dashboard", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCE_ANALYST"]}><FleetDashboard /></ProtectedRoute> },
      { path: "fleet", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER", "SAFETY_OFFICER"]}><Fleet /></ProtectedRoute> },
      { path: "fleet/vehicles", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER", "SAFETY_OFFICER"]}><VehicleRegistry /></ProtectedRoute> },
      { path: "dispatch", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER"]}><Dispatch /></ProtectedRoute> },
      { path: "dispatch/trips", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER"]}><TripDispatcher /></ProtectedRoute> },
      { path: "dispatch/new", element: <ProtectedRoute roles={["MANAGER", "DISPATCHER"]}><TripDispatcher /></ProtectedRoute> },
      { path: "maintenance", element: <ProtectedRoute roles={["MANAGER", "SAFETY_OFFICER"]}><Maintenance /></ProtectedRoute> },
      { path: "fuel-expenses", element: <ProtectedRoute roles={["MANAGER", "FINANCE_ANALYST"]}><FuelExpenses /></ProtectedRoute> },
      { path: "hr/drivers", element: <ProtectedRoute roles={["MANAGER", "SAFETY_OFFICER", "DISPATCHER"]}><Drivers /></ProtectedRoute> },
      { path: "drivers", element: <ProtectedRoute roles={["MANAGER", "SAFETY_OFFICER"]}><Drivers /></ProtectedRoute> },
      { path: "safety/incidents", element: <ProtectedRoute roles={["MANAGER", "SAFETY_OFFICER"]}><Incidents /></ProtectedRoute> },
      { path: "analytics", element: <ProtectedRoute roles={["MANAGER", "FINANCE_ANALYST"]}><Analytics /></ProtectedRoute> },

      // User account pages
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // ── Catch-all ───────────────────────────────────────────
  { path: "*", element: <NotFound /> },
]);
