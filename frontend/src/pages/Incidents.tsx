/**
 * Incidents — Full CRUD for safety incident reports.
 * Backend: /api/v1/incidents (MANAGER, SAFETY_OFFICER)
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { incidentsApi } from "../api/client";
import { DataTable, type Column } from "../components/ui/DataTable";
import { Select } from "../components/ui/Select";

/* ── Types ──────────────────────────────────────────────── */
interface Incident {
  id: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  vehicle?: { id: string; licensePlate: string; make: string; model: string };
  driver?: { id: string; fullName: string; licenseNumber: string };
  trip?: { id: string; origin: string; destination: string; status: string };
  incidentType: string;
  title: string;
  description: string;
  incidentDate: string;
  location?: string;
  injuriesReported: boolean;
  damageEstimate?: number;
  status: string;
  resolution?: string;
  createdAt: string;
}

const INCIDENT_TYPES = [
  "ACCIDENT",
  "BREAKDOWN",
  "TRAFFIC_VIOLATION",
  "THEFT",
  "CARGO_DAMAGE",
  "NEAR_MISS",
  "OTHER",
] as const;

const STATUS_OPTIONS = ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const;

const statusColor: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  INVESTIGATING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RESOLVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CLOSED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Incidents() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [closeModal, setCloseModal] = useState<Incident | null>(null);
  const [resolution, setResolution] = useState("");
  const limit = 15;

  const canCreate = user?.role === "SAFETY_OFFICER";
  const canClose =
    user?.role === "MANAGER" ||
    user?.role === "SAFETY_OFFICER";

  /* ── Fetch ────────────────────────────────────────── */
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await incidentsApi.listIncidents(params);
      const body = res as Record<string, unknown>;
      const rawList = Array.isArray(body?.incidents) ? body.incidents : Array.isArray(res) ? res : [];
      const list = rawList as Record<string, unknown>[];
      setIncidents(
        list.map((i) => ({
          ...i,
          id: String(i.id),
          vehicleId: i.vehicleId ? String(i.vehicleId) : undefined,
          driverId: i.driverId ? String(i.driverId) : undefined,
          tripId: i.tripId ? String(i.tripId) : undefined,
        })) as Incident[]
      );
      setTotalPages(Number(body?.totalPages) || 1);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  /* ── Close Incident ──────────────────────────────── */
  const handleClose = async () => {
    if (!closeModal || resolution.length < 10) return;
    try {
      await incidentsApi.closeIncident(closeModal.id, resolution);
      setCloseModal(null);
      setResolution("");
      fetchIncidents();
    } catch {
      /* toast would go here */
    }
  };

  /* ── Client-side search ──────────────────────────── */
  const q = search.toLowerCase();
  const filtered = incidents.filter(
    (i) =>
      !q ||
      i.title.toLowerCase().includes(q) ||
      i.incidentType.toLowerCase().includes(q) ||
      i.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      i.driver?.fullName?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q)
  );

  /* ── Summary stats ───────────────────────────────── */
  const openCount = incidents.filter((i) => i.status === "OPEN").length;
  const investigatingCount = incidents.filter((i) => i.status === "INVESTIGATING").length;
  const totalDamage = incidents.reduce((s, i) => s + Number(i.damageEstimate || 0), 0);

  /* ── Columns ─────────────────────────────────────── */
  const columns: Column<Incident>[] = [
    {
      key: "title",
      header: t("incidents.columns.incident"),
      render: (i) => (
        <div>
          <span className="font-medium">{i.title}</span>
          {i.injuriesReported && (
            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
              {t("incidents.injuries")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: t("incidents.columns.type"),
      render: (i) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-700"
          }`}
        >
          {i.incidentType.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: t("incidents.columns.status"),
      render: (i) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[i.status] || ""}`}>
          {i.status}
        </span>
      ),
    },
    {
      key: "vehicle",
      header: t("incidents.columns.vehicle"),
      render: (i) => i.vehicle?.licensePlate ?? "—",
    },
    {
      key: "driver",
      header: t("incidents.columns.driver"),
      render: (i) => i.driver?.fullName ?? "—",
    },
    {
      key: "damage",
      header: t("incidents.columns.damageEst"),
      render: (i) =>
        i.damageEstimate ? (
          <span className="font-mono">₹{Number(i.damageEstimate).toLocaleString()}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "date",
      header: t("incidents.columns.date"),
      render: (i) => new Date(i.incidentDate).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (i) =>
        canClose && i.status !== "CLOSED" ? (
          <button
            onClick={() => setCloseModal(i)}
            className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            {t("incidents.closeButton")}
          </button>
        ) : null,
    },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {t("incidents.title")}
            </h1>
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              {t("incidents.subtitle")}
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("incidents.reportIncident")}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("incidents.summary.total"), value: incidents.length, color: "bg-violet-600" },
          { label: t("incidents.summary.open"), value: openCount, color: "bg-red-600" },
          { label: t("incidents.summary.investigating"), value: investigatingCount, color: "bg-amber-600" },
          { label: t("incidents.summary.damageEst"), value: `₹${totalDamage.toLocaleString()}`, color: "bg-emerald-600" },
        ].map((s) => (
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-64 ${
            isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <Search className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          <input
            className="bg-transparent outline-none w-full placeholder-current opacity-60"
            placeholder={t("incidents.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
            isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <option value="">{t("incidents.allStatuses")}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(i) => i.id}
        loading={loading}
        emptyTitle={t("incidents.noIncidents")}
        emptyMessage={t("incidents.noIncidentsDesc")}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
            {t("common.page")} {page} {t("common.of")} {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Close Incident Modal ───────────────────── */}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${isDark ? "bg-neutral-800" : "bg-white"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("incidents.closeModal.title")}
              </h3>
              <button onClick={() => setCloseModal(null)}>
                <X className={`w-5 h-5 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
              </button>
            </div>
            <p className={`text-sm mb-3 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              {t("incidents.closeModal.closing")} <strong>{closeModal.title}</strong>
            </p>
            <textarea
              rows={4}
              placeholder={t("incidents.closeModal.placeholder")}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                isDark ? "bg-neutral-700 border-neutral-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCloseModal(null)}
                className={`px-4 py-2 rounded-lg text-sm ${isDark ? "text-neutral-400 hover:bg-neutral-700" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={resolution.length < 10}
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t("incidents.closeModal.confirm")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Create Incident Modal ──────────────────── */}
      {formOpen && (
        <IncidentFormModal
          isDark={isDark}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            fetchIncidents();
          }}
        />
      )}
    </div>
  );
}

/* ── Inline Create Form ──────────────────────────────── */
function IncidentFormModal({
  isDark,
  onClose,
  onSuccess,
}: {
  isDark: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    description: "",
    incidentType: "ACCIDENT" as string,
    incidentDate: new Date().toISOString().slice(0, 16),
    location: "",
    injuriesReported: false,
    damageEstimate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await incidentsApi.createIncident({
        title: form.title,
        description: form.description,
        incidentType: form.incidentType,
        incidentDate: new Date(form.incidentDate).toISOString(),
        location: form.location || undefined,
        injuriesReported: form.injuriesReported,
        damageEstimate: form.damageEstimate ? Number(form.damageEstimate) : undefined,
      });
      onSuccess();
    } catch {
      /* error handling */
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDark ? "bg-neutral-700 border-neutral-600 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? "bg-neutral-800" : "bg-white"}`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {t("incidents.createModal.title")}
          </h3>
          <button onClick={onClose}>
            <X className={`w-5 h-5 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
              {t("incidents.createModal.titleField")}
            </label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("incidents.createModal.titlePlaceholder")} />
          </div>

          {/* Type + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t("incidents.createModal.type")}
              </label>
              <select className={inputCls} value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })}>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t("incidents.createModal.date")}
              </label>
              <input type="datetime-local" className={inputCls} value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
              {t("incidents.createModal.description")}
            </label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("incidents.createModal.descriptionPlaceholder")} />
          </div>

          {/* Location + Damage row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t("incidents.createModal.location")}
              </label>
              <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("incidents.createModal.locationPlaceholder")} />
            </div>
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                {t("incidents.createModal.damageEstimate")}
              </label>
              <input type="number" min="0" className={inputCls} value={form.damageEstimate} onChange={(e) => setForm({ ...form, damageEstimate: e.target.value })} />
            </div>
          </div>

          {/* Injuries checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.injuriesReported} onChange={(e) => setForm({ ...form, injuriesReported: e.target.checked })} className="rounded" />
            <span className={`text-sm ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
              {t("incidents.createModal.injuriesReported")}
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm ${isDark ? "text-neutral-400 hover:bg-neutral-700" : "text-slate-500 hover:bg-slate-100"}`}>
            {t("common.cancel")}
          </button>
          <button
            disabled={submitting || form.title.length < 3 || form.description.length < 10}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {submitting ? t("common.saving") : t("incidents.createModal.submitReport")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
