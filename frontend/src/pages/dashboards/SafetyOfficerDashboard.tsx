/**
 * SafetyOfficerDashboard — Drivergo-inspired driver safety & compliance.
 * Accent: violet-600 (#7c3aed), white cards, #F8F9FD bg.
 * Layout mirrors AdminDashboard visual language.
 */
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  AlertTriangle,
  Wrench,
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
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
const SAFETY_TREND = [88, 90, 87, 92, 91, 94, 93, 96, 94, 95, 96, 96];
const INCIDENT_BARS = [3, 1, 4, 2, 0, 1, 3, 0, 2, 1, 0, 1, 2, 0, 1];
const COMPLIANCE_POINTS = [82, 85, 84, 88, 86, 90, 89, 91, 88, 92, 90, 93];

/* ── Mock Data ──────────────────────────────────────────── */
interface Driver {
  name: string;
  license: string;
  status: "ON_DUTY" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
  licenseExpiry: string;
  safetyScore: number;
  completionRate: number;
  tripsCompleted: number;
  isExpiringSoon: boolean;
}

const DRIVERS: Driver[] = [
  { name: "Jane Doe", license: "CDL-A 4821", status: "ON_TRIP", licenseExpiry: "Mar 15, 2027", safetyScore: 98, completionRate: 97, tripsCompleted: 142, isExpiringSoon: false },
  { name: "Mike Ross", license: "CDL-A 7733", status: "ON_DUTY", licenseExpiry: "Jun 20, 2027", safetyScore: 95, completionRate: 94, tripsCompleted: 128, isExpiringSoon: false },
  { name: "Sara Lee", license: "CDL-A 1199", status: "ON_DUTY", licenseExpiry: "Mar 05, 2026", safetyScore: 88, completionRate: 91, tripsCompleted: 85, isExpiringSoon: true },
  { name: "Tom Hardy", license: "CDL-B 5512", status: "OFF_DUTY", licenseExpiry: "Dec 10, 2026", safetyScore: 92, completionRate: 96, tripsCompleted: 110, isExpiringSoon: false },
  { name: "Amy Chen", license: "CDL-A 8844", status: "ON_DUTY", licenseExpiry: "Feb 28, 2026", safetyScore: 76, completionRate: 85, tripsCompleted: 62, isExpiringSoon: true },
  { name: "John Smith", license: "CDL-A 3355", status: "SUSPENDED", licenseExpiry: "Feb 25, 2026", safetyScore: 64, completionRate: 72, tripsCompleted: 45, isExpiringSoon: true },
];

interface MaintenanceTicket {
  id: string;
  vehicle: string;
  type: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string;
}

const MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  { id: "MT-401", vehicle: "KW-3344", type: "Engine Inspection", priority: "Critical", status: "Pending", dueDate: "Today" },
  { id: "MT-402", vehicle: "FR-7733", type: "Brake Replacement", priority: "High", status: "In Progress", dueDate: "Feb 23" },
  { id: "MT-403", vehicle: "PB-4821", type: "Oil Change", priority: "Medium", status: "Pending", dueDate: "Feb 25" },
  { id: "MT-404", vehicle: "VL-5512", type: "Tire Rotation", priority: "Medium", status: "In Progress", dueDate: "Feb 26" },
  { id: "MT-405", vehicle: "MK-8844", type: "Transmission Check", priority: "Low", status: "Pending", dueDate: "Mar 01" },
];

const STATUS_DOT: Record<Driver["status"], string> = {
  ON_DUTY: "bg-emerald-500",
  ON_TRIP: "bg-blue-500",
  OFF_DUTY: "bg-slate-400",
  SUSPENDED: "bg-red-500",
};

const STATUS_LABEL: Record<Driver["status"], string> = {
  ON_DUTY: "On Duty",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

const PRIORITY_COLOR: Record<MaintenanceTicket["priority"], string> = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#94a3b8",
};

/* ── Compliance categories (for Package-Details-style card) */
const COMPLIANCE_CATEGORIES = [
  { label: "On-Time", pct: 94, count: "142", color: "#7c3aed" },
  { label: "Zero Incidents", pct: 98, count: "148", color: "#3b82f6" },
  { label: "License", pct: 86, count: "30", color: "#06b6d4" },
];

