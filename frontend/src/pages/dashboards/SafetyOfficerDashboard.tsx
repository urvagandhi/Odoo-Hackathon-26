/**
 * SafetyOfficerDashboard — Driver safety & compliance from real backend data.
 * Accent: violet-600 (#7c3aed), white cards, #F8F9FD bg.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
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
  Loader2,
} from "lucide-react";
import { analyticsApi, driversApi, fleetApi } from "../../api/client";
import type { DashboardKPIs } from "../../api/client";

/* ── Animation ──────────────────────────────────────────── */
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } } };

/* ── Sparkline helper (used for compliance trend visual) ── */
const sparklinePath = (data: number[], w: number, h: number) => {
  const max = Math.max(...data, 1);
  return data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" L ");
};

/* ── Static chart data (time-series not available from backend) */
const SAFETY_TREND = [88, 90, 87, 92, 91, 94, 93, 96, 94, 95, 96, 96];
const COMPLIANCE_POINTS = [82, 85, 84, 88, 86, 90, 89, 91, 88, 92, 90, 93];

/* ── Response shape interfaces ──────────────────────────── */
interface ExpiringDriver {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiry: string;
}

interface InShopVehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  status: string;
}

const STATUS_DOT: Record<string, string> = {
  ON_DUTY: "bg-emerald-500",
  ON_TRIP: "bg-blue-500",
  OFF_DUTY: "bg-slate-400",
  SUSPENDED: "bg-red-500",
};

