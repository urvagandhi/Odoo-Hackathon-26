/**
 * TripDispatcher — Phase 3 full CRUD page for trip management.
 *
 * Features:
 * - Status summary cards (DRAFT / DISPATCHED / COMPLETED / CANCELLED)
 * - Search + status filter toolbar
 * - DataTable with trip info, cargo, status, actions
 * - Actions vary by trip status:
 *   • DRAFT → Edit (TripForm), Dispatch, Cancel
 *   • DISPATCHED → Complete, Cancel, View Ledger
 *   • COMPLETED → View Ledger
 *   • CANCELLED → (read-only)
 * - TripForm slide-over (create new trip)
 * - TripCompleteModal, TripCancelDialog, TripLedgerDrawer
 * - Pagination, dark mode, role-based access
 */
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Send,
  CheckCircle2,
  XCircle,
  FileEdit,
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { dispatchApi } from "../api/client";
import { useToast } from "../hooks/useToast";
import { StatusPill } from "../components/ui/StatusPill";
import { DataTable } from "../components/ui/DataTable";
import { TripForm } from "../components/forms/TripForm";
import { TripCompleteModal } from "../components/forms/TripCompleteModal";
import { TripCancelDialog } from "../components/forms/TripCancelDialog";
import { TripLedgerDrawer } from "../components/forms/TripLedgerDrawer";
import { AnimatePresence, motion } from "framer-motion";

/* ─── Types ─── */
interface Trip {
  id: string;
  vehicle?: { id: string; licensePlate: string; make: string; model: string };
  driver?: { id: string; fullName: string };
  origin: string;
  destination: string;
  distanceEstimated: number;
  distanceActual?: number;
  cargoWeight: number;
  cargoDescription?: string;
  clientName?: string;
  revenue?: number;
  status: string;
  dispatchTime?: string;
  completionTime?: string;
  cancelledReason?: string;
  createdAt: string;
}

type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_COLORS: Record<TripStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT: {
    bg: "bg-slate-100 dark:bg-neutral-700",
    text: "text-slate-600 dark:text-neutral-300",
    icon: <FileEdit className="w-5 h-5" />,
  },
  DISPATCHED: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: <Send className="w-5 h-5" />,
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  CANCELLED: {
    bg: "bg-red-50 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    icon: <XCircle className="w-5 h-5" />,
  },
};

