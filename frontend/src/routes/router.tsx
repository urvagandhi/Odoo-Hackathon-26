/**
 * React Router configuration.
 */
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import ItemsList from "../pages/ItemsList";
import CreateItem from "../pages/CreateItem";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import UIDemo from "../pages/UIDemo";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
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
  {
    path: "*",
    element: <NotFound />,
  },
]);
