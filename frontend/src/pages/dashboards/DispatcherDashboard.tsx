/**
 * DispatcherDashboard — Live trip dispatch management.
 * All data from backend: real trips + KPI counts.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Route,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { tripsApi, analyticsApi } from "../../api/client";
import type { KpiData } from "../../api/client";

const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const fadeIn = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } } };

type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

interface Trip {
  id: string;
  origin: string;
  destination: string;
  status: TripStatus;
  distancePlanned: number | null;
  scheduledDeparture: string | null;
  driver?: { fullName: string } | null;
  vehicle?: { licensePlate: string } | null;
}

const STATUS_STYLES: Record<TripStatus, string> = {
  DISPATCHED: "bg-blue-100 text-blue-700",
  COMPLETED:  "bg-emerald-100 text-emerald-700",
  DRAFT:      "bg-slate-100 text-slate-600",
  CANCELLED:  "bg-red-100 text-red-600",
};

const STATUS_DOT: Record<TripStatus, string> = {
  DISPATCHED: "bg-blue-500",
  COMPLETED:  "bg-emerald-500",
  DRAFT:      "bg-slate-400",
  CANCELLED:  "bg-red-500",
};

export default function DispatcherDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TripStatus | "ALL">("ALL");

  useEffect(() => {
    Promise.all([
      tripsApi.listTrips({ limit: 20, sortBy: "createdAt", sortOrder: "desc" }),
      analyticsApi.getKpi(),
    ])
      .then(([tripsRes, kpiData]) => {
        const list = (tripsRes.data as { data: { data: Trip[] } }).data?.data ?? [];
        setTrips(list);
        setKpi(kpiData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? trips : trips.filter((t) => t.status === filter);

  const counts = {
    ALL: trips.length,
    DISPATCHED: trips.filter((t) => t.status === "DISPATCHED").length,
    DRAFT: trips.filter((t) => t.status === "DRAFT").length,
    COMPLETED: trips.filter((t) => t.status === "COMPLETED").length,
    CANCELLED: trips.filter((t) => t.status === "CANCELLED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ ROW 1 — KPI Cards ══════════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Active Trips</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Route className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.trips.active ?? 0}</p>
          <p className="text-xs text-slate-400 mt-2">{kpi?.trips.pending ?? 0} drafts pending</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Fleet Available</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.fleet.available ?? 0}</p>
          <p className="text-xs text-slate-400 mt-2">{kpi?.fleet.onTrip ?? 0} on trip</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Drivers On Duty</p>
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.drivers.onDuty ?? 0}</p>
          <p className="text-xs text-slate-400 mt-2">of {kpi?.drivers.total ?? 0} total</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500 font-medium">Completed Today</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{kpi?.trips.completedToday ?? 0}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <p className="text-xs text-emerald-600">Updated live</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ ROW 2 — Trips Table ════════════════════════════════════════ */}
      <motion.div variants={fadeIn} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header + filter tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-bold text-slate-900">Trips</h3>
          <div className="flex gap-1 flex-wrap">
            {(["ALL", "DISPATCHED", "DRAFT", "COMPLETED", "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === s
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                <span className="ml-1.5 text-[10px] opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No trips found. Create trips via the Dispatch page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Trip ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Route</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Driver</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Departure</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Dist (km)</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trip) => (
                  <tr key={trip.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">#{String(trip.id).slice(-6)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[trip.status]}`} />
                        <span className="font-medium text-slate-900">{trip.origin}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-medium text-slate-900">{trip.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{trip.driver?.fullName ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{trip.vehicle?.licensePlate ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {trip.scheduledDeparture
                        ? new Date(trip.scheduledDeparture).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{trip.distancePlanned ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[trip.status]}`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══ ROW 3 — Fleet + Driver Summary ═════════════════════════════ */}
      <motion.div variants={fadeIn} className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-900">Fleet Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Available", value: kpi?.fleet.available ?? 0, color: "bg-emerald-500" },
              { label: "On Trip", value: kpi?.fleet.onTrip ?? 0, color: "bg-blue-500" },
              { label: "In Shop", value: kpi?.fleet.inShop ?? 0, color: "bg-amber-500" },
              { label: "Retired", value: kpi?.fleet.retired ?? 0, color: "bg-slate-300" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-900">Driver Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "On Duty", value: kpi?.drivers.onDuty ?? 0, color: "bg-emerald-500" },
              { label: "Suspended", value: kpi?.drivers.suspended ?? 0, color: "bg-red-500" },
              { label: "License Expiring", value: kpi?.drivers.expiringLicenses ?? 0, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-900">Trip Breakdown</h3>
          </div>
          <div className="space-y-3">
            {(["DISPATCHED", "DRAFT", "COMPLETED", "CANCELLED"] as TripStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s]}`} />
                <span className="text-sm text-slate-600 flex-1 capitalize">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                <span className="text-sm font-bold text-slate-900">{counts[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
