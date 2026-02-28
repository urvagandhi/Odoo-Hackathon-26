/**
 * CommandCenter — real-data fleet overview dashboard.
 * KPIs per spec: Active Fleet (on trip), Maintenance Alerts (in shop),
 *                Utilization Rate, Pending Cargo (DRAFT trips).
 * Filters: Vehicle Type, Status — both backed by real API data.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  Gauge,
  Calendar,
  MapPin,
  Package,
  ChevronDown,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { analyticsApi, fleetApi, type DashboardKPIs } from "../api/client";

const card = "rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl shrink-0";
const lightCard = "bg-gradient-to-br from-white via-white to-slate-50/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]";
const darkCard = "bg-slate-900/60 border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]";
const getCardClass = (isDark: boolean) => `${card} ${isDark ? darkCard : lightCard}`;

/* ── Vehicle Type (from API) ─────────────────────────── */
interface VehicleType {
  id: string;
  name: string;
}

/* ── Skeleton Card ────────────────────────────────────── */
function StatCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className={`p-5 ${getCardClass(isDark)}`}>
      <div className={`w-10 h-10 rounded-xl mb-3 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
      <div className={`h-9 w-16 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
      <div className={`h-3.5 w-28 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
      <div className={`h-3 w-20 rounded mt-1.5 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
    </div>
  );
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
      className={`p-5 cursor-pointer ${getCardClass(isDark)} hover:shadow-lg`}
    >
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className={`text-3xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
      <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
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
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? "bg-slate-800/50 hover:bg-slate-800" : "bg-slate-50 hover:bg-slate-100/80"}`}>
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>{label}</p>
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
      className={`flex items-center gap-3 p-3.5 text-left group ${getCardClass(isDark)} hover:shadow-md cursor-pointer`}
    >
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shadow-md`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className={`text-sm font-medium flex-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{label}</span>
      <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
    </button>
  );
}

