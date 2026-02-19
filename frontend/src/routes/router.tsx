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
import ToastDemo from "../pages/ToastDemo";

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
      { path: "toast-demo", element: <ToastDemo /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

