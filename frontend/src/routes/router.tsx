/**
 * React Router configuration.
 */
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import ItemsList from "../pages/ItemsList";
import CreateItem from "../pages/CreateItem";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'items', element: <ItemsList /> },
      { path: 'items/new', element: <CreateItem /> },
    ],
  },
]);
