/**
 * StatusPill — reusable colored status badge for vehicles, drivers, and trips.
 * Supports light and dark theme variants.
 */
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

type StatusType = "vehicle" | "driver" | "trip";

interface StatusPillProps {
  status: string;
  type: StatusType;
  className?: string;
}

const COLOR_MAP: Record<StatusType, Record<string, { light: string; dark: string }>> = {
  vehicle: {
    AVAILABLE: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-400" },
    ON_TRIP: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-400" },
    IN_SHOP: { light: "bg-amber-100 text-amber-700", dark: "bg-amber-900/30 text-amber-400" },
    RETIRED: { light: "bg-slate-100 text-slate-500", dark: "bg-neutral-700/40 text-neutral-400" },
  },
  driver: {
    ON_DUTY: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-400" },
    ON_TRIP: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-400" },
    OFF_DUTY: { light: "bg-slate-100 text-slate-500", dark: "bg-neutral-700/40 text-neutral-400" },
    SUSPENDED: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-400" },
  },
  trip: {
    DRAFT: { light: "bg-slate-100 text-slate-600", dark: "bg-neutral-700/40 text-neutral-400" },
    DISPATCHED: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-400" },
    COMPLETED: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-400" },
    CANCELLED: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-400" },
  },
};

const LABEL_KEYS: Record<StatusType, Record<string, string>> = {
  vehicle: {
    AVAILABLE: "fleet.status.AVAILABLE",
    ON_TRIP: "fleet.status.ON_TRIP",
    IN_SHOP: "fleet.status.IN_SHOP",
    RETIRED: "fleet.status.RETIRED",
  },
  driver: {
    ON_DUTY: "drivers.status.ON_DUTY",
    ON_TRIP: "drivers.status.ON_TRIP",
    OFF_DUTY: "drivers.status.OFF_DUTY",
    SUSPENDED: "drivers.status.SUSPENDED",
  },
  trip: {
    DRAFT: "dispatch.status.DRAFT",
    DISPATCHED: "dispatch.status.DISPATCHED",
    COMPLETED: "dispatch.status.COMPLETED",
    CANCELLED: "dispatch.status.CANCELLED",
  },
};

export function StatusPill({ status, type, className = "" }: StatusPillProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const config = COLOR_MAP[type]?.[status];
  const labelKey = LABEL_KEYS[type]?.[status];

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
      {labelKey ? t(labelKey) : status}
    </span>
  );
}
