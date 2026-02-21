/**
 * React Router configuration.
 * Single login page for all roles. Role is determined from the database.
 */
import { createBrowserRouter } from "react-router-dom";
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

  // ── Protected app routes ────────────────────────────────
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "items", element: <ItemsList /> },
      { path: "items/new", element: <CreateItem /> },
      { path: "demo", element: <UIDemo /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // ── Catch-all ───────────────────────────────────────────
  {
    path: "*",
    element: <NotFound />,
  },
]);
