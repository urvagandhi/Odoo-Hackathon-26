/**
 * AdminDashboard — Fleet overview for MANAGER role.
 * All data from backend: analytics KPI + monthly + recent trips.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  TrendingUp,
  Users,
  Route,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity
} from "lucide-react";
import { analyticsApi, dispatchApi } from "../../api/client";
import type { DashboardKPIs, MonthlyReport } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";
import { DashboardSkeleton } from "../../components/ui/DashboardSkeleton";

const card = "rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl shrink-0";
const lightCard = "bg-gradient-to-br from-white via-white to-slate-50/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]";
const darkCard = "bg-slate-900/60 border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]";

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

interface RecentTrip {
  id: string;
  origin: string;
  destination: string;
  status: string;
  driver?: { fullName: string } | null;
  vehicle?: { licensePlate: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  DISPATCHED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const cardClass = `${card} ${isDark ? darkCard : lightCard}`;

  const [kpi, setKpi] = useState<DashboardKPIs | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboardKPIs(),
      analyticsApi.getMonthlyReport(),
      dispatchApi.listTrips({ limit: 5 }),
    ])
      .then(([kpiData, monthlyData, tripsRes]) => {
        setKpi(kpiData);
        setMonthly(monthlyData);
        const trips = (tripsRes.data ?? []) as RecentTrip[];
        setRecentTrips(trips);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sparklinePath = (data: number[], w: number, h: number) => {
    if (data.length < 2) return "";
    const max = Math.max(...data, 1);
    return data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" L ");
  };

  const tripSparkline = monthly.map((m) => m.tripsCompleted);
  const revenueSparkline = monthly.map((m) => m.revenue);
  const currentMonth = monthly[new Date().getMonth()];
  const utilizationPct = kpi ? parseFloat(kpi.fleet.utilizationRate) : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — KPI Stat Cards ═════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className={`group ${cardClass} p-5`}>
          {!isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-100/50 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Fleet</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] ${isDark ? "bg-violet-500/10" : "bg-gradient-to-br from-violet-50 to-violet-100/50"}`}>
              <Truck className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p className={`text-3xl font-extrabold tabular-nums relative z-10 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpi?.fleet.total ?? 0}</p>
          <div className="flex gap-3 mt-2 text-xs relative z-10">
            <span className="text-emerald-600 font-medium">{kpi?.fleet.available ?? 0} available</span>
            <span className={isDark ? "text-slate-600" : "text-slate-300"}>·</span>
            <span className="text-blue-600 font-medium">{kpi?.fleet.onTrip ?? 0} on trip</span>
          </div>
        </div>

        <div className={`group ${cardClass} p-5`}>
          {!isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Utilization</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] ${isDark ? "bg-blue-500/10" : "bg-gradient-to-br from-blue-50 to-blue-100/50"}`}>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className={`text-3xl font-extrabold tabular-nums relative z-10 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpi?.fleet.utilizationRate ?? "0%"}</p>
          <div className={`mt-2 h-2 rounded-full overflow-hidden relative z-10 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${utilizationPct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>

        <div className={`group ${cardClass} p-5`}>
          {!isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Drivers On Duty</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] ${isDark ? "bg-emerald-500/10" : "bg-gradient-to-br from-emerald-50 to-emerald-100/50"}`}>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className={`text-3xl font-extrabold tabular-nums relative z-10 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpi?.drivers.onDuty ?? 0}</p>
          <p className={`text-xs mt-2 relative z-10 ${isDark ? "text-slate-500" : "text-slate-400"}`}>of {kpi?.drivers.total ?? 0} total drivers</p>
        </div>

        <div className={`group ${cardClass} p-5`}>
          {!isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active Trips</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] ${isDark ? "bg-amber-500/10" : "bg-gradient-to-br from-amber-50 to-amber-100/50"}`}>
              <Route className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className={`text-3xl font-extrabold tabular-nums relative z-10 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{kpi?.trips.active ?? 0}</p>
          <p className={`text-xs mt-2 relative z-10 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{kpi?.trips.completedToday ?? 0} completed today</p>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Charts + Alerts ════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* Monthly Trips Sparkline */}
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Trips This Year</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className={`text-xs mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{currentMonth?.label ?? "Current month"}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold tabular-nums ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {currentMonth?.tripsCompleted ?? 0}
                </span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-600"}`}>
                  <TrendingUp className="w-3 h-3" />
                  completed
                </span>
              </div>
            </div>
            {tripSparkline.length > 1 && (
              <svg viewBox="0 0 120 40" className="w-28 h-10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2 }}
                  d={`M ${sparklinePath(tripSparkline, 120, 36)}`}
                  fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"
                />
                <path d={`M 0,36 L ${sparklinePath(tripSparkline, 120, 36)} L 120,36 Z`} fill="url(#sparkGrad)" />
              </svg>
            )}
          </div>
          <div className={`flex justify-between text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {["Jan","Mar","May","Jul","Sep","Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Revenue Trend</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-3xl font-extrabold tabular-nums ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              ₹{((currentMonth?.revenue ?? 0) / 1000).toFixed(0)}k
            </span>
            <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>this month</span>
          </div>
          {revenueSparkline.length > 1 && (
            <div className="flex items-end gap-[3px] h-16">
              {revenueSparkline.map((v, i) => {
                const max = Math.max(...revenueSparkline, 1);
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    className={`flex-1 rounded-sm ${i === new Date().getMonth() ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" : (isDark ? "bg-slate-800" : "bg-slate-200")}`}
                  />
                );
              })}
            </div>
          )}
          <div className={`flex justify-between text-[10px] mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {["Jan","Mar","May","Jul","Sep","Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Fleet Alerts */}
        <div className={`${cardClass} p-5`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Fleet Alerts</h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-amber-500/10" : "bg-gradient-to-r from-amber-50 to-amber-100/30"}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className={`text-sm ${isDark ? "text-amber-400" : "text-amber-700"}`}>Licenses Expiring</span>
              </div>
              <span className={`font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>{kpi?.alerts.expiringLicenses ?? 0}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-red-500/10" : "bg-gradient-to-r from-red-50 to-red-100/30"}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className={`text-sm ${isDark ? "text-red-400" : "text-red-700"}`}>Vehicles In Shop</span>
              </div>
              <span className={`font-bold ${isDark ? "text-red-400" : "text-red-700"}`}>{kpi?.alerts.maintenanceAlerts ?? 0}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-slate-800" : "bg-gradient-to-r from-slate-50 to-slate-100/50"}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>Pending Trips</span>
              </div>
              <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{kpi?.trips.pending ?? 0}</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-emerald-500/10" : "bg-gradient-to-r from-emerald-50 to-emerald-100/30"}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className={`text-sm ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Drivers Suspended</span>
              </div>
              <span className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{kpi?.alerts.suspendedDrivers ?? 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Recent Trips ════════════════════════════════════════ */}
      <motion.div variants={fadeIn} className={`${cardClass} p-0 overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <h3 className={`text-base font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Recent Trips</h3>
        </div>
        {recentTrips.length === 0 ? (
          <div className={`p-8 text-center text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>No trips found. Add trips via Dispatch.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Route</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Driver</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id} className={`border-b transition-colors ${isDark ? "border-slate-800 hover:bg-slate-800/50" : "border-slate-50 hover:bg-slate-50"}`}>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">#{String(trip.id).slice(-6)}</td>
                  <td className="px-6 py-3">
                    <span className={`font-medium ${isDark ? "text-slate-200" : "text-slate-900"}`}>{trip.origin}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className={`font-medium ${isDark ? "text-slate-200" : "text-slate-900"}`}>{trip.destination}</span>
                  </td>
                  <td className={`px-6 py-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>{trip.driver?.fullName ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{trip.vehicle?.licensePlate ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDark 
                        ? (trip.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" : trip.status === "DISPATCHED" ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400")
                        : (STATUS_COLORS[trip.status] ?? "bg-slate-100 text-slate-600")
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
