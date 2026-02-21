/**
 * AdminDashboard — Drivergo-inspired shipment tracking dashboard.
 * Layout:
 *  Row 1 — 3 stat cards (This month order, Shipment success, Capacity)
 *  Row 2 — Caller card, Tracking History, Vehicle card
 *  Row 3 — Map (Image 2 style) + Package Details
 * Accent: violet-600 (#7c3aed)
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  PhoneOff,
  MapPin,
  Navigation,
  Truck,
  Package,
  TrendingUp,
  Ruler,
  Box,
  MoreHorizontal,
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

/* ── Monthly sparkline data (for "This month order") ────── */
const MONTHLY_SPARKLINE = [12, 18, 14, 22, 19, 28, 24, 30, 35, 32, 38, 42];

/* ── Shipment bar data (for "Shipment success") ─────────── */
const SHIPMENT_BARS = [70, 55, 80, 65, 90, 60, 75, 85, 50, 70, 88, 72, 68, 82, 77];

/* ── Capacity line data (for "Capacity" chart) ──────────── */
const CAPACITY_POINTS = [15, 28, 20, 35, 25, 30, 22, 38, 30, 28, 35, 30];

/* ── Package breakdown ──────────────────────────────────── */
const PACKAGE_CATEGORIES = [
  { label: "Electronics", pct: 67, count: "20,350", color: "#7c3aed" },
  { label: "Detergen", pct: 24, count: "8,265", color: "#3b82f6" },
  { label: "Fashion", pct: 43, count: "12,565", color: "#06b6d4" },
];

/* ── Map vehicles (second image style) ──────────────────── */
const MAP_VEHICLES = [
  { id: "FL-4821", x: 28, y: 32, label: "En route" },
  { id: "FL-7733", x: 62, y: 55, label: "Delivering" },
  { id: "FL-1199", x: 45, y: 75, label: "En route" },
];