export default function SafetyOfficerDashboard() {
  const [kpi, setKpi] = useState<DashboardKPIs | null>(null);
  const [driverPerformance, setDriverPerformance] = useState<unknown[]>([]);
  const [expiringLicenses, setExpiringLicenses] = useState<ExpiringDriver[]>([]);
  const [inShopVehicles, setInShopVehicles] = useState<InShopVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboardKPIs(),
      analyticsApi.getDriverPerformance(),
      driversApi.getExpiringLicenses(),
      fleetApi.listVehicles({ status: "IN_SHOP", limit: 10 }),
    ])
      .then(([kpiData, perfData, expiringRes, vehiclesRes]) => {
        setKpi(kpiData);
        setDriverPerformance(perfData);
        // getExpiringLicenses returns { data: ExpiringDriver[] }
        const expiring = (expiringRes.data as { data: ExpiringDriver[] }).data ?? [];
        setExpiringLicenses(expiring);
        // listVehicles returns { data: { data: InShopVehicle[] } }
        const vehicles = (vehiclesRes.data as { data: { data: InShopVehicle[] } }).data?.data ?? [];
        setInShopVehicles(vehicles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  // Derived stats
  const avgSafetyScore = driverPerformance.length > 0
    ? Math.round(driverPerformance.reduce((s, d) => s + d.safetyScore, 0) / driverPerformance.length)
    : 0;

  const totalDrivers = kpi?.drivers.total ?? 0;
  const onDuty = kpi?.drivers.onDuty ?? 0;
  const suspended = kpi?.drivers.suspended ?? 0;
  const offDuty = Math.max(0, totalDrivers - onDuty - suspended);
  const compliancePct = totalDrivers > 0
    ? Math.round(((totalDrivers - suspended) / totalDrivers) * 100)
    : 0;

  const topDrivers = [...driverPerformance].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 4);

  const totalVehicles = kpi?.fleet.total ?? 1;
  const inShopCount = kpi?.fleet.inShop ?? 0;
  const maintCompliancePct = totalVehicles > 0
    ? Math.round(((totalVehicles - inShopCount) / totalVehicles) * 100)
    : 0;

  // Compliance breakdown categories from real data
  const complianceCategories = [
    {
      label: "On-Time",
      pct: compliancePct,
      count: String(Math.round(totalDrivers * compliancePct / 100)),
      color: "#7c3aed",
    },
    {
      label: "Safe Score",
      pct: driverPerformance.length > 0
        ? Math.round((driverPerformance.filter((d) => d.safetyScore >= 80).length / driverPerformance.length) * 100)
        : 0,
      count: String(driverPerformance.filter((d) => d.safetyScore >= 80).length),
      color: "#3b82f6",
    },
    {
      label: "License",
      pct: totalDrivers > 0
        ? Math.round(((totalDrivers - (kpi?.drivers.expiringLicenses ?? 0)) / totalDrivers) * 100)
        : 0,
      count: String(totalDrivers - (kpi?.drivers.expiringLicenses ?? 0)),
      color: "#06b6d4",
    },
  ];

  // Donut segments for driver status
  const donutTotal = Math.max(totalDrivers, 1);
  const donutSegments: { key: string; count: number; color: string; label: string }[] = [
    { key: "ON_DUTY", count: onDuty, color: "#22c55e", label: "On Duty" },
    { key: "SUSPENDED", count: suspended, color: "#ef4444", label: "Suspended" },
    { key: "OFF_DUTY", count: offDuty, color: "#94a3b8", label: "Off Duty" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — Three stat cards ═══════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Fleet Safety Score ───────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Fleet safety score</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Feb 2026</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{avgSafetyScore}</span>
                <span className="text-sm text-slate-400">/ 100</span>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  live
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

        {/* ── Active Alerts ─────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700">Expiring Licenses</span>
              </div>
              <span className="font-bold text-amber-700">{kpi?.alerts.expiringLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">Vehicles In Shop</span>
              </div>
              <span className="font-bold text-red-700">{kpi?.alerts.maintenanceAlerts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">Suspended Drivers</span>
              </div>
              <span className="font-bold text-slate-700">{kpi?.alerts.suspendedDrivers ?? 0}</span>
            </div>
          </div>
        </div>

        {/* ── Compliance rate ───────────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Compliance rate</h3>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-slate-500">Target 95%</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${compliancePct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-violet-500 rounded-full"
              />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-md">
              <Shield className="w-3 h-3 text-violet-600" />
              <span className="text-[11px] font-bold text-violet-600">{compliancePct}%</span>
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

      {/* ═══ ROW 2 — Alert card + Top drivers + Driver status ════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── License Expiry Alert card ─────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">License Alerts</h4>
              <p className="text-xs text-slate-400">{expiringLicenses.length} expiring within 30 days</p>
            </div>
          </div>

          {expiringLicenses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No expiring licenses</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {expiringLicenses.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {d.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{d.fullName}</p>
                    <p className="text-[11px] text-amber-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires {new Date(d.licenseExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              ))}
              {expiringLicenses.length > 3 && (
                <p className="text-[11px] text-slate-400 text-center">+{expiringLicenses.length - 3} more</p>
              )}
            </div>
          )}

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

          {topDrivers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No driver data yet.</div>
          ) : (
            <div className="space-y-3">
              {topDrivers.map((d, i) => (
                <div key={d.driverId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-violet-50 transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {d.driverName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{d.driverName}</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[d.status] ?? "bg-slate-400"}`} />
                      <p className="text-[11px] text-slate-400">{d.tripsCompleted} trips</p>
                    </div>
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
          )}
        </div>

        {/* ── Driver Status Overview ───────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">Driver Status</h3>

          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                {(() => {
                  const colors = { ON_DUTY: "#22c55e", SUSPENDED: "#ef4444", OFF_DUTY: "#94a3b8" };
                  const r = 40;
                  const circ = 2 * Math.PI * r;
                  let offset = 0;
                  return donutSegments.map(({ key, count, color }) => {
                    const dash = donutTotal > 0 ? (count / donutTotal) * circ : 0;
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
                <span className="text-xl font-extrabold text-slate-900">{totalDrivers}</span>
                <span className="text-[10px] text-slate-400">total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {donutSegments.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-600">{s.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-violet-50 text-center border border-violet-100">
              <p className="text-lg font-extrabold text-violet-700">{kpi?.drivers.expiringLicenses ?? 0}</p>
              <p className="text-[10px] text-violet-500">Expiring Licenses</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-center border border-amber-100">
              <p className="text-lg font-extrabold text-amber-700">{kpi?.fleet.inShop ?? 0}</p>
              <p className="text-[10px] text-amber-500">Vehicles In Shop</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Maintenance tickets + Compliance breakdown ═══ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* ── Vehicles In Shop (2-col) ──────────────── */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">Vehicles In Shop</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {inShopVehicles.length} active
            </span>
          </div>

          {inShopVehicles.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All vehicles are operational</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {inShopVehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-violet-50/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {v.make} {v.model}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Plate: <span className="font-mono font-medium text-slate-600">{v.licensePlate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600">
                      <Activity className="w-3 h-3" />
                      In Shop
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Under maintenance</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Compliance Breakdown ──────────────────── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1">Compliance Breakdown</h3>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{compliancePct}%</span>
            <span className="text-sm text-slate-400">(Overall)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {complianceCategories.map((cat) => (
              <div key={cat.label} className="text-center">
                <p className="text-xs text-slate-500 mb-1">{cat.label}</p>
                <p className="text-lg font-extrabold text-slate-900">{cat.pct}%</p>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-4 justify-center h-32">
            {complianceCategories.map((cat) => (
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

          <div className="mt-5 p-4 rounded-xl bg-violet-50 border border-violet-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-violet-600 font-medium">Maint. Compliance</span>
              <span className="text-xs font-bold text-violet-700">{maintCompliancePct}%</span>
            </div>
            <div className="h-2 bg-violet-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${maintCompliancePct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-violet-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
