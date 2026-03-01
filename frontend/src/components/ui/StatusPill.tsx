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
    AVAILABLE: { light: "bg-emerald-100 text-emerald-700", dark: "bg-[#14332A] text-[#86EFAC]" },
    ON_TRIP: { light: "bg-amber-100 text-amber-700", dark: "bg-[#162822] text-[#6EEAA0]" },
    IN_SHOP: { light: "bg-amber-100 text-amber-700", dark: "bg-[#2D2410] text-[#FDE68A]" },
    RETIRED: { light: "bg-slate-100 text-slate-500", dark: "bg-[#1A2620] text-[#8B9B8B]" },
  },
  driver: {
    ON_DUTY: { light: "bg-emerald-100 text-emerald-700", dark: "bg-[#14332A] text-[#86EFAC]" },
    ON_TRIP: { light: "bg-amber-100 text-amber-700", dark: "bg-[#162822] text-[#6EEAA0]" },
    OFF_DUTY: { light: "bg-slate-100 text-slate-500", dark: "bg-[#1A2620] text-[#8B9B8B]" },
    SUSPENDED: { light: "bg-red-100 text-red-700", dark: "bg-[#2D1518] text-[#FCA5A5]" },
  },
  trip: {
    DRAFT: { light: "bg-slate-100 text-slate-600", dark: "bg-[#1A2620] text-[#8B9B8B]" },
    DISPATCHED: { light: "bg-amber-100 text-amber-700", dark: "bg-[#162822] text-[#6EEAA0]" },
    COMPLETED: { light: "bg-emerald-100 text-emerald-700", dark: "bg-[#14332A] text-[#86EFAC]" },
    CANCELLED: { light: "bg-red-100 text-red-700", dark: "bg-[#2D1518] text-[#FCA5A5]" },
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
