/**
 * DriverPerformance — Visualizes per-driver safety scores and trip metrics.
 * Backend: GET /api/v1/analytics/driver-performance (MANAGER, SAFETY_OFFICER)
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Search, TrendingUp, AlertTriangle, Truck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi } from "../api/client";

/* ── Types ──────────────────────────────────────────────── */
interface DriverPerf {
  driverId: string;
  fullName: string;
  licenseNumber: string;
  totalTrips: number;
  completedTrips: number;
  incidentCount: number;
  safetyScore: number;
  avgTripDurationHrs?: number;
}

export default function DriverPerformance() {
  const { isDark } = useTheme();
  const [drivers, setDrivers] = useState<DriverPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.getDriverPerformance();
        const list = (Array.isArray(res) ? res : []) as Record<string, unknown>[];
        setDrivers(
          list.map((d) => ({
            ...d,
            driverId: String(d.driverId ?? d.id),
          })) as DriverPerf[]
        );
      } catch {
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const q = search.toLowerCase();
  const filtered = drivers.filter(
    (d) =>
      !q ||
      d.fullName?.toLowerCase().includes(q) ||
      d.licenseNumber?.toLowerCase().includes(q)
  );

  /* ── Aggregate stats ─────────────────────────────── */
  const avgScore =
    drivers.length > 0
      ? (drivers.reduce((s, d) => s + (d.safetyScore ?? 0), 0) / drivers.length).toFixed(1)
      : "—";
  const totalIncidents = drivers.reduce((s, d) => s + (d.incidentCount ?? 0), 0);
  const totalTrips = drivers.reduce((s, d) => s + (d.totalTrips ?? 0), 0);

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const scoreBar = (score: number) => {
    const pct = Math.min(100, Math.max(0, score));
    let bg = "bg-emerald-500";
    if (pct < 70) bg = "bg-red-500";
    else if (pct < 90) bg = "bg-amber-500";
    return { pct, bg };
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Driver Performance
          </h1>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            Safety scores and trip metrics per driver
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Drivers", value: drivers.length, icon: Truck, color: "bg-violet-600" },
          { label: "Avg Safety Score", value: avgScore, icon: TrendingUp, color: "bg-emerald-600" },
          { label: "Total Trips", value: totalTrips, icon: BarChart3, color: "bg-blue-600" },
          { label: "Total Incidents", value: totalIncidents, icon: AlertTriangle, color: "bg-red-600" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
          >
            <s.icon className={`w-5 h-5 mb-2 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-64 ${
            isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <Search className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          <input
            className="bg-transparent outline-none w-full placeholder-current opacity-60"
            placeholder="Search drivers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Driver cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-neutral-600" : "text-slate-300"}`} />
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>No driver performance data yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const bar = scoreBar(d.safetyScore ?? 0);
            return (
              <motion.div
                key={d.driverId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{d.fullName}</p>
                    <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>{d.licenseNumber}</p>
                  </div>
                  <span className={`text-2xl font-bold ${scoreColor(d.safetyScore ?? 0)}`}>
                    {d.safetyScore ?? 0}
                  </span>
                </div>

                {/* Score bar */}
                <div className={`w-full h-2 rounded-full mb-3 ${isDark ? "bg-neutral-700" : "bg-slate-100"}`}>
                  <div className={`h-2 rounded-full transition-all ${bar.bg}`} style={{ width: `${bar.pct}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{d.totalTrips}</p>
                    <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Trips</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{d.completedTrips}</p>
                    <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Completed</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${d.incidentCount > 0 ? "text-red-500" : isDark ? "text-white" : "text-slate-900"}`}>
                      {d.incidentCount}
                    </p>
                    <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Incidents</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
