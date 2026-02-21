/**
 * SafetyScoreBar — visual horizontal bar 0–100 with color coding.
 * Green ≥ 80, amber 50–79, red < 50
 */
import { useTheme } from "../../context/ThemeContext";

interface SafetyScoreBarProps {
  score: number;
  className?: string;
}

export function SafetyScoreBar({ score, className = "" }: SafetyScoreBarProps) {
  const { isDark } = useTheme();
  const clamped = Math.min(100, Math.max(0, score));

  let barColor: string;
  let textColor: string;
  if (clamped >= 80) {
    barColor = "bg-emerald-500";
    textColor = isDark ? "text-emerald-400" : "text-emerald-700";
  } else if (clamped >= 50) {
    barColor = "bg-amber-500";
    textColor = isDark ? "text-amber-400" : "text-amber-700";
  } else {
    barColor = "bg-red-500";
    textColor = isDark ? "text-red-400" : "text-red-700";
  }

  return (
    <div className={`flex items-center gap-2 min-w-[100px] ${className}`}>
      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-neutral-700" : "bg-slate-200"}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${textColor}`}>
        {clamped}
      </span>
    </div>
  );
}