/* ─── Component ─── */
export default function TripDispatcher() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role ?? "";

  // Permissions
  const canCreate = ["MANAGER", "DISPATCHER"].includes(role);
  const canDispatch = ["MANAGER", "DISPATCHER"].includes(role);
  const canViewLedger = ["MANAGER", "FINANCE_ANALYST"].includes(role);

  // Data
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ DRAFT: 0, DISPATCHED: 0, COMPLETED: 0, CANCELLED: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [completeTrip, setCompleteTrip] = useState<string | null>(null);
  const [cancelTrip, setCancelTrip] = useState<string | null>(null);
  const [ledgerTrip, setLedgerTrip] = useState<string | null>(null);

  // Dispatch confirm dialog
  const [dispatchDialog, setDispatchDialog] = useState<{ open: boolean; trip: Trip | null }>({
    open: false,
    trip: null,
  });
  const [dispatching, setDispatching] = useState(false);

  // Theme helpers
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-neutral-400" : "text-slate-500";
  const cardBg = isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200";
  const surfaceBg = isDark ? "bg-neutral-900" : "bg-slate-50";

  /* ─── Fetch ─── */
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await dispatchApi.listTrips(params);
      const list = (res.data ?? []) as unknown as Record<string, unknown>[];

      const normalised = list.map((t) => ({
        ...t,
        id: String(t.id),
        distanceEstimated: Number(t.distanceEstimated),
        distanceActual: t.distanceActual != null ? Number(t.distanceActual) : undefined,
        cargoWeight: Number(t.cargoWeight),
        revenue: t.revenue != null ? Number(t.revenue) : undefined,
        vehicle: t.vehicle
          ? { ...(t.vehicle as Record<string, unknown>), id: String((t.vehicle as Record<string, unknown>).id) }
          : undefined,
        driver: t.driver
          ? { ...(t.driver as Record<string, unknown>), id: String((t.driver as Record<string, unknown>).id) }
          : undefined,
      })) as Trip[];

      setTrips(normalised);
      setTotalPages(res.totalPages ?? 1);

      // Aggregate counts from all trips (fetch without pagination for counts)
      if (page === 1) {
        const allRes = await dispatchApi.listTrips({ limit: 10000 });
        const all = (allRes.data ?? []) as unknown as Trip[];
        const c = { DRAFT: 0, DISPATCHED: 0, COMPLETED: 0, CANCELLED: 0 };
        all.forEach((t) => {
          if (t.status in c) c[t.status as TripStatus]++;
        });
        setCounts(c);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  /* ─── Dispatch action ─── */
  const handleDispatch = async (trip: Trip) => {
    setDispatching(true);
    try {
      await dispatchApi.transitionStatus(trip.id, { status: "DISPATCHED" });
      setDispatchDialog({ open: false, trip: null });
      toast.success("Trip has been dispatched successfully.", { title: "Dispatched" });
      fetchTrips();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? "Failed to dispatch trip", { title: "Error" });
    } finally {
      setDispatching(false);
    }
  };

  /* ─── Filtered trips ─── */
  const filtered = trips.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.origin.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      t.driver?.fullName?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      false
    );
  });

  /* ─── Table columns ─── */
  const columns = [
    {
      key: "id" as const,
      header: "#",
      render: (row: Trip) => {
        const idx = filtered.indexOf(row);
        return (
          <span className={`text-xs tabular-nums ${textSecondary}`}>{(page - 1) * 10 + idx + 1}</span>
        );
      },
    },
    {
      key: "vehicle" as const,
      header: "Vehicle",
      render: (row: Trip) =>
        row.vehicle ? (
          <div>
            <p className={`text-sm font-medium ${textPrimary}`}>{row.vehicle.licensePlate}</p>
            <p className={`text-xs ${textSecondary}`}>{row.vehicle.make} {row.vehicle.model}</p>
          </div>
        ) : (
          <span className={`text-xs ${textSecondary}`}>—</span>
        ),
    },
    {
      key: "driver" as const,
      header: "Driver",
      render: (row: Trip) =>
        row.driver ? (
          <span className={`text-sm ${textPrimary}`}>{row.driver.fullName}</span>
        ) : (
          <span className={`text-xs ${textSecondary}`}>—</span>
        ),
    },
    {
      key: "origin" as const,
      header: "Route",
      render: (row: Trip) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className={textPrimary}>{row.origin}</span>
          <span className={textSecondary}>→</span>
          <span className={textPrimary}>{row.destination}</span>
        </div>
      ),
    },
    {
      key: "cargoWeight" as const,
      header: "Cargo",
      render: (row: Trip) => (
        <div>
          <p className={`text-sm font-medium tabular-nums ${textPrimary}`}>{row.cargoWeight.toLocaleString()} kg</p>
          {row.cargoDescription && (
            <p className={`text-xs truncate max-w-[120px] ${textSecondary}`}>{row.cargoDescription}</p>
          )}
        </div>
      ),
    },
    {
      key: "distanceEstimated" as const,
      header: "Distance",
      render: (row: Trip) => (
        <div className="text-sm tabular-nums">
          <span className={textPrimary}>{row.distanceEstimated.toLocaleString()} km</span>
          {row.distanceActual != null && (
            <span className={`text-xs ml-1 ${textSecondary}`}>(actual: {row.distanceActual.toLocaleString()})</span>
          )}
        </div>
      ),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (row: Trip) => <StatusPill status={row.status} type="trip" />,
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (row: Trip) => {
        const st = row.status as TripStatus;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* DRAFT actions */}
            {st === "DRAFT" && canDispatch && (
              <>
                <button
                  onClick={() => setDispatchDialog({ open: true, trip: row })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  <Send className="w-3 h-3" /> Dispatch
                </button>
                <button
                  onClick={() => setCancelTrip(row.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isDark ? "text-red-400 hover:bg-neutral-700" : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  Cancel
                </button>
              </>
            )}

            {/* DISPATCHED actions */}
            {st === "DISPATCHED" && canDispatch && (
              <>
                <button
                  onClick={() => setCompleteTrip(row.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" /> Complete
                </button>
                <button
                  onClick={() => setCancelTrip(row.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isDark ? "text-red-400 hover:bg-neutral-700" : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  Cancel
                </button>
              </>
            )}

            {/* Ledger for DISPATCHED + COMPLETED */}
            {(st === "DISPATCHED" || st === "COMPLETED") && canViewLedger && (
              <button
                onClick={() => setLedgerTrip(row.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isDark ? "text-violet-400 hover:bg-neutral-700" : "text-violet-600 hover:bg-violet-50"
                }`}
              >
                <BarChart3 className="w-3 h-3" /> Ledger
              </button>
            )}

            {/* CANCELLED info */}
            {st === "CANCELLED" && row.cancelledReason && (
              <span className={`text-xs italic max-w-[140px] truncate ${textSecondary}`} title={row.cancelledReason}>
                "{row.cancelledReason}"
              </span>
            )}
          </div>
        );
      },
    },
  ];

  /* ─── Render ─── */
  return (
    <div className={`min-h-full ${surfaceBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>Trip Dispatcher</h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>Plan, dispatch, and track fleet trips</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </button>
          )}
        </div>

        {/* ── Status Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as TripStatus[]).map((st) => {
            const s = STATUS_COLORS[st];
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(active ? "" : st);
                  setPage(1);
                }}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "ring-2 ring-violet-500 border-violet-400"
                    : isDark
                    ? "border-neutral-700 hover:border-neutral-600"
                    : "border-slate-200 hover:border-slate-300"
                } ${isDark ? "bg-neutral-800" : "bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} ${s.text}`}>
                    {s.icon}
                  </div>
                  <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{counts[st]}</span>
                </div>
                <p className={`text-xs font-medium mt-2 capitalize ${textSecondary}`}>{st.toLowerCase()}</p>
              </button>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${cardBg}`}>
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
            <input
              type="text"
              placeholder="Search trips (route, vehicle, driver, client)..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                isDark
                  ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? "bg-neutral-700 border-neutral-600 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className={`w-6 h-6 mx-auto animate-spin ${textSecondary}`} />
              <p className={`text-sm mt-2 ${textSecondary}`}>Loading trips...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Navigation className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-neutral-600" : "text-slate-300"}`} />
              <p className={`text-sm font-medium ${textPrimary}`}>No trips found</p>
              <p className={`text-xs mt-1 ${textSecondary}`}>
                {searchQuery || statusFilter ? "Try adjusting your filters" : "Create your first trip to get started"}
              </p>
            </div>
          ) : (
            <DataTable rows={filtered} columns={columns} rowKey={(r) => r.id} />
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textSecondary}`}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${
                  isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${
                  isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals / Drawers ── */}
      <TripForm open={showForm} onClose={() => setShowForm(false)} onSuccess={fetchTrips} />

      <TripCompleteModal
        open={completeTrip !== null}
        tripId={completeTrip}
        onClose={() => setCompleteTrip(null)}
        onSuccess={fetchTrips}
      />

      <TripCancelDialog
        open={cancelTrip !== null}
        tripId={cancelTrip}
        onClose={() => setCancelTrip(null)}
        onSuccess={fetchTrips}
      />

      <TripLedgerDrawer
        open={ledgerTrip !== null}
        tripId={ledgerTrip}
        onClose={() => setLedgerTrip(null)}
      />

      {/* Dispatch confirmation dialog */}
      <AnimatePresence>
        {dispatchDialog.open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] bg-black/40"
              onClick={() => setDispatchDialog({ open: false, trip: null })}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed z-[9991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl p-6 ${
                isDark ? "bg-neutral-800 border border-neutral-700" : "bg-white border border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-blue-500" />
                <h3 className={`text-base font-bold ${textPrimary}`}>Dispatch Trip?</h3>
              </div>
              <p className={`text-sm mb-5 ${textSecondary}`}>
                {dispatchDialog.trip
                  ? `Dispatch ${dispatchDialog.trip.origin} → ${dispatchDialog.trip.destination}? Vehicle will be marked ON_TRIP and driver will be assigned.`
                  : ""}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDispatchDialog({ open: false, trip: null })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (dispatchDialog.trip) handleDispatch(dispatchDialog.trip); }}
                  disabled={dispatching}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
                >
                  {dispatching ? "Dispatching..." : "Dispatch Now"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
