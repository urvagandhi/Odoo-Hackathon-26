/**
 * StatCard — metric card for dashboards.
 * Accepts an icon, label, value, and optional trend.
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

type Trend = "up" | "down" | "neutral";

interface StatCardProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: Trend;
  trendLabel?: string;
  iconBg?: string; // e.g. "bg-indigo-100"
  iconColor?: string; // e.g. "text-indigo-600"
  /** Replace value with a skeleton during loading */
  loading?: boolean;
  className?: string;
}

const TREND_CONFIG: Record<Trend, { icon: React.FC<{ className?: string }>; class: string }> = {
  up: { icon: TrendingUp, class: "text-emerald-600" },
  down: { icon: TrendingDown, class: "text-red-500" },
  neutral: { icon: Minus, class: "text-slate-400" },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  iconBg = "bg-indigo-50",
  iconColor = "text-indigo-600",
  loading = false,
  className = "",
}: StatCardProps) {
  const { isDark } = useTheme();
  const trendCfg = trend ? TREND_CONFIG[trend] : null;
  const TrendIcon = trendCfg?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className={`rounded-[14px] border p-5 transition-all duration-200 ${isDark ? 'bg-[#111A15] border-[#1E2B22] shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:bg-[#182420] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Trend badge */}
        {trendCfg && TrendIcon && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendCfg.class}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            <div className={`relative h-7 w-24 rounded-md overflow-hidden ${isDark ? 'bg-[#1E2B22]' : 'bg-slate-100'}`}>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className={`relative h-4 w-32 rounded overflow-hidden ${isDark ? 'bg-[#1E2B22]' : 'bg-slate-100'}`}>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        ) : (
          <>
            <p className={`text-2xl font-bold tabular-nums ${isDark ? 'text-[#E4E6DE]' : 'text-slate-900'}`}>{value}</p>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-[#6B7C6B]' : 'text-slate-500'}`}>{label}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
