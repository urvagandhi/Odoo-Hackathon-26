/**
 * FinanceDashboard — Finance overview from real backend analytics.
 * Row 1 — 4 stat cards (YTD Expenses, Profit, Revenue, Fuel Cost)
 * Row 2 — Revenue vs Costs area chart (2/3) + Expenses donut (1/3)
 * Row 3 — Fleet Fuel Efficiency table (2/3) + Monthly Fuel Cost chart (1/3)
 * Accent: violet-600 (#7c3aed)
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Droplets,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";
import { analyticsApi } from "../../api/client";
import type { MonthlyReport, FuelEfficiency } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";

const card = "rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl shrink-0";
const lightCard = "bg-gradient-to-br from-white via-white to-slate-50/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]";
const darkCard = "bg-slate-900/60 border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]";

/* ── Animation ──────────────────────────────────────────── */
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

/* ── Helpers ──────────────────────────────────────────────── */
function fmt(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

function buildAreaPath(points: number[], w: number, h: number, fill = false) {
  if (points.length < 2) return "";
  const step = w / (points.length - 1);
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => [i * step, h - (p / max) * (h - 8)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  if (!fill) return line;
  return `${line} L${w},${h} L0,${h} Z`;
}

function getBarColor(rate: number) {
  if (rate >= 75) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function buildDonut(
  segments: { label: string; value: number; color: string }[],
  cx: number,
  cy: number,
  r: number
) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return segments.map((seg) => ({ ...seg, d: "" }));
  let angle = -90;
  return segments.map((seg) => {
    const sweep = (seg.value / total) * 360;
    const r1 = (angle * Math.PI) / 180;
    const r2 = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(r1);
    const y1 = cy + r * Math.sin(r1);
    const x2 = cx + r * Math.cos(r2);
    const y2 = cy + r * Math.sin(r2);
    const large = sweep > 180 ? 1 : 0;
    const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    angle += sweep;
    return { ...seg, d };
  });
}

/* ── Component ───────────────────────────────────────────── */
export default function FinanceDashboard() {
  const { isDark } = useTheme();
  const cardClass = `${card} ${isDark ? darkCard : lightCard}`;

  const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
  const [fuelData, setFuelData] = useState<FuelEfficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueTab, setRevenueTab] = useState<"DAY" | "MONTH" | "YEAR">("MONTH");
  const [fuelTab, setFuelTab] = useState<"DAY" | "MONTH" | "YEAR">("MONTH");

  useEffect(() => {
    Promise.all([
      analyticsApi.getMonthlyReport(),
      analyticsApi.getFuelEfficiency(),
    ])
      .then(([monthlyData, fuelEfficiency]) => {
        setMonthly(monthlyData);
        setFuelData(fuelEfficiency);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentMonthIdx = new Date().getMonth();
  const currentMonth = monthly[currentMonthIdx];
  const ytdRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const ytdCost = monthly.reduce((s, m) => s + m.totalCost, 0);
  const ytdProfit = monthly.reduce((s, m) => s + m.profit, 0);
  const ytdFuel = monthly.reduce((s, m) => s + m.fuelCost, 0);

  const revenuePoints = monthly.map((m) => m.revenue);
  const costPoints = monthly.map((m) => m.totalCost);

  const expenseSegments = [
    { label: "Maintenance", value: currentMonth?.maintenanceCost ?? 0, color: "#7c3aed" },
    { label: "Fuel", value: currentMonth?.fuelCost ?? 0, color: "#10b981" },
    { label: "Other", value: currentMonth?.otherExpenses ?? 0, color: "#f59e0b" },
  ];
  const expenseTotal = expenseSegments.reduce((s, e) => s + e.value, 0);
  const donutSlices = buildDonut(expenseSegments, 80, 80, 65);

  // Fleet performance: normalize kmPerLiter to 0-100%
  const maxKpl = Math.max(...fuelData.map((f) => f.kmPerLiter ?? 0), 1);
  const fleetRows = fuelData.slice(0, 5).map((f) => ({
    id: f.licensePlate,
    rate: Math.round(((f.kmPerLiter ?? 0) / maxKpl) * 100),
    value: `${(f.totalDistanceKm ?? 0).toFixed(0)} km`,
    up: (f.kmPerLiter ?? 0) >= maxKpl * 0.6,
  }));

  // Monthly fuel cost for bar chart (last 9 months)
  const fuelMonths = monthly.slice(-9).map((m) => ({ label: m.label.slice(0, 3), value: m.fuelCost }));
  const fuelMax = Math.max(...fuelMonths.map((m) => m.value), 1);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={stagger}>
      {/* ══ ROW 1 — Stat Cards ══════════════════════════════════════ */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-5">
        {[
          { label: "Total Expenses (YTD)", value: fmt(ytdCost), icon: DollarSign, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", up: false },
          { label: "Profit (YTD)", value: fmt(ytdProfit), icon: TrendingUp, iconBg: "bg-violet-100", iconColor: "text-violet-600", up: ytdProfit > 0 },
          { label: "Revenue (YTD)", value: fmt(ytdRevenue), icon: Briefcase, iconBg: "bg-blue-100", iconColor: "text-blue-600", up: true },
          { label: "Fuel Cost (YTD)", value: fmt(ytdFuel), icon: Droplets, iconBg: "bg-amber-100", iconColor: "text-amber-600", up: false },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={fadeIn}
              className={`group ${cardClass} p-5 flex items-center gap-4`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isDark ? card.iconBg.replace('100', '500/10') : 'bg-gradient-to-br from-white to-' + card.iconBg.replace('bg-', '') + '/50 border border-' + card.iconBg.replace('bg-', '').split('-')[0] + '-100'}`}>
                <Icon className={`w-5 h-5 ${isDark ? card.iconColor.replace('600', '400') : card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>
                <p className={`text-xl font-bold leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{card.value}</p>
                <p className={`text-xs font-medium mt-0.5 flex items-center gap-0.5 ${card.up ? "text-emerald-500" : (isDark ? "text-slate-500" : "text-slate-400")}`}>
                  {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  Year to date
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ══ ROW 2 — Revenue chart + Expenses donut ══════════════════ */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-5">
        {/* Revenue vs Costs area chart */}
        <motion.div variants={fadeIn} className={`col-span-2 ${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>Revenue vs Costs</h3>
            <div className={`flex items-center gap-1 rounded-lg p-0.5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              {(["DAY", "MONTH", "YEAR"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRevenueTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    revenueTab === t 
                      ? "bg-violet-600 text-white shadow-sm" 
                      : (isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 mb-5">
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>YTD Revenue</p>
              <p className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{fmt(ytdRevenue)}</p>
              <p className="text-xs text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />This year
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>YTD Profit</p>
              <p className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{fmt(ytdProfit)}</p>
              <p className={`text-xs flex items-center gap-0.5 ${ytdProfit >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                {ytdProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {ytdProfit >= 0 ? "Positive" : "Loss"}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>YTD Costs</p>
              <p className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{fmt(ytdCost)}</p>
              <p className="text-xs text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />Expenses
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-violet-500 inline-block rounded-full" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0 inline-block border-t border-dashed border-emerald-400" style={{ borderTopWidth: "2px" }} />
                Costs
              </span>
            </div>
          </div>

          <div className="h-36 relative">
            {!isDark && <div className="absolute inset-0 bg-violet-50/30 rounded-xl pointer-events-none" />}
            {revenuePoints.length > 1 ? (
              <svg viewBox="0 0 480 112" className="w-full h-full relative z-10" preserveAspectRatio="none">
                {[0, 37, 74, 111].map((y) => (
                  <line key={y} x1="0" y1={y} x2="480" y2={y} stroke={isDark ? "#334155" : "#f1f5f9"} strokeWidth="1" />
                ))}
                <path d={buildAreaPath(costPoints, 480, 112, true)} fill="#10b98112" />
                <path d={buildAreaPath(costPoints, 480, 112, false)} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 3" />
                <path d={buildAreaPath(revenuePoints, 480, 112, true)} fill="#7c3aed14" />
                <path d={buildAreaPath(revenuePoints, 480, 112, false)} fill="none" stroke="#7c3aed" strokeWidth="2" />
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">No data yet</div>
            )}
          </div>
        </motion.div>

        {/* Expenses donut (current month) */}
        <motion.div variants={fadeIn} className={`${cardClass} p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>Expenses (this month)</h3>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <DollarSign className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            </div>
          </div>

          <div className="flex justify-center mb-5 flex-1 items-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {expenseTotal > 0 ? (
                donutSlices.map((slice) => <path key={slice.label} d={slice.d} fill={slice.color} />)
              ) : (
                <circle cx="80" cy="80" r="65" fill={isDark ? "#334155" : "#f1f5f9"} />
              )}
              <circle cx="80" cy="80" r="42" fill={isDark ? "#0f172a" : "white"} />
              <text x="80" y="75" textAnchor="middle" fontSize="12" fontWeight="700" fill={isDark ? "#f8fafc" : "#1e293b"}>
                {fmt(expenseTotal)}
              </text>
              <text x="80" y="90" textAnchor="middle" fontSize="8" fill={isDark ? "#94a3b8" : "#94a3b8"}>This Month</text>
            </svg>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Maintenance", amount: fmt(currentMonth?.maintenanceCost ?? 0), color: "bg-violet-600" },
              { label: "Fuel", amount: fmt(currentMonth?.fuelCost ?? 0), color: "bg-emerald-500" },
              { label: "Other", amount: fmt(currentMonth?.otherExpenses ?? 0), color: "bg-amber-400" },
            ].map((seg) => (
              <div key={seg.label} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${seg.color}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{seg.label}</span>
                </div>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{seg.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ══ ROW 3 — Fleet Fuel Efficiency + Monthly Fuel Cost ══════════ */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-5">
        {/* Fleet Fuel Efficiency table */}
        <motion.div variants={fadeIn} className={`col-span-2 ${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>Fleet Fuel Efficiency</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 mb-3 px-1">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Vehicle</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Efficiency Rate</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wider text-right ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Distance</p>
          </div>

          {fleetRows.length === 0 ? (
            <div className={`py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No fuel efficiency data yet.</div>
          ) : (
            <div className="space-y-3.5">
              {fleetRows.map((row) => (
                <div key={row.id} className={`grid grid-cols-[1fr_2fr_auto] gap-4 items-center px-3 py-2 -mx-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                  <p className={`text-xs font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{row.id}</p>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className={`h-full rounded-full ${getBarColor(row.rate)}`} style={{ width: `${row.rate}%` }} />
                    </div>
                    <span className={`text-xs w-8 text-right ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{row.rate}%</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${row.up ? "text-emerald-500" : "text-red-400"}`}>
                    {row.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Fuel Cost chart */}
        <motion.div variants={fadeIn} className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>Monthly Fuel Cost</h3>
          </div>

          <div className={`flex items-center gap-1 rounded-lg p-0.5 w-fit mb-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            {(["DAY", "MONTH", "YEAR"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFuelTab(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  fuelTab === t 
                    ? "bg-violet-600 text-white shadow-sm" 
                    : (isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <p className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{fmt(currentMonth?.fuelCost ?? 0)}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>This month</p>
          </div>

          <div className="space-y-2.5">
            {fuelMonths.length === 0 ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>No data yet</p>
            ) : (
              fuelMonths.map((row) => (
                <div key={row.label} className={`flex items-center gap-2 p-1 rounded-lg ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                  <span className={`text-[10px] w-7 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{row.label}</span>
                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(row.value / fuelMax) * 100}%` }}
                    />
                  </div>
                  <span className={`text-[10px] w-14 text-right ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{fmt(row.value)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
