/**
 * CapacityBar — cargo weight vs vehicle capacity visual bar.
 * Green when within capacity, red when over capacity.
 */
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { CheckCircle2, XCircle } from "lucide-react";

interface CapacityBarProps {
  cargoWeight: number;
  maxCapacity: number;
  className?: string;
}

export function CapacityBar({ cargoWeight, maxCapacity, className = "" }: CapacityBarProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  if (maxCapacity <= 0) return null;

  const percentage = (cargoWeight / maxCapacity) * 100;
  const isOver = cargoWeight > maxCapacity;
  const displayPct = Math.min(percentage, 100);

  const barBg = isDark ? "bg-neutral-700" : "bg-slate-200";
  const barColor = isOver ? "bg-red-500" : "bg-emerald-500";
  const textColor = isOver
    ? isDark ? "text-red-400" : "text-red-600"
    : isDark ? "text-emerald-400" : "text-emerald-600";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className={isDark ? "text-neutral-400" : "text-slate-500"}>
          {t("ui.capacityBar.cargo")} <span className="font-semibold">{cargoWeight.toLocaleString()} kg</span>
        </span>
        <span className={isDark ? "text-neutral-400" : "text-slate-500"}>
          {t("ui.capacityBar.capacity", { value: maxCapacity.toLocaleString() })}
        </span>
      </div>

      <div className={`h-3 rounded-full overflow-hidden ${barBg}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>

      <div className={`flex items-center gap-1.5 text-xs font-medium ${textColor}`}>
        {isOver ? (
          <>
            <XCircle className="w-3.5 h-3.5" />
            <span>{t("ui.capacityBar.exceedsCapacity", { pct: percentage.toFixed(0) })}</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t("ui.capacityBar.utilized", { pct: percentage.toFixed(0) })}</span>
          </>
        )}
      </div>
    </div>
  );
}
