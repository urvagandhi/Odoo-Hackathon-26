/**
 * RoleDashboard — routes to the correct dashboard based on the current user's role.
 * SUPER_ADMIN / MANAGER now use the real-data CommandCenter.
 */
import { useAuth } from "../../hooks/useAuth";
import CommandCenter from "../CommandCenter";
import DispatcherDashboard from "./DispatcherDashboard";
import SafetyOfficerDashboard from "./SafetyOfficerDashboard";
import FinanceDashboard from "./FinanceDashboard";

export default function RoleDashboard() {
  const { user } = useAuth();

  switch (user?.role) {
    case "MANAGER":
      return <CommandCenter />;
    case "DISPATCHER":
      return <DispatcherDashboard />;
    case "SAFETY_OFFICER":
      return <SafetyOfficerDashboard />;
    case "FINANCE_ANALYST":
      return <FinanceDashboard />;
    default:
      return <CommandCenter />;
  }
}
