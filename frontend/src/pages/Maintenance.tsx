/**
 * Maintenance — CRUD page for vehicle service / maintenance logs.
 * Search, status filter, DataTable with pagination, create form, close action.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { financeApi } from "../api/client";
import { DataTable, type Column } from "../components/ui/DataTable";
import { StatusPill } from "../components/ui/StatusPill";
import { MaintenanceForm } from "../components/forms/MaintenanceForm";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/AlertDialog";

/* ── Types ──────────────────────────────────────────────── */
interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle?: { id: string; licensePlate: string; make: string; model: string; status: string };
  serviceType: string;
  description?: string;
  cost: number;
  odometerAtService: number;
  technicianName?: string;
  shopName?: string;
  serviceDate: string;
  nextServiceDue?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open (In-Shop)" },
  { value: "closed", label: "Closed" },
];

export default function Maintenance() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const canMutate = user?.role === "SUPER_ADMIN" || user?.role === "MANAGER" || user?.role === "SAFETY_OFFICER";

  /* ── Fetch ──────────────────────────────────────── */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeApi.listMaintenanceLogs();
      const body = res.data?.data ?? res.data;
      const list = (body?.maintenanceLogs ?? body ?? []) as MaintenanceLog[];
      const normalized = list.map((l: Record<string, unknown>) => ({
        ...l,
        id: String(l.id),
        vehicleId: String(l.vehicleId),
        vehicle: l.vehicle
          ? { ...(l.vehicle as Record<string, unknown>), id: String((l.vehicle as Record<string, unknown>).id) }
          : undefined,
      })) as MaintenanceLog[];
      setLogs(normalized);
      setTotal(normalized.length);
      setTotalPages(Math.ceil(normalized.length / limit));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* ── Close service ──────────────────────────────── */
  const handleClose = async (id: string) => {
    try {
      await financeApi.closeMaintenanceLog(id);
      toast.success("Service closed — vehicle is now AVAILABLE.");
      fetchLogs();
    } catch {
      toast.error("Failed to close service log.");
    } finally {
      setClosingId(null);
    }
  };

  /* ── Client-side filters ────────────────────────── */
  const filtered = logs.filter((l) => {
    // Search
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      l.serviceType.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.technicianName?.toLowerCase().includes(q) ||
      l.shopName?.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === "open") return l.vehicle?.status === "IN_SHOP";
    if (statusFilter === "closed") return l.vehicle?.status !== "IN_SHOP";

    return true;
  });

  const paginated = filtered.slice((page - 1) * limit, page * limit);
  const openCount = logs.filter((l) => l.vehicle?.status === "IN_SHOP").length;
  const closedCount = logs.length - openCount;

  /* ── Status cards ────────────────────────────────── */
  const statCards = [
    { label: "Total Logs", value: logs.length, color: "bg-violet-600" },
    { label: "Open (In-Shop)", value: openCount, color: "bg-amber-600" },
    { label: "Closed", value: closedCount, color: "bg-emerald-600" },
  ];

  /* ── Columns ─────────────────────────────────────── */
  const columns: Column<MaintenanceLog>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (l) => (
        <span className="font-medium">{l.vehicle?.licensePlate ?? `#${l.vehicleId}`}</span>
      ),
    },
    {
      key: "serviceType",
      header: "Service Type",
      render: (l) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-700"}`}>
          {l.serviceType.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (l) => <span className="truncate max-w-[200px] block">{l.description || "—"}</span>,
    },
    {
      key: "serviceDate",
      header: "Service Date",
      render: (l) => new Date(l.serviceDate).toLocaleDateString(),
    },
    {
      key: "cost",
      header: "Cost",
      render: (l) => <span className="font-mono">₹{Number(l.cost).toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (l) => {
        const isOpen = l.vehicle?.status === "IN_SHOP";
        return <StatusPill status={isOpen ? "IN_SHOP" : "COMPLETED"} />;
      },
    },
    ...(canMutate
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (l: MaintenanceLog) => {
              const isOpen = l.vehicle?.status === "IN_SHOP";
              if (!isOpen) return <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>Done</span>;
              return (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      onClick={() => setClosingId(l.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Close Service
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Service Log?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the service as completed and set the vehicle back to <strong>AVAILABLE</strong>. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClose(l.id)}>
                        Yes, Close Service
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            },
          } as Column<MaintenanceLog>,
        ]
      : []),
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Maintenance</h1>
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              {total} service log{total !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        {canMutate && (
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Service Log
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
          >
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm flex-1 min-w-[200px] max-w-md ${
          isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <Search className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          <input
            className="bg-transparent outline-none w-full placeholder-current opacity-60"
            placeholder="Search by vehicle, type, technician..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
          isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200"
        }`}>
          <Filter className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          <select className="bg-transparent outline-none text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={paginated}
        rowKey={(l) => l.id}
        loading={loading}
        emptyTitle="No maintenance logs"
        emptyMessage="Create your first service log to start tracking."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
            Page {page} of {totalPages} · {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      <MaintenanceForm open={formOpen} onClose={() => setFormOpen(false)} onSuccess={fetchLogs} />
    </div>
  );
}