/* ── Fleet Distribution Bar ───────────────────────────── */
function FleetBar({ data, isDark }: { data: DashboardKPIs["fleet"]; isDark: boolean }) {
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

/* ── Filter Select ────────────────────────────────────── */
function FilterSelect({
  label,
  value,
  onChange,
  options,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  isDark: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-8 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ${
          value
            ? isDark
              ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
              : "bg-violet-50 border-violet-300 text-violet-700"
            : isDark
            ? "bg-neutral-800 border-neutral-700 text-neutral-300"
            : "bg-white border-slate-200 text-slate-600"
        }`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
    </div>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function CommandCenter() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [kpi, setKpi] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const fetchKPIs = useCallback(async (regionFilter: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await analyticsApi.getDashboardKPIs(regionFilter || undefined);
      setKpi(data);
    } catch {
      setError(t("commandCenter.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch KPIs + vehicle types on mount / region change
  useEffect(() => {
    fetchKPIs(filterRegion);
    fleetApi.listVehicleTypes()
      .then((res) => {
        if (Array.isArray(res)) {
          setVehicleTypes(res.map((t) => ({ id: String(t.id), name: t.name })));
        }
      })
      .catch(() => {});
  }, [fetchKPIs]);

  // Fetch filtered vehicle count when filter changes
  useEffect(() => {
    if (!filterType && !filterStatus && !filterRegion) {
      setFilteredCount(null);
      return;
    }
    setFilterLoading(true);
    const params: Record<string, unknown> = { limit: 1, page: 1 };
    if (filterType) params.vehicleTypeId = filterType;
    if (filterStatus) params.status = filterStatus;
    if (filterRegion) params.region = filterRegion;

    fleetApi.listVehicles(params)
      .then((res) => {
        setFilteredCount(typeof res.total === "number" ? res.total : null);
      })
      .catch(() => setFilteredCount(null))
      .finally(() => setFilterLoading(false));
  }, [filterType, filterStatus]);

  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterRegion("");
  };

  const hasFilter = Boolean(filterType || filterStatus || filterRegion);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("commandCenter.greeting.morning");
    if (h < 17) return t("commandCenter.greeting.afternoon");
    return t("commandCenter.greeting.evening");
  })();

  // ── Skeleton loading state ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className={`h-8 w-64 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        <div className={`h-4 w-80 rounded mb-8 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        <div className={`h-14 rounded-2xl mb-6 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} isDark={isDark} />)}
        </div>
        <div className={`h-52 rounded-2xl animate-pulse mb-6 ${getCardClass(isDark)}`} />
        <div className="grid grid-cols-2 gap-6">
          <div className={`h-44 rounded-2xl animate-pulse ${getCardClass(isDark)}`} />
          <div className={`h-44 rounded-2xl animate-pulse ${getCardClass(isDark)}`} />
        </div>
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <p className={`text-sm ${isDark ? "text-neutral-300" : "text-slate-600"}`}>{error || t("commandCenter.noDataAvailable")}</p>
          <button onClick={() => fetchKPIs(filterRegion)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  const totalAlerts = kpi.alerts.maintenanceAlerts + kpi.alerts.expiringLicenses + kpi.alerts.suspendedDrivers;

  const statusOptions = [
    { value: "AVAILABLE", label: "Available" },
    { value: "ON_TRIP", label: "On Trip" },
    { value: "IN_SHOP", label: "In Shop" },
    { value: "RETIRED", label: "Retired" },
  ];

  const regionOptions = [
    { value: "North", label: t("commandCenter.regions.north") },
    { value: "South", label: t("commandCenter.regions.south") },
    { value: "East", label: t("commandCenter.regions.east") },
    { value: "West", label: t("commandCenter.regions.west") },
    { value: "Central", label: t("commandCenter.regions.central") },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {greeting}, {user?.fullName?.split(" ")[0] ?? t("commandCenter.greeting.fallback")} 👋
          </h1>
          <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            {t("commandCenter.subtitle")}
          </p>
        </div>
        <button
          onClick={() => fetchKPIs(filterRegion)}
          className={`p-2.5 rounded-xl border transition-colors ${
            isDark ? "border-neutral-700 hover:bg-neutral-800 text-neutral-400" : "border-slate-200 hover:bg-slate-100 text-slate-500"
          }`}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className={`flex flex-wrap items-center gap-3 mb-6 p-4 ${getCardClass(isDark)}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
          {t("common.filter")}
        </span>
        <FilterSelect
          label={t("commandCenter.filter.vehicleType")}
          value={filterType}
          onChange={setFilterType}
          options={vehicleTypes.map((t) => ({ value: t.id, label: t.name }))}
          isDark={isDark}
        />
        <FilterSelect
          label={t("commandCenter.filter.status")}
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
          isDark={isDark}
        />
        <FilterSelect
          label={t("commandCenter.filter.region")}
          value={filterRegion}
          onChange={setFilterRegion}
          options={regionOptions}
          isDark={isDark}
        />
        {hasFilter && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark ? "bg-neutral-700 text-neutral-300 hover:bg-neutral-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <X className="w-3 h-3" /> {t("common.clear")}
          </button>
        )}
        {hasFilter && (
          <span className={`ml-auto text-sm font-medium ${isDark ? "text-violet-400" : "text-violet-600"}`}>
            {filterLoading
              ? t("commandCenter.filtering")
              : filteredCount !== null
              ? t("commandCenter.matchCount", { count: filteredCount })
              : ""}
          </span>
        )}
      </div>

      {/* KPI Stat Cards — matching spec exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* 1. Active Fleet — vehicles currently on trip */}
        <StatCard
          icon={Truck}
          iconBg="bg-violet-600"
          label={t("commandCenter.kpi.activeFleet")}
          value={kpi.fleet.onTrip}
          sub={`${kpi.fleet.available} ${t("commandCenter.kpi.available")} · ${kpi.fleet.total} ${t("common.total")}`}
          isDark={isDark}
          onClick={() => navigate("/fleet/vehicles")}
        />
        {/* 2. Maintenance Alerts — vehicles in shop */}
        <StatCard
          icon={Wrench}
          iconBg={kpi.fleet.inShop > 0 ? "bg-amber-600" : "bg-emerald-600"}
          label={t("commandCenter.kpi.maintenanceAlerts")}
          value={kpi.fleet.inShop}
          sub={kpi.fleet.inShop > 0 ? t("commandCenter.kpi.vehiclesInShop") : t("commandCenter.kpi.allOperational")}
          isDark={isDark}
          onClick={() => navigate("/fleet/maintenance")}
        />
        {/* 3. Utilization Rate — % of fleet assigned vs idle */}
        <StatCard
          icon={Gauge}
          iconBg="bg-emerald-600"
          label={t("commandCenter.kpi.utilizationRate")}
          value={kpi.fleet.utilizationRate}
          sub={`${kpi.fleet.onTrip} ${t("commandCenter.kpi.onTrip")} / ${kpi.fleet.total} ${t("common.total")}`}
          isDark={isDark}
        />
        {/* 4. Pending Cargo — shipments waiting for assignment (DRAFT trips) */}
        <StatCard
          icon={Package}
          iconBg={kpi.trips.pending > 0 ? "bg-blue-600" : "bg-emerald-600"}
          label={t("commandCenter.kpi.pendingCargo")}
          value={kpi.trips.pending}
          sub={`${kpi.trips.active} ${t("commandCenter.kpi.activeSuffix")} · ${kpi.trips.completedToday} ${t("commandCenter.kpi.doneToday")}`}
          isDark={isDark}
          onClick={() => navigate("/dispatch/trips")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Fleet Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-2 p-6 ${getCardClass(isDark)}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
              {t("commandCenter.fleetDistribution")}
            </h3>
            {hasFilter && filteredCount !== null && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? "bg-violet-600/20 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                {filteredCount} filtered
              </span>
            )}
          </div>
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
          className={`p-6 ${getCardClass(isDark)}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            {t("commandCenter.attentionRequired")}
          </h3>
          <div className="space-y-2">
            <AlertRow icon={Wrench} color="bg-amber-600" label="Vehicles in maintenance" count={kpi.alerts.maintenanceAlerts} isDark={isDark} />
            <AlertRow icon={Calendar} color="bg-red-600" label="Expiring licenses" count={kpi.alerts.expiringLicenses} isDark={isDark} />
            <AlertRow icon={Shield} color="bg-orange-600" label="Suspended drivers" count={kpi.alerts.suspendedDrivers} isDark={isDark} />
            {totalAlerts === 0 && (
              <div className={`text-center py-6 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                <p className="text-sm">{t("commandCenter.noActiveAlerts")}</p>
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
          className={`p-6 ${getCardClass(isDark)}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            {t("commandCenter.driverSummary")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("commandCenter.driverStats.totalDrivers"), value: kpi.drivers.total, icon: Users, color: "bg-violet-600" },
              { label: t("commandCenter.driverStats.onDuty"), value: kpi.drivers.onDuty, icon: TrendingUp, color: "bg-emerald-600" },
              { label: t("commandCenter.driverStats.suspended"), value: kpi.drivers.suspended, icon: Shield, color: "bg-red-600" },
              { label: t("commandCenter.driverStats.expiringLicenses"), value: kpi.drivers.expiringLicenses, icon: Calendar, color: "bg-amber-600" },
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
          className={`p-6 ${getCardClass(isDark)}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            {t("commandCenter.quickActions")}
          </h3>
          <div className="space-y-2">
            <QuickAction icon={Truck} label={t("commandCenter.actions.vehicleRegistry")} path="/fleet/vehicles" color="bg-violet-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Users} label={t("commandCenter.actions.driverManagement")} path="/hr/drivers" color="bg-blue-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Route} label={t("commandCenter.actions.tripDispatcher")} path="/dispatch/trips" color="bg-emerald-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={Wrench} label={t("commandCenter.actions.maintenance")} path="/fleet/maintenance" color="bg-amber-600" isDark={isDark} navigate={navigate} />
            <QuickAction icon={MapPin} label={t("commandCenter.actions.analytics")} path="/analytics" color="bg-pink-600" isDark={isDark} navigate={navigate} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
