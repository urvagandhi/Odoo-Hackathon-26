/**
 * CommandCenter — real-data dashboard powered by analyticsApi.getDashboardKPIs().
 * Replaces hardcoded AdminDashboard with live fleet metrics.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Users,
  Route,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Shield,
  ArrowRight,
  RefreshCw,
  Loader2,
  Gauge,
  Calendar,
  MapPin,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { analyticsApi } from "../api/client";

/* ── Types matching backend response ──────────────────── */
interface KPIData {
  fleet: {
    total: number;
    active: number;
    available: number;
    onTrip: number;
    inShop: number;
    retired: number;
    utilizationRate: string;
  };
  drivers: {
    total: number;
    onDuty: number;
    suspended: number;
    expiringLicenses: number;
  };
  trips: {
    pending: number;
    active: number;
    completedToday: number;
  };
  alerts: {
    maintenanceAlerts: number;
    expiringLicenses: number;
    suspendedDrivers: number;
  };
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
  isDark,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  isDark: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border cursor-pointer transition-shadow hover:shadow-lg ${
        isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className={`text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-0.5 font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{sub}</p>}
    </motion.div>
  );
}

/* ── Alert Row ────────────────────────────────────────── */
function AlertRow({
  icon: Icon,
  color,
  label,
  count,
  isDark,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  count: number;
  isDark: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-neutral-700/50" : "bg-slate-50"}`}>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{label}</p>
      </div>
      <span className={`text-lg font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>{count}</span>
    </div>
  );
}

/* ── Quick Action ─────────────────────────────────────── */
function QuickAction({
  icon: Icon,
  label,
  path,
  color,
  isDark,
  navigate,
}: {
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
  isDark: boolean;
  navigate: (p: string) => void;
}) {
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all hover:shadow-md group ${
        isDark ? "bg-neutral-800 border-neutral-700 hover:border-neutral-600" : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <span className={`text-sm font-medium flex-1 ${isDark ? "text-white" : "text-slate-900"}`}>{label}</span>
      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
    </button>
  );
}

/* ── Fleet Distribution Bar ───────────────────────────── */
function FleetBar({ data, isDark }: { data: KPIData["fleet"]; isDark: boolean }) {
  const total = data.total || 1;
  const segments = [
    { label: "Available", count: data.available, color: "bg-emerald-500" },
    { label: "On Trip", count: data.onTrip, color: "bg-blue-500" },
    { label: "In Shop", count: data.inShop, color: "bg-amber-500" },
    { label: "Retired", count: data.retired, color: "bg-neutral-500" },
  ];

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.label}
              className={`${s.color} transition-all`}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              {s.label} ({s.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function CommandCenter() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchKPIs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyticsApi.getDashboardKPIs();
      const body = res.data?.data ?? res.data;
      setKpi(body as KPIData);
    } catch {
      setError("Failed to load dashboard data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 mx-auto mb-3 animate-spin ${isDark ? "text-violet-400" : "text-violet-600"}`} />
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <p className={`text-sm ${isDark ? "text-neutral-300" : "text-slate-600"}`}>{error || "No data available."}</p>
          <button onClick={fetchKPIs} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const totalAlerts = kpi.alerts.maintenanceAlerts + kpi.alerts.expiringLicenses + kpi.alerts.suspendedDrivers;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {greeting}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            Here's what's happening with your fleet today.
          </p>
        </div>
        <button
          onClick={fetchKPIs}
          className={`p-2.5 rounded-xl border transition-colors ${
            isDark ? "border-neutral-700 hover:bg-neutral-800 text-neutral-400" : "border-slate-200 hover:bg-slate-100 text-slate-500"
          }`}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Truck}
          iconBg="bg-violet-600"
          label="Active Fleet"
          value={kpi.fleet.active}
          sub={`${kpi.fleet.total} total vehicles`}
          isDark={isDark}
          onClick={() => navigate("/fleet/vehicles")}
        />
        <StatCard
          icon={Route}
          iconBg="bg-blue-600"
          label="Active Trips"
          value={kpi.trips.active}
          sub={`${kpi.trips.pending} pending · ${kpi.trips.completedToday} done today`}
          isDark={isDark}
          onClick={() => navigate("/dispatch/trips")}
        />
        <StatCard
          icon={Gauge}
          iconBg="bg-emerald-600"
          label="Utilization Rate"
          value={kpi.fleet.utilizationRate}
          sub={`${kpi.fleet.onTrip} on trip / ${kpi.fleet.total} total`}
          isDark={isDark}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg={totalAlerts > 0 ? "bg-red-600" : "bg-emerald-600"}
          label="Active Alerts"
          value={totalAlerts}
          sub={totalAlerts > 0 ? "Action required" : "All clear ✅"}
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Fleet Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-2 p-6 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            Fleet Distribution
          </h3>
          <FleetBar data={kpi.fleet} isDark={isDark} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Available", value: kpi.fleet.available, color: "text-emerald-500" },
              { label: "On Trip", value: kpi.fleet.onTrip, color: "text-blue-500" },
              { label: "In Shop", value: kpi.fleet.inShop, color: "text-amber-500" },
              { label: "Retired", value: kpi.fleet.retired, color: "text-neutral-500" },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-xl ${isDark ? "bg-neutral-700/50" : "bg-slate-50"}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            ⚠️ Attention Required
          </h3>
          <div className="space-y-2">
            <AlertRow icon={Wrench} color="bg-amber-600" label="Vehicles in maintenance" count={kpi.alerts.maintenanceAlerts} isDark={isDark} />
            <AlertRow icon={Calendar} color="bg-red-600" label="Expiring licenses" count={kpi.alerts.expiringLicenses} isDark={isDark} />
            <AlertRow icon={Shield} color="bg-orange-600" label="Suspended drivers" count={kpi.alerts.suspendedDrivers} isDark={isDark} />
            {totalAlerts === 0 && (
              <div className={`text-center py-6 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                <p className="text-sm">No active alerts 🎉</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Drivers + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`p-6 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            Driver Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Drivers", value: kpi.drivers.total, icon: Users, color: "bg-violet-600" },
              { label: "On Duty", value: kpi.drivers.onDuty, icon: TrendingUp, color: "bg-emerald-600" },
              { label: "Suspended", value: kpi.drivers.suspended, icon: Shield, color: "bg-red-600" },
              { label: "Expiring Licenses", value: kpi.drivers.expiringLicenses, icon: Calendar, color: "bg-amber-600" },
            ].map((d) => (
              <div key={d.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-neutral-700/50" : "bg-slate-50"}`}>
                <div className={`w-8 h-8 rounded-lg ${d.color} flex items-center justify-center shrink-0`}>
                  <d.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{d.value}</p>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{d.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <QuickAction icon={Truck} label="Vehicle Registry" path="/fleet/vehicles" color="bg-violet-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Users} label="Driver Management" path="/hr/drivers" color="bg-blue-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Route} label="Trip Dispatcher" path="/dispatch/trips" color="bg-emerald-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Wrench} label="Maintenance" path="/fleet/maintenance" color="bg-amber-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={MapPin} label="Analytics" path="/analytics" color="bg-pink-600" isDark={isDark} navigate={navigate} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
