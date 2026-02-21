/**
 * RoleDashboard — routes to the correct dashboard based on the current user's role.
 */
import { useAuth } from "../../hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import DispatcherDashboard from "./DispatcherDashboard";
import SafetyOfficerDashboard from "./SafetyOfficerDashboard";
import FinanceDashboard from "./FinanceDashboard";

export default function RoleDashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case "SUPER_ADMIN":
    case "MANAGER":
      return <AdminDashboard />;
    case "DISPATCHER":
      return <DispatcherDashboard />;
    case "SAFETY_OFFICER":
      return <SafetyOfficerDashboard />;
    case "FINANCE_ANALYST":
      return <FinanceDashboard />;
    default:
      return <AdminDashboard />;
  }
}
