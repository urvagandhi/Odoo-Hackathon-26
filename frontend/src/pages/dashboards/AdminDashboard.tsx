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
  Activity,
  Loader2,
} from "lucide-react";
import { analyticsApi, tripsApi } from "../../api/client";
import type { KpiData, MonthlyData } from "../../api/client";

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
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getKpi(),
      analyticsApi.getMonthly(),
      tripsApi.listTrips({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    ])
      .then(([kpiData, monthlyData, tripsRes]) => {
        setKpi(kpiData);
        setMonthly(monthlyData);
        const trips = (tripsRes.data as { data: { data: RecentTrip[] } }).data?.data ?? [];
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — KPI Stat Cards ═════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Total Fleet</p>
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.fleet.total ?? 0}</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-emerald-600 font-medium">{kpi?.fleet.available ?? 0} available</span>
            <span className="text-slate-300">·</span>
            <span className="text-blue-600 font-medium">{kpi?.fleet.onTrip ?? 0} on trip</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Utilization</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.fleet.utilizationRate ?? "0%"}</p>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${utilizationPct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Drivers On Duty</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.drivers.onDuty ?? 0}</p>
          <p className="text-xs text-slate-400 mt-2">of {kpi?.drivers.total ?? 0} total drivers</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Active Trips</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Route className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.trips.active ?? 0}</p>
          <p className="text-xs text-slate-400 mt-2">{kpi?.trips.completedToday ?? 0} completed today</p>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Charts + Alerts ════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        {/* Monthly Trips Sparkline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Trips This Year</h3>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">{currentMonth?.label ?? "Current month"}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {currentMonth?.tripsCompleted ?? 0}
                </span>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
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
          <div className="flex justify-between text-[10px] text-slate-400">
            {["Jan","Mar","May","Jul","Sep","Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              ₹{((currentMonth?.revenue ?? 0) / 1000).toFixed(0)}k
            </span>
            <span className="text-xs text-slate-400">this month</span>
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
                    className={`flex-1 rounded-sm ${i === new Date().getMonth() ? "bg-violet-500" : "bg-slate-200"}`}
                  />
                );
              })}
            </div>
          )}
          <div className="flex justify-between text-[10px] text-slate-400 mt-2">
            {["Jan","Mar","May","Jul","Sep","Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Fleet Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Fleet Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700">Licenses Expiring</span>
              </div>
              <span className="font-bold text-amber-700">{kpi?.alerts.expiringLicenses ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">Vehicles In Shop</span>
              </div>
              <span className="font-bold text-red-700">{kpi?.alerts.maintenanceAlerts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">Pending Trips</span>
              </div>
              <span className="font-bold text-slate-700">{kpi?.trips.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-700">Drivers Suspended</span>
              </div>
              <span className="font-bold text-emerald-700">{kpi?.alerts.suspendedDrivers ?? 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 3 — Recent Trips ════════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Recent Trips</h3>
        </div>
        {recentTrips.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No trips found. Add trips via Dispatch.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Route</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Driver</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">#{String(trip.id).slice(-6)}</td>
                  <td className="px-6 py-3">
                    <span className="text-slate-900 font-medium">{trip.origin}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="text-slate-900 font-medium">{trip.destination}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{trip.driver?.fullName ?? "—"}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{trip.vehicle?.licensePlate ?? "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[trip.status] ?? "bg-slate-100 text-slate-600"}`}>
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
