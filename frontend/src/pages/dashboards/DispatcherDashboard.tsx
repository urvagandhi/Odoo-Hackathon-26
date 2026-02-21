/**
 * DispatcherDashboard — Drivergo-inspired trip dispatch management.
 * Accent: violet-600 (#7c3aed), white cards, #F8F9FD bg.
 * Layout mirrors AdminDashboard visual language.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Route,
  Truck,
  Users,
  MapPin,
  Navigation,
  Clock,
  CheckCircle2,
  Plus,
  TrendingUp,
  Calendar,
  Package,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

/* ── Animation ──────────────────────────────────────────── */
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } } };

/* ── Sparkline helper ───────────────────────────────────── */
const sparklinePath = (data: number[], w: number, h: number) => {
  const max = Math.max(...data);
  return data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" L ");
};

/* ── Chart data ─────────────────────────────────────────── */
const WEEKLY_TRIPS = [6, 9, 5, 12, 8, 14, 10, 11, 13, 8, 15, 12];
const COMPLETION_BARS = [85, 92, 78, 96, 88, 91, 84, 95, 79, 90, 87, 93, 80, 94, 86];
const ON_TIME_POINTS = [80, 88, 85, 91, 87, 94, 90, 92, 88, 95, 91, 93];

/* ── Mock Data ──────────────────────────────────────────── */
type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

interface Trip {
  id: string;
  driver: string;
  initials: string;
  vehicle: string;
  origin: string;
  destination: string;
  distance: string;
  status: TripStatus;
  scheduledDate: string;
  progress: number;
}

const TRIPS: Trip[] = [
  { id: "#TRP-1030", driver: "Jane Doe", initials: "JD", vehicle: "PB-4821", origin: "Chicago, IL", destination: "Detroit, MI", distance: "285 mi", status: "DISPATCHED", scheduledDate: "Today 08:30 AM", progress: 68 },
  { id: "#TRP-1031", driver: "Mike Ross", initials: "MR", vehicle: "FR-7733", origin: "Houston, TX", destination: "Dallas, TX", distance: "240 mi", status: "DISPATCHED", scheduledDate: "Today 09:15 AM", progress: 42 },
  { id: "#TRP-1032", driver: "Sara Lee", initials: "SL", vehicle: "KW-1199", origin: "LA, CA", destination: "Phoenix, AZ", distance: "370 mi", status: "DRAFT", scheduledDate: "Today 11:00 AM", progress: 0 },
  { id: "#TRP-1033", driver: "Tom Hardy", initials: "TH", vehicle: "VL-5512", origin: "Miami, FL", destination: "Orlando, FL", distance: "235 mi", status: "COMPLETED", scheduledDate: "Yesterday", progress: 100 },
  { id: "#TRP-1034", driver: "Amy Chen", initials: "AC", vehicle: "MK-8844", origin: "Seattle, WA", destination: "Portland, OR", distance: "175 mi", status: "CANCELLED", scheduledDate: "Yesterday", progress: 0 },
];

