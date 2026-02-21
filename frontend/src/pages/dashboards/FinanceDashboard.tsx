/**
 * FinanceDashboard — Drivergo-inspired finance overview dashboard.
 * Layout:
 *  Row 1 — 4 stat cards (Total Expenses, Profit, Revenue, Labour Hours)
 *  Row 2 — Revenue area chart (2/3) + Expenses donut (1/3)
 *  Row 3 — Fleets Performance table (2/3) + CO2 Emission bar chart (1/3)
 * Accent: violet-600 (#7c3aed)
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Clock,
  Filter,
  ArrowUpDown,
} from "lucide-react";

/* ── Animation ──────────────────────────────────────────── */
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

/* ── Stat cards ─────────────────────────────────────────── */
const STAT_CARDS = [
  {
    label: "Total Expenses",
    value: "$124K",
    change: "+2.1%",
    up: false,
    icon: DollarSign,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    label: "Profit",
    value: "$134K",
    change: "+5.3%",
    up: true,
    icon: TrendingUp,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    label: "Revenue",
    value: "$100K",
    change: "+1.8%",
    up: true,
    icon: Briefcase,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Labour Hours",
    value: "300K",
    change: "-0.9%",
    up: false,
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
];

/* ── Revenue chart data ─────────────────────────────────── */
const REVENUE_POINTS = [40, 65, 45, 70, 55, 80, 60, 90, 75, 85, 70, 95];
const LAST_YEAR_POINTS = [30, 50, 35, 55, 45, 65, 50, 72, 60, 70, 55, 78];

/* ── Expense donut segments ─────────────────────────────── */
const EXPENSE_SEGMENTS = [
  { label: "Maintenance", value: 32, color: "#7c3aed" },
  { label: "Labour Cost", value: 25, color: "#06b6d4" },
  { label: "Fuel", value: 15, color: "#10b981" },
  { label: "Other", value: 3, color: "#f59e0b" },
];
const EXPENSE_DISPLAY = [
  { label: "Maintenance", amount: "$32K", color: "bg-violet-600" },
  { label: "Labour Cost", amount: "$25K", color: "bg-cyan-500" },
  { label: "Fuel", amount: "$15K", color: "bg-emerald-500" },
  { label: "Other", amount: "$3K", color: "bg-amber-400" },
];

/* ── Fleet performance rows ─────────────────────────────── */
const FLEET_ROWS = [
  { id: "#WO 123456", rate: 85, revenue: "$56,780", up: true },
  { id: "#WO 736252", rate: 75, revenue: "$48,780", up: true },
  { id: "#WO 876394", rate: 65, revenue: "$26,500", up: false },
  { id: "#WO 834564", rate: 45, revenue: "$30,700", up: false },
  { id: "#WO 092639", rate: 22, revenue: "$40,000", up: false },
];

/* ── CO2 emission months ────────────────────────────────── */
const CO2_MONTHS = [
  { month: "Mar", value: 8500 },
  { month: "Apr", value: 6200 },
  { month: "May", value: 9800 },
  { month: "Jun", value: 5400 },
  { month: "Jul", value: 8100 },
  { month: "Aug", value: 7300 },
  { month: "Sep", value: 9200 },
  { month: "Oct", value: 4800 },
  { month: "Nov", value: 7600 },
];
const CO2_MAX = 10000;

/* ── Helpers ─────────────────────────────────────────────── */
function buildAreaPath(points: number[], w: number, h: number, fill = false) {
  const step = w / (points.length - 1);
  const max = Math.max(...points);
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
  const [revenueTab, setRevenueTab] = useState<"DAY" | "MONTH" | "YEAR">("MONTH");
  const [co2Tab, setCo2Tab] = useState<"DAY" | "MONTH" | "YEAR">("MONTH");

  const donutSlices = buildDonut(EXPENSE_SEGMENTS, 80, 80, 65);

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* ══ ROW 1 — Stat Cards ══════════════════════════════════════ */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-5">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={fadeIn}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">{card.label}</p>
                <p className="text-xl font-bold text-slate-800 leading-tight">{card.value}</p>
                <p className={`text-xs font-medium mt-0.5 flex items-center gap-0.5 ${card.up ? "text-emerald-500" : "text-red-400"}`}>
                  {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.change}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ══ ROW 2 — Revenue chart + Expenses donut ══════════════════ */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-5">
        {/* Revenue area chart */}
        <motion.div variants={fadeIn} className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Revenue</h3>
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
              {(["DAY", "MONTH", "YEAR"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRevenueTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    revenueTab === t
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-metrics */}
          <div className="flex flex-wrap items-center gap-6 mb-5">
            <div>
              <p className="text-xs text-slate-400">Avg Revenue</p>
              <p className="text-lg font-bold text-slate-800">$124K</p>
              <p className="text-xs text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />0.5%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Income</p>
              <p className="text-lg font-bold text-slate-800">$500K</p>
              <p className="text-xs text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />0.5%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Outcome</p>
              <p className="text-lg font-bold text-slate-800">$378K</p>
              <p className="text-xs text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />0.5%
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-violet-500 inline-block rounded-full" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-6 h-0 inline-block border-t border-dashed border-emerald-400"
                  style={{ borderTopWidth: "2px" }}
                />
                Last Year Income
              </span>
            </div>
          </div>

          {/* SVG area chart */}
          <div className="h-36">
            <svg viewBox="0 0 480 112" className="w-full h-full" preserveAspectRatio="none">
              {[0, 37, 74, 111].map((y) => (
                <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              {/* Last year area */}
              <path d={buildAreaPath(LAST_YEAR_POINTS, 480, 112, true)} fill="#10b98112" />
              <path
                d={buildAreaPath(LAST_YEAR_POINTS, 480, 112, false)}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              {/* Income area */}
              <path d={buildAreaPath(REVENUE_POINTS, 480, 112, true)} fill="#7c3aed14" />
              <path
                d={buildAreaPath(REVENUE_POINTS, 480, 112, false)}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
              />
            </svg>
          </div>
        </motion.div>

        {/* Expenses donut */}
        <motion.div variants={fadeIn} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Expenses</h3>
            <DollarSign className="w-4 h-4 text-slate-300" />
          </div>

          {/* Donut SVG */}
          <div className="flex justify-center mb-5">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {donutSlices.map((slice) => (
                <path key={slice.label} d={slice.d} fill={slice.color} />
              ))}
              <circle cx="80" cy="80" r="42" fill="white" />
              <text x="80" y="75" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e293b">$124K</text>
              <text x="80" y="90" textAnchor="middle" fontSize="8" fill="#94a3b8">Total Expenses</text>
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-2.5">
            {EXPENSE_DISPLAY.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${seg.color}`} />
                  <span className="text-xs text-slate-500">{seg.label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{seg.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ══ ROW 3 — Fleet Performance table + CO2 Emission ══════════ */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-5">
        {/* Fleets Performance table */}
        <motion.div variants={fadeIn} className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-700">Fleets Performance</h3>
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

          {/* Table header */}
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 mb-3 px-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fleet #</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Performance Rate</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Revenue</p>
          </div>

          {/* Table rows */}
          <div className="space-y-3.5">
            {FLEET_ROWS.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center px-1">
                <p className="text-xs font-mono font-medium text-slate-600">{row.id}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(row.rate)}`}
                      style={{ width: `${row.rate}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{row.rate}%</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${row.up ? "text-emerald-500" : "text-red-400"}`}>
                  {row.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {row.revenue}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CO2 Emission */}
        <motion.div variants={fadeIn} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Co2 Emission</h3>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 w-fit mb-4">
            {(["DAY", "MONTH", "YEAR"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCo2Tab(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  co2Tab === t
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Average stat */}
          <div className="mb-4">
            <p className="text-xl font-bold text-slate-800">7.000T</p>
            <p className="text-xs text-emerald-500 flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" />0.5% average
            </p>
          </div>

          {/* Horizontal bar chart */}
          <div className="space-y-2.5">
            {CO2_MONTHS.map((row) => (
              <div key={row.month} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 w-7 shrink-0">{row.month}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(row.value / CO2_MAX) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-10 text-right">
                  {(row.value / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
