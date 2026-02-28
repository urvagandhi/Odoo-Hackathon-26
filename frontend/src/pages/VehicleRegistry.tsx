/**
 * VehicleRegistry — full CRUD page for fleet vehicles.
 * Status cards, search, filters, DataTable with pagination, create/edit slide-over.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Truck,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  XCircle,
  Download,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { fleetApi, analyticsApi } from "../api/client";
import { useToast } from "../hooks/useToast";
import { StatusPill } from "../components/ui/StatusPill";
import { VehicleForm } from "../components/forms/VehicleForm";
import { VehicleTypeThumbnail } from "../components/ui/VehicleTypePreview";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/AlertDialog";

/* ── Types ──────────────────────────────────────────────── */

interface VehicleType {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  status: string;
  currentOdometer: number;
  capacityWeight: number;
  capacityVolume?: number;
  vehicleTypeId: string;
  vehicleType?: VehicleType;
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ON_TRIP", label: "On Trip" },
  { value: "IN_SHOP", label: "In Shop" },
  { value: "RETIRED", label: "Retired" },
];

export default function VehicleRegistry() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();

  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [searchInput, setSearchInput] = useState("");   // raw input value
  const [search, setSearch] = useState("");             // debounced — sent to API
  const [statusFilter, setStatusFilter] = useState("");

  // Status counts
  const [counts, setCounts] = useState({ AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 });

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  // Action state
  const [actionVehicleId, setActionVehicleId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"retire" | "delete" | null>(null);

  const handleExport = async () => {
    try {
      const csv = await analyticsApi.exportVehiclesCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleetflow-vehicles-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("vehicleRegistry.toast.exportSuccess"), { title: t("vehicleRegistry.toast.exportSuccessTitle") });
    } catch {
      toast.error(t("vehicleRegistry.toast.exportFailed"), { title: t("vehicleRegistry.toast.exportFailedTitle") });
    }
  };

  const canMutate = user?.role === "MANAGER";
  const canDelete = user?.role === "MANAGER";

  /* ── Debounce search input → server-side ──────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Fetch vehicles ──────────────────────────────── */
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await fleetApi.listVehicles(params);

      const vehicleList = (res.data ?? []) as unknown as Record<string, unknown>[];
      // Stringify bigint IDs
      const normalized = vehicleList.map((v) => ({
        ...v,
        id: String(v.id),
        vehicleTypeId: String(v.vehicleTypeId),
        vehicleType: v.vehicleType
          ? { ...(v.vehicleType as Record<string, unknown>), id: String((v.vehicleType as Record<string, unknown>).id) }
          : undefined,
      })) as Vehicle[];

      setVehicles(normalized);
      setTotal(res.total ?? normalized.length);
      setTotalPages(res.totalPages ?? Math.ceil((res.total ?? normalized.length) / limit));
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  /* ── Fetch status counts ──────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const reqs = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"].map((s) =>
          fleetApi.listVehicles({ status: s, page: 1, limit: 1 })
        );
        const results = await Promise.all(reqs);
        const c = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
        const keys = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
        results.forEach((r, i) => {
          c[keys[i]] = r.total ?? 0;
        });
        setCounts(c);
      } catch { /* ignore */ }
    })();
  }, [vehicles]);

  // Server handles search — vehicles array is already filtered
  const filtered = vehicles;

  /* ── Handlers ────────────────────────────────────── */
  const handleEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setFormOpen(true);
  };

  const handleRetire = async () => {
    if (!actionVehicleId) return;
    try {
      await fleetApi.updateVehicleStatus(actionVehicleId, "RETIRED");
      fetchVehicles();
    } catch { /* handled by interceptor */ }
    setActionVehicleId(null);
    setActionType(null);
  };

  const handleDelete = async () => {
    if (!actionVehicleId) return;
    try {
      await fleetApi.deleteVehicle(actionVehicleId);
      fetchVehicles();
    } catch { /* handled by interceptor */ }
    setActionVehicleId(null);
    setActionType(null);
  };

  /* ── Style helpers ───────────────────────────────── */
  const cardBg = isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-neutral-400" : "text-slate-500";
  const inputCls = `px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
    isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  return (
    <section className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold leading-tight ${textPrimary}`}>{t("vehicleRegistry.title")}</h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>{t("vehicleRegistry.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm active:scale-[0.97] ${
              isDark 
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" 
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <Download className="w-4 h-4" />
            {t("vehicleRegistry.exportCSV")}
          </button>
          {canMutate && (
            <button
              onClick={() => { setEditVehicle(null); setFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-500/20 active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              {t("vehicleRegistry.newVehicle")}
            </button>
          )}
        </div>
      </motion.div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: "AVAILABLE", label: "Available", icon: "🟢", color: isDark ? "text-emerald-400" : "text-emerald-600" },
          { key: "ON_TRIP",   label: "On Trip",   icon: "🔵", color: isDark ? "text-blue-400" : "text-blue-600" },
          { key: "IN_SHOP",   label: "In Shop",   icon: "🟠", color: isDark ? "text-amber-400" : "text-amber-600" },
          { key: "RETIRED",   label: "Retired",    icon: "⚫", color: isDark ? "text-neutral-400" : "text-slate-500" },
        ] as const).map((item) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${cardBg} cursor-pointer card-lift`}
            onClick={() => { setStatusFilter(statusFilter === item.key ? "" : item.key); setPage(1); }}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{item.icon}</span>
              {statusFilter === item.key && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Active</span>
              )}
            </div>
            <p className={`text-2xl font-bold mt-2 tabular-nums ${item.color}`}>
              {counts[item.key]}
            </p>
            <p className={`text-xs mt-0.5 ${textSecondary}`}>{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
          <input
            className={`${inputCls} pl-9 w-full`}
            placeholder={t("common.search")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-neutral-500" : "text-slate-400"}`} />
          <select
            className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* DataTable */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-200 bg-slate-50"}`}>
                {[t("vehicleRegistry.columns.number"), t("vehicleRegistry.columns.plate"), t("vehicleRegistry.columns.makeModel"), t("vehicleRegistry.columns.type"), t("vehicleRegistry.columns.capacity"), t("vehicleRegistry.columns.odometer"), t("vehicleRegistry.columns.status"), t("vehicleRegistry.columns.actions")].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={`border-b last:border-0 ${isDark ? "border-neutral-700" : "border-slate-100"}`}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 rounded ${isDark ? "bg-neutral-700" : "bg-slate-100"} animate-pulse`}
                          style={{ width: `${50 + (j % 3) * 20}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Truck className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-neutral-600" : "text-slate-300"}`} />
                    <p className={`text-sm font-medium ${textPrimary}`}>{t("vehicleRegistry.noVehicles")}</p>
                    <p className={`text-xs mt-1 ${textSecondary}`}>
                      {searchInput || statusFilter ? t("vehicleRegistry.adjustFilters") : t("vehicleRegistry.addFirstVehicle")}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((v, idx) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b last:border-0 transition-colors duration-100 ${
                      isDark ? "border-neutral-700 hover:bg-neutral-700/50" : "border-slate-100 hover:bg-slate-50"
                    } ${v.status === "RETIRED" ? "opacity-60" : ""}`}
                  >
                    <td className={`px-4 py-3 ${textSecondary}`}>{(page - 1) * limit + idx + 1}</td>
                    <td className={`px-4 py-3 font-mono font-semibold text-xs ${textPrimary}`}>{v.licensePlate}</td>
                    <td className={`px-4 py-3 ${textPrimary}`}>
                      {v.make} {v.model}
                      <span className={`block text-xs ${textSecondary}`}>{v.year}</span>
                    </td>
                    <td className={`px-4 py-3 ${textSecondary}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <VehicleTypeThumbnail typeName={v.vehicleType?.name ?? ""} />
                        {v.vehicleType?.name ?? "—"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${textPrimary}`}>
                      {v.capacityWeight.toLocaleString()} kg
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${textSecondary}`}>
                      {v.currentOdometer.toLocaleString()} km
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={v.status} type="vehicle" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canMutate && v.status !== "RETIRED" && (
                          <button
                            onClick={() => handleEdit(v)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? "hover:bg-neutral-600 text-neutral-400" : "hover:bg-slate-100 text-slate-400"
                            }`}
                            title={t("vehicleRegistry.editTooltip")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canMutate && v.status === "AVAILABLE" && (
                          <AlertDialog
                            open={actionType === "retire" && actionVehicleId === v.id}
                            onOpenChange={(open) => {
                              if (!open) { setActionType(null); setActionVehicleId(null); }
                            }}
                          >
                              <button
                                onClick={() => { setActionVehicleId(v.id); setActionType("retire"); }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? "hover:bg-amber-900/30 text-amber-400" : "hover:bg-amber-50 text-amber-600"
                                }`}
                                title={t("vehicleRegistry.retireTooltip")}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("vehicleRegistry.retireDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("vehicleRegistry.retireDialog.description", { plate: v.licensePlate })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={handleRetire}>
                                  {t("vehicleRegistry.retireDialog.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {canDelete && (
                          <AlertDialog
                            open={actionType === "delete" && actionVehicleId === v.id}
                            onOpenChange={(open) => {
                              if (!open) { setActionType(null); setActionVehicleId(null); }
                            }}
                          >
                              <button
                                onClick={() => { setActionVehicleId(v.id); setActionType("delete"); }}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-500"
                                }`}
                                title={t("vehicleRegistry.deleteTooltip")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("vehicleRegistry.deleteDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("vehicleRegistry.deleteDialog.description", { plate: v.licensePlate })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                                  {t("vehicleRegistry.deleteDialog.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
              isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="contents">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className={`px-1 ${textSecondary}`}>…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-violet-600 text-white"
                      : isDark
                        ? "text-neutral-400 hover:bg-neutral-700"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
              isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className={`text-xs ml-2 ${textSecondary}`}>
            {t("vehicleRegistry.pagination.total", { count: total })}
          </span>
        </div>
      )}

      {/* Vehicle Form Slide-over */}
      <VehicleForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(null); }}
        onSuccess={fetchVehicles}
        editData={editVehicle}
      />
    </section>
  );
}