const STATUS_STYLES: Record<TripStatus, { dot: string; text: string; bg: string }> = {
  DRAFT: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" },
  DISPATCHED: { dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  COMPLETED: { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
  CANCELLED: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
};

/* ── Map vehicles ───────────────────────────────────────── */
const MAP_VEHICLES = [
  { id: "PB-4821", x: 30, y: 35, driver: "Jane Doe" },
  { id: "FR-7733", x: 58, y: 48, driver: "Mike Ross" },
  { id: "KW-1199", x: 42, y: 72, driver: "Sara Lee" },
];

/* ── Driver availability ────────────────────────────────── */
const DRIVERS_AVAILABLE = [
  { name: "Tom Hardy", status: "Available", vehicle: "VL-5512", rating: 4.8 },
  { name: "Amy Chen", status: "Available", vehicle: "MK-8844", rating: 4.5 },
  { name: "Luis Garcia", status: "Break", vehicle: "SC-2290", rating: 4.9 },
];

export default function DispatcherDashboard() {
  const [activeVehicle, setActiveVehicle] = useState<string | null>(null);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — Three stat cards ═══════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Trips this week ───────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Trips this week</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Feb 2026</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">48</span>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  12%
                </span>
              </div>
            </div>
            <svg viewBox="0 0 120 40" className="w-28 h-10" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dspSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
                d={`M ${sparklinePath(WEEKLY_TRIPS, 120, 36)}`}
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"
              />
              <path d={`M 0,36 L ${sparklinePath(WEEKLY_TRIPS, 120, 36)} L 120,36 Z`} fill="url(#dspSparkGrad)" />
              {(() => {
                const last = WEEKLY_TRIPS.length - 1;
                const max = Math.max(...WEEKLY_TRIPS);
                return <circle cx={120} cy={36 - (WEEKLY_TRIPS[last] / max) * 36} r="3" fill="#7c3aed" stroke="white" strokeWidth="2" />;
              })()}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className={d === "Fri" ? "font-bold text-slate-700" : ""}>{d}</span>
            ))}
          </div>
        </div>

        {/* ── Completion rate ───────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Completion rate</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-extrabold text-slate-900 tabular-nums">94%</span>
            <span className="text-xs font-semibold text-emerald-500">↑ 2.1%</span>
          </div>
          <div className="flex items-end gap-[3px] h-16 mt-3 mb-3">
            {COMPLETION_BARS.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(v / 100) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className={`flex-1 rounded-sm ${v >= 90 ? "bg-violet-500" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />Completed</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200" />Pending</div>
          </div>
        </div>

        {/* ── On-time delivery ──────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">On-time delivery</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">This week</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-slate-500">Target 95%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: "91%" }} />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-md">
              <Clock className="w-3 h-3 text-violet-600" />
              <span className="text-[11px] font-bold text-violet-600">91%</span>
            </div>
          </div>
          <div className="relative h-20">
            <svg viewBox="0 0 200 70" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dspOnTimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 23} x2="200" y2={i * 23} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
                d={`M ${sparklinePath(ON_TIME_POINTS, 200, 60)}`}
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round"
              />
              <path d={`M 0,60 L ${sparklinePath(ON_TIME_POINTS, 200, 60)} L 200,60 Z`} fill="url(#dspOnTimeGrad)" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className={d === "Fri" ? "font-bold text-violet-600" : ""}>{d}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Live progress + Available drivers + Upcoming ═══ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Live trip progress card ───────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Live Trips</h3>
          <div className="space-y-4">
            {TRIPS.filter((t) => t.status === "DISPATCHED").map((trip) => (
              <div key={trip.id} className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${trip.driver.replace(" ", "+")}&background=7c3aed&color=fff&size=36&font-size=0.4&bold=true&rounded=true`}
                    alt={trip.driver}
                    className="w-9 h-9 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{trip.driver}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{trip.id}</p>
                  </div>
                  <span className="text-xs font-bold text-violet-600 tabular-nums">{trip.progress}%</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                  <MapPin className="w-3 h-3 text-violet-400" />
                  {trip.origin} → {trip.destination}
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trip.progress}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="h-full bg-violet-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Available drivers ─────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Available Drivers</h3>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">
              {DRIVERS_AVAILABLE.length} ready
            </span>
          </div>
          <div className="space-y-3">
            {DRIVERS_AVAILABLE.map((d) => (
              <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 transition-colors cursor-pointer">
                <img
                  src={`https://ui-avatars.com/api/?name=${d.name.replace(" ", "+")}&background=7c3aed&color=fff&size=40&font-size=0.38&bold=true&rounded=true`}
                  alt={d.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{d.name}</p>
                  <p className="text-[11px] text-slate-400">Vehicle: {d.vehicle}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === "Available" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}>{d.status}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">★ {d.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Upcoming dispatches ───────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Upcoming Dispatches</h3>
          <div className="space-y-3">
            {TRIPS.filter((t) => t.status === "DRAFT").map((trip) => (
              <div key={trip.id} className="p-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 font-mono">{trip.id}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">Draft</span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    {trip.origin}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {trip.destination}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{trip.scheduledDate}
                  </span>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-[11px] font-bold rounded-full hover:bg-violet-700 transition-colors">
                    <Plus className="w-3 h-3" />Dispatch
                  </button>
                </div>
              </div>
            ))}

            {/* Quick-add card */}
            <button className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-colors group">
              <Plus className="w-5 h-5 text-slate-300 mx-auto mb-1 group-hover:text-violet-400 transition-colors" />
              <p className="text-xs text-slate-400 group-hover:text-violet-500 font-medium">Create new trip</p>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Map + Trip list ═══════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Dispatch Map (2-col) ──────────────────── */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative" style={{ minHeight: 360 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-50">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {[25, 40, 55, 70, 85].map((y) => (
                <line key={`h-${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#e2e8f0" strokeWidth="1" />
              ))}
              {[20, 35, 50, 65, 80].map((x) => (
                <line key={`v-${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#e2e8f0" strokeWidth="1" />
              ))}
              {/* Route paths */}
              <path d="M 20% 28% Q 35% 40%, 50% 42% T 70% 58%" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round" />
              <path d="M 30% 35% Q 38% 55%, 42% 72%" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" opacity="0.6" />
              <circle cx="20%" cy="28%" r="5" fill="#7c3aed" stroke="white" strokeWidth="2" />
              <circle cx="70%" cy="58%" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
            </svg>

            {MAP_VEHICLES.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVehicle(activeVehicle === v.id ? null : v.id)}
                className="absolute group"
                style={{ left: `${v.x}%`, top: `${v.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  activeVehicle === v.id ? "bg-violet-600 text-white shadow-lg scale-110" : "bg-slate-800 text-white shadow-md group-hover:bg-violet-600"
                }`}>
                  {v.id} · {v.driver}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-current"
                    style={{ color: activeVehicle === v.id ? "#7c3aed" : "#1e293b" }} />
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  activeVehicle === v.id ? "bg-violet-600 text-white shadow-lg shadow-violet-300/50 scale-110" : "bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white"
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
              </button>
            ))}

            <div className="absolute" style={{ left: "20%", top: "28%", transform: "translate(-50%, -50%)" }}>
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-300/40">
                <Navigation className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute" style={{ left: "70%", top: "58%", transform: "translate(-50%, -50%)" }}>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-300/40">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute bottom-5 left-5 bg-white rounded-xl px-4 py-3 shadow-md border border-slate-100">
            <p className="text-[11px] text-slate-400 mb-1">Active dispatches</p>
            <div className="flex items-baseline gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">2</span>
                <span className="text-sm text-slate-500">in transit</span>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">1</span>
                <span className="text-sm text-slate-500">draft</span>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-1">
            <button className="w-8 h-8 rounded-lg bg-white shadow border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors">+</button>
            <button className="w-8 h-8 rounded-lg bg-white shadow border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-lg font-medium transition-colors">−</button>
          </div>
        </div>

        {/* ── Trip Summary ──────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1">Trip Summary</h3>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">5</span>
            <span className="text-sm text-slate-400">(Total Trips)</span>
          </div>

          {/* Status breakdown */}
          <div className="space-y-3 mb-5">
            {(
              [
                { label: "Dispatched", count: 2, color: "#7c3aed", pct: 40 },
                { label: "Draft", count: 1, color: "#94a3b8", pct: 20 },
                { label: "Completed", count: 1, color: "#3b82f6", pct: 20 },
                { label: "Cancelled", count: 1, color: "#ef4444", pct: 20 },
              ] as const
            ).map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{s.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Fleet utilization */}
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-bold text-violet-900">Fleet Utilization</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-violet-700">78%</span>
              <span className="text-xs text-violet-500 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />+5%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* suppress unused */
void CheckCircle2; void Package; void Users; void MoreHorizontal; void STATUS_STYLES;