export default function AdminDashboard() {
  const [activeVehicle, setActiveVehicle] = useState<string | null>(null);

  /* ── Sparkline path builder ─────────────────────────── */
  const sparklinePath = (data: number[], w: number, h: number) => {
    const max = Math.max(...data);
    return data
      .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
      .join(" L ");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — Three stat cards ═══════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── This month order ──────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">This month order</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Jul 2026</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">155</span>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  30%
                </span>
              </div>
            </div>
            {/* Sparkline */}
            <svg viewBox="0 0 120 40" className="w-28 h-10" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
                d={`M ${sparklinePath(MONTHLY_SPARKLINE, 120, 36)}`}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={`M 0,36 L ${sparklinePath(MONTHLY_SPARKLINE, 120, 36)} L 120,36 Z`}
                fill="url(#sparkGrad)"
              />
              {/* Current dot */}
              {(() => {
                const last = MONTHLY_SPARKLINE.length - 1;
                const max = Math.max(...MONTHLY_SPARKLINE);
                return (
                  <circle
                    cx={120}
                    cy={36 - (MONTHLY_SPARKLINE[last] / max) * 36}
                    r="3"
                    fill="#7c3aed"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })()}
            </svg>
          </div>
          {/* Month labels */}
          <div className="flex justify-between text-[10px] text-slate-400">
            {["Apr", "May", "Jun", "Jul", "Aug", "Sept", "Okt", "Nov", "Dec"].map((m) => (
              <span key={m} className={m === "Jul" ? "font-bold text-slate-700" : ""}>{m}</span>
            ))}
          </div>
        </div>

        {/* ── Shipment success ──────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Shipment success</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-extrabold text-slate-900 tabular-nums">65%</span>
            <span className="text-xs font-semibold text-emerald-500">↑ 8%</span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-[3px] h-16 mt-3 mb-3">
            {SHIPMENT_BARS.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(v / 100) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className={`flex-1 rounded-sm ${v >= 75 ? "bg-violet-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Success
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-200" />
              Not yet
            </div>
          </div>
        </div>

        {/* ── Capacity ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Capacity</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              8 Nov 2026
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-slate-500">20kg - 44lbs</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: "68%" }} />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-md">
              <Package className="w-3 h-3 text-violet-600" />
              <span className="text-[11px] font-bold text-violet-600">30kg</span>
            </div>
          </div>
          {/* Capacity trend line */}
          <div className="relative h-20">
            <svg viewBox="0 0 200 70" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 23} x2="200" y2={i * 23} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
                d={`M ${sparklinePath(CAPACITY_POINTS, 200, 60)}`}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeDasharray="6 3"
                strokeLinecap="round"
              />
              <path
                d={`M 0,60 L ${sparklinePath(CAPACITY_POINTS, 200, 60)} L 200,60 Z`}
                fill="url(#capGrad)"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            {["1 Nov", "5 Nov", "8 Nov", "10 Nov", "12 Nov"].map((d) => (
              <span key={d} className={d === "8 Nov" ? "font-bold text-violet-600" : ""}>{d}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Caller + Tracking + Vehicle ═══════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Caller / Contact card ─────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <img
            src="https://ui-avatars.com/api/?name=Darrell+Steward&background=7c3aed&color=fff&size=72&font-size=0.38&bold=true&rounded=true"
            alt="Darrell Steward"
            className="w-16 h-16 rounded-full mb-3"
          />
          <h4 className="text-base font-bold text-slate-900">Darrell Steward</h4>
          <p className="text-xs text-slate-400 mb-4">is calling you</p>

          {/* Accept / Reject buttons */}
          <div className="flex items-center gap-3 mb-5">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <PhoneOff className="w-4 h-4" />
              Reject
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors">
              <Phone className="w-4 h-4" />
              Accept
            </button>
          </div>

          {/* Contact info */}
          <div className="w-full space-y-2 text-left text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Company</span><span className="font-medium text-slate-900">Loyoto</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="font-medium text-slate-900">Manager</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Phone</span><span className="font-medium text-slate-900">(+886)923456</span></div>
            <div className="flex justify-between"><span className="text-slate-400">City</span><span className="font-medium text-slate-900">San Diego</span></div>
          </div>
        </div>

        {/* ── Tracking History ──────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Tracking History</h3>

          {/* Tracking ID badge */}
          <div className="flex items-center gap-3 mb-5">
            <div>
              <p className="text-[11px] text-slate-400">Tracking ID</p>
              <p className="text-sm font-bold text-slate-900 font-mono">#12939-123-133ob</p>
            </div>
            <span className="ml-auto px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">
              in transit
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-5 relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />

            {/* Current Location */}
            <div className="flex items-start gap-3 relative">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0 mt-0.5 z-10" />
              <div>
                <p className="text-[11px] text-slate-400">Current Location</p>
                <p className="text-sm font-bold text-slate-900">Los Angeles Gateway</p>
              </div>
            </div>

            {/* Departure */}
            <div className="flex items-start gap-3 relative">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0 mt-0.5 z-10" />
              <div>
                <p className="text-[11px] text-slate-400">Departure Waypoint</p>
                <p className="text-sm font-bold text-slate-900">Las Vegas, NV - USA</p>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start gap-3 relative">
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm shrink-0 mt-0.5 z-10" />
              <div>
                <p className="text-[11px] text-slate-400">Arrival Waypoint</p>
                <p className="text-sm font-bold text-slate-900">San Diego, USA</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Vehicle card ──────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">White Bengala Box</h3>
            <span className="text-xs font-mono text-slate-400">WYC-2234</span>
          </div>

          {/* Truck illustration (icon-based) */}
          <div className="bg-slate-50 rounded-xl p-6 mb-5 flex items-center justify-center">
            <div className="relative">
              <Truck className="w-24 h-16 text-violet-300" strokeWidth={1} />
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Vehicle specs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Box className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-slate-900">46.3 m</p>
                <p className="text-[11px] text-slate-400">Load Volume</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-slate-900">36 m</p>
                <p className="text-[11px] text-slate-400">Load Length</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-violet-500 rotate-90" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-slate-900">18 m</p>
                <p className="text-[11px] text-slate-400">Load Width</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Map + Package Details ══════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Map (2-column span) ───────────────────── */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative" style={{ minHeight: 360 }}>
          {/* Simulated map background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-50">
            {/* Grid lines to simulate map */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Horizontal roads */}
              {[25, 40, 55, 70, 85].map((y) => (
                <line key={`h-${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#e2e8f0" strokeWidth="1" />
              ))}
              {/* Vertical roads */}
              {[20, 35, 50, 65, 80].map((x) => (
                <line key={`v-${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#e2e8f0" strokeWidth="1" />
              ))}
              {/* Route path (dotted blue line) */}
              <path
                d="M 15% 30% Q 30% 45%, 45% 50% T 75% 70%"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                strokeDasharray="8 5"
                strokeLinecap="round"
              />
              {/* Route waypoints */}
              <circle cx="15%" cy="30%" r="6" fill="#7c3aed" stroke="white" strokeWidth="2" />
              <circle cx="75%" cy="70%" r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
            </svg>

            {/* Vehicle markers */}
            {MAP_VEHICLES.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVehicle(activeVehicle === v.id ? null : v.id)}
                className="absolute group"
                style={{ left: `${v.x}%`, top: `${v.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {/* Label tooltip */}
                <div className={`
                  absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold transition-all
                  ${activeVehicle === v.id
                    ? "bg-violet-600 text-white shadow-lg scale-110"
                    : "bg-slate-800 text-white shadow-md group-hover:bg-violet-600"
                  }
                `}>
                  {v.id}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-current" 
                    style={{ color: activeVehicle === v.id ? "#7c3aed" : "#1e293b" }}
                  />
                </div>
                {/* Truck icon */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${activeVehicle === v.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-300/50 scale-110"
                    : "bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white"
                  }
                `}>
                  <Truck className="w-4 h-4" />
                </div>
              </button>
            ))}

            {/* Start marker */}
            <div className="absolute" style={{ left: "15%", top: "30%", transform: "translate(-50%, -50%)" }}>
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-300/40">
                <Navigation className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* End marker */}
            <div className="absolute" style={{ left: "75%", top: "70%", transform: "translate(-50%, -50%)" }}>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-300/40">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Distance overlay */}
          <div className="absolute bottom-5 left-5 bg-white rounded-xl px-4 py-3 shadow-md border border-slate-100">
            <p className="text-[11px] text-slate-400 mb-1">Distance to arrival</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">50</span>
              <span className="text-sm text-slate-500 mr-3">km</span>
              <span className="text-2xl font-extrabold text-slate-900">1</span>
              <span className="text-sm text-slate-500">h</span>
              <span className="text-2xl font-extrabold text-slate-900 ml-1">20</span>
              <span className="text-sm text-slate-500">m</span>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1">
            <button className="w-8 h-8 rounded-lg bg-white shadow border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors">+</button>
            <button className="w-8 h-8 rounded-lg bg-white shadow border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors">−</button>
          </div>
        </div>

        {/* ── Package Details ──────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1">Package Details</h3>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">41,180</span>
            <span className="text-sm text-slate-400">(Total Items)</span>
          </div>

          {/* Category percentages */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {PACKAGE_CATEGORIES.map((cat) => (
              <div key={cat.label} className="text-center">
                <p className="text-xs text-slate-500 mb-1">{cat.label}</p>
                <p className="text-lg font-extrabold text-slate-900">{cat.pct}%</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-4 justify-center h-32">
            {PACKAGE_CATEGORIES.map((cat) => (
              <div key={cat.label} className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(cat.pct / 70) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-full rounded-lg relative overflow-hidden"
                  style={{ backgroundColor: cat.color + "20" }}
                >
                  <div className="absolute inset-x-0 bottom-0 rounded-lg" style={{ height: `${cat.pct}%`, backgroundColor: cat.color }} />
                </motion.div>
                <span className="text-[11px] text-slate-500 tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* suppress unused */
void MoreHorizontal;
