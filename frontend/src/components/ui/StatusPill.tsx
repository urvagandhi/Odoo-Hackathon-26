/**
 * StatusPill — reusable colored status badge for vehicles, drivers, and trips.
 * Supports light and dark theme variants.
 */
import { useTheme } from "../../context/ThemeContext";

type StatusType = "vehicle" | "driver" | "trip";

interface StatusPillProps {
  status: string;
  type: StatusType;
  className?: string;
}

const COLOR_MAP: Record<StatusType, Record<string, { light: string; dark: string; label: string }>> = {
  vehicle: {
    AVAILABLE: {
      light: "bg-emerald-100 text-emerald-700",
      dark: "bg-emerald-900/30 text-emerald-400",
      label: "Available",
    },
    ON_TRIP: {
      light: "bg-blue-100 text-blue-700",
      dark: "bg-blue-900/30 text-blue-400",
      label: "On Trip",
    },
    IN_SHOP: {
      light: "bg-amber-100 text-amber-700",
      dark: "bg-amber-900/30 text-amber-400",
      label: "In Shop",
    },
    RETIRED: {
      light: "bg-slate-100 text-slate-500",
      dark: "bg-neutral-700/40 text-neutral-400",
      label: "Retired",
    },
  },
  driver: {
    ON_DUTY: {
      light: "bg-emerald-100 text-emerald-700",
      dark: "bg-emerald-900/30 text-emerald-400",
      label: "On Duty",
    },
    ON_TRIP: {
      light: "bg-blue-100 text-blue-700",
      dark: "bg-blue-900/30 text-blue-400",
      label: "On Trip",
    },
    OFF_DUTY: {
      light: "bg-slate-100 text-slate-500",
      dark: "bg-neutral-700/40 text-neutral-400",
      label: "Off Duty",
    },
    SUSPENDED: {
      light: "bg-red-100 text-red-700",
      dark: "bg-red-900/30 text-red-400",
      label: "Suspended",
    },
  },
  trip: {
    DRAFT: {
      light: "bg-slate-100 text-slate-600",
      dark: "bg-neutral-700/40 text-neutral-400",
      label: "Draft",
    },
    DISPATCHED: {
      light: "bg-blue-100 text-blue-700",
      dark: "bg-blue-900/30 text-blue-400",
      label: "Dispatched",
    },
    COMPLETED: {
      light: "bg-emerald-100 text-emerald-700",
      dark: "bg-emerald-900/30 text-emerald-400",
      label: "Completed",
    },
    CANCELLED: {
      light: "bg-red-100 text-red-700",
      dark: "bg-red-900/30 text-red-400",
      label: "Cancelled",
    },
  },
};

export function StatusPill({ status, type, className = "" }: StatusPillProps) {
  const { isDark } = useTheme();
  const config = COLOR_MAP[type]?.[status];

  if (!config) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ${className}`}>
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isDark ? config.dark : config.light
      } ${className}`}
    >
      {config.label}
    </span>
  );
}