export default function SafetyOfficerDashboard() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — Three stat cards ═══════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Safety Score trend ─────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Fleet safety score</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Feb 2026</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">96</span>
                <span className="text-sm text-slate-400">/ 100</span>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +2
                </span>
              </div>
            </div>
            <svg viewBox="0 0 120 40" className="w-28 h-10" preserveAspectRatio="none">
              <defs>
                <linearGradient id="safSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
                d={`M ${sparklinePath(SAFETY_TREND, 120, 36)}`}
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"
              />
              <path d={`M 0,36 L ${sparklinePath(SAFETY_TREND, 120, 36)} L 120,36 Z`} fill="url(#safSparkGrad)" />
              {(() => {
                const last = SAFETY_TREND.length - 1;
                const max = Math.max(...SAFETY_TREND);
                return <circle cx={120} cy={36 - (SAFETY_TREND[last] / max) * 36} r="3" fill="#7c3aed" stroke="white" strokeWidth="2" />;
              })()}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            {["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"].map((m) => (
              <span key={m} className={m === "Feb" ? "font-bold text-slate-700" : ""}>{m}</span>
            ))}
          </div>
        </div>

        {/* ── Incidents ─────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly incidents</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-extrabold text-slate-900 tabular-nums">0</span>
            <span className="text-xs font-semibold text-emerald-500">This month</span>
          </div>
          <div className="flex items-end gap-[3px] h-16 mt-3 mb-3">
            {INCIDENT_BARS.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((v / 4) * 100, 5)}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                className={`flex-1 rounded-sm ${v === 0 ? "bg-violet-500" : v >= 3 ? "bg-red-400" : "bg-amber-300"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" />Zero incidents</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-300" />Minor</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Major</div>
          </div>
        </div>

        {/* ── Compliance rate ───────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Compliance rate</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">30 days</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-slate-500">Target 95%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: "86%" }} />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-md">
              <Shield className="w-3 h-3 text-violet-600" />
              <span className="text-[11px] font-bold text-violet-600">86%</span>
            </div>
          </div>
          <div className="relative h-20">
            <svg viewBox="0 0 200 70" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="safCompGrad" x1="0" y1="0" x2="0" y2="1">
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
                d={`M ${sparklinePath(COMPLIANCE_POINTS, 200, 60)}`}
                fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round"
              />
              <path d={`M 0,60 L ${sparklinePath(COMPLIANCE_POINTS, 200, 60)} L 200,60 Z`} fill="url(#safCompGrad)" />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            {["22 Jan", "27 Jan", "1 Feb", "7 Feb", "14 Feb", "21 Feb"].map((d) => (
              <span key={d} className={d === "21 Feb" ? "font-bold text-violet-600" : ""}>{d}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Alert card + Top drivers + Expiring licenses ═══ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── License Expiry Alert card ─────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">License Alerts</h4>
              <p className="text-xs text-slate-400">{DRIVERS.filter(d => d.isExpiringSoon).length} expiring within 30 days</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {DRIVERS.filter(d => d.isExpiringSoon).map(d => (
              <div key={d.license} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <img
                  src={`https://ui-avatars.com/api/?name=${d.name.replace(" ", "+")}&background=7c3aed&color=fff&size=36&font-size=0.4&bold=true&rounded=true`}
                  alt={d.name}
                  className="w-9 h-9 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{d.name}</p>
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expires {d.licenseExpiry}
                  </p>
                </div>
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Send Reminders
          </button>
        </div>

        {/* ── Top Drivers ──────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Top Drivers</h3>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">
              By safety score
            </span>
          </div>

          <div className="space-y-3">
            {[...DRIVERS]
              .sort((a, b) => b.safetyScore - a.safetyScore)
              .slice(0, 4)
              .map((d, i) => (
                <div key={d.license} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 transition-colors">
                  <div className="relative">
                    <img
                      src={`https://ui-avatars.com/api/?name=${d.name.replace(" ", "+")}&background=7c3aed&color=fff&size=40&font-size=0.38&bold=true&rounded=true`}
                      alt={d.name}
                      className="w-10 h-10 rounded-full"
                    />
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{d.name}</p>
                    <p className="text-[11px] text-slate-400">{d.tripsCompleted} trips · {d.completionRate}% rate</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-extrabold tabular-nums ${
                      d.safetyScore >= 90 ? "text-emerald-600" : d.safetyScore >= 75 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {d.safetyScore}
                    </div>
                    <p className="text-[10px] text-slate-400">score</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── Driver Status Overview ───────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Driver Status</h3>

          {/* Donut + legend */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                {(() => {
                  const counts = { ON_DUTY: 3, ON_TRIP: 1, OFF_DUTY: 1, SUSPENDED: 1 };
                  const total = 6;
                  const colors = { ON_DUTY: "#22c55e", ON_TRIP: "#3b82f6", OFF_DUTY: "#94a3b8", SUSPENDED: "#ef4444" };
                  let offset = 0;
                  const r = 40;
                  const circ = 2 * Math.PI * r;
                  return Object.entries(counts).map(([key, count]) => {
                    const dash = (count / total) * circ;
                    const gap = circ - dash;
                    const o = offset;
                    offset += dash;
                    return (
                      <circle
                        key={key}
                        cx="50" cy="50" r={r}
                        fill="none"
                        stroke={colors[key as keyof typeof colors]}
                        strokeWidth="10"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-o}
                        strokeLinecap="round"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-900">35</span>
                <span className="text-[10px] text-slate-400">total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { label: "On Duty", count: 3, color: "#22c55e" },
                { label: "On Trip", count: 1, color: "#3b82f6" },
                { label: "Off Duty", count: 1, color: "#94a3b8" },
                { label: "Suspended", count: 1, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-violet-50 text-center border border-violet-100">
              <p className="text-lg font-extrabold text-violet-700">4</p>
              <p className="text-[10px] text-violet-500">Expiring Licenses</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-center border border-amber-100">
              <p className="text-lg font-extrabold text-amber-700">7</p>
              <p className="text-[10px] text-amber-500">Pending Maint.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Maintenance tickets + Compliance breakdown ═══ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Maintenance Tickets (2-col) ───────────── */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Maintenance Tickets</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {MAINTENANCE_TICKETS.length} active
            </span>
          </div>
          <div className="p-4 space-y-3">
            {MAINTENANCE_TICKETS.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-violet-50/40 transition-colors">
                {/* Priority indicator */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: PRIORITY_COLOR[t.priority] + "15" }}>
                  <Wrench className="w-5 h-5" style={{ color: PRIORITY_COLOR[t.priority] }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-slate-900">{t.type}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: PRIORITY_COLOR[t.priority] + "15", color: PRIORITY_COLOR[t.priority] }}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Vehicle: <span className="font-mono font-medium text-slate-600">{t.vehicle}</span>
                    <span className="mx-2">·</span>
                    <span className="font-mono">{t.id}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    t.status === "Completed" ? "bg-emerald-50 text-emerald-600"
                      : t.status === "In Progress" ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {t.status === "In Progress" ? <Activity className="w-3 h-3" /> :
                     t.status === "Completed" ? <CheckCircle2 className="w-3 h-3" /> :
                     <Clock className="w-3 h-3" />}
                    {t.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Due: {t.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Compliance Breakdown ──────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1">Compliance Breakdown</h3>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">86%</span>
            <span className="text-sm text-slate-400">(Overall)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {COMPLIANCE_CATEGORIES.map((cat) => (
              <div key={cat.label} className="text-center">
                <p className="text-xs text-slate-500 mb-1">{cat.label}</p>
                <p className="text-lg font-extrabold text-slate-900">{cat.pct}%</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-4 justify-center h-32">
            {COMPLIANCE_CATEGORIES.map((cat) => (
              <div key={cat.label} className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(cat.pct / 100) * 100}%` }}
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

          {/* Maintenance compliance */}
          <div className="mt-5 p-4 rounded-xl bg-violet-50 border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-violet-600 font-medium">Maint. Compliance</span>
              <span className="text-xs font-bold text-violet-700">79%</span>
            </div>
            <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full" style={{ width: "79%" }} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* suppress unused */
void Users; void STATUS_DOT; void STATUS_LABEL;
