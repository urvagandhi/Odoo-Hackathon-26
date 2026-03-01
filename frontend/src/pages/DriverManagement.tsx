/**
 * DriverManagement — full CRUD page for fleet drivers.
 * Status cards, search, filters, DataTable with license expiry badges,
 * safety score bars, duty toggle, suspend, adjust score, soft delete.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  ShieldAlert,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { hrApi } from "../api/client";
import { StatusPill } from "../components/ui/StatusPill";
import { LicenseExpiryBadge } from "../components/ui/LicenseExpiryBadge";
import { SafetyScoreBar } from "../components/ui/SafetyScoreBar";
import { DriverForm } from "../components/forms/DriverForm";
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

interface Driver {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseClass?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  status: string;
  safetyScore: number;
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: "", labelKey: "driverManagement.allStatuses" },
  { value: "ON_DUTY", labelKey: "driverManagement.statusCards.onDuty" },
  { value: "ON_TRIP", labelKey: "driverManagement.statusCards.onTrip" },
  { value: "OFF_DUTY", labelKey: "driverManagement.statusCards.offDuty" },
  { value: "SUSPENDED", labelKey: "driverManagement.statusCards.suspended" },
];

const EXPIRY_FILTERS = [
  { value: "", labelKey: "driverManagement.allLicenses" },
  { value: "expiring", labelKey: "driverManagement.expiringSoon" },
  { value: "expired", labelKey: "driverManagement.expired" },
];

export default function DriverManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Data state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");

  // Status counts
  const [counts, setCounts] = useState({ ON_DUTY: 0, ON_TRIP: 0, OFF_DUTY: 0, SUSPENDED: 0 });

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  // Action states
  const [suspendDriverId, setSuspendDriverId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);

  // Safety score adjustment
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreDriverId, setScoreDriverId] = useState<string | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState(0);
  const [scoreReason, setScoreReason] = useState("");
  const [scoreSubmitting, setScoreSubmitting] = useState(false);

  // Expiring licenses alert
  const [expiringDrivers, setExpiringDrivers] = useState<Driver[]>([]);

  const canMutate = user?.role === "MANAGER";
  const canSuspend = user?.role === "MANAGER" || user?.role === "SAFETY_OFFICER";
  const canAdjustScore = user?.role === "SAFETY_OFFICER";
  const canDelete = user?.role === "MANAGER";

  /* ── Fetch drivers ──────────────────────────────── */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (statusFilter) params.status = statusFilter;

      const res = await hrApi.listDrivers(params);

      const driverList = res.data as unknown as Record<string, unknown>[];
      const normalized = driverList.map((d) => ({
        ...d,
        id: String(d.id),
        safetyScore: Number(d.safetyScore),
      })) as Driver[];

      setDrivers(normalized);
      setTotal(res.total ?? normalized.length);
      setTotalPages(res.totalPages ?? Math.ceil((res.total ?? normalized.length) / limit));
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  /* ── Fetch status counts ──────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const reqs = ["ON_DUTY", "ON_TRIP", "OFF_DUTY", "SUSPENDED"].map((s) =>
          hrApi.listDrivers({ status: s, page: 1, limit: 1 })
        );
        const results = await Promise.all(reqs);
        const c = { ON_DUTY: 0, ON_TRIP: 0, OFF_DUTY: 0, SUSPENDED: 0 };
        const keys = ["ON_DUTY", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
        results.forEach((r, i) => {
          c[keys[i]] = r.total ?? 0;
        });
        setCounts(c);
      } catch { /* ignore */ }
    })();
  }, [drivers]);

  /* ── Fetch expiring licenses ──────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await hrApi.getExpiringLicenses();
        const list = (Array.isArray(res) ? res : []) as unknown as Record<string, unknown>[];
        setExpiringDrivers(list.map((d) => ({
          ...d,
          id: String(d.id),
          safetyScore: Number(d.safetyScore),
        })) as Driver[]);
      } catch { setExpiringDrivers([]); }
    })();
  }, [drivers]);

  /* ── Filtered by search + expiry (client-side) ──── */
  const filtered = drivers.filter((d) => {
    // Text search
    if (search) {
      const q = search.toLowerCase();
      if (
        !d.fullName.toLowerCase().includes(q) &&
        !d.licenseNumber.toLowerCase().includes(q) &&
        !(d.email?.toLowerCase().includes(q))
      ) return false;
    }
    // Expiry filter
    if (expiryFilter) {
      const now = new Date();
      const expiry = new Date(d.licenseExpiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (expiryFilter === "expired" && daysLeft > 0) return false;
      if (expiryFilter === "expiring" && (daysLeft <= 0 || daysLeft > 30)) return false;
    }
    return true;
  });

  /* ── Handlers ────────────────────────────────────── */
  const handleEdit = (d: Driver) => {
    setEditDriver(d);
    setFormOpen(true);
  };

  const handleToggleDuty = async (d: Driver, targetStatus: "ON_DUTY" | "OFF_DUTY") => {
    try {
      await hrApi.updateDriverStatus(d.id, targetStatus);
      fetchDrivers();
    } catch { /* handled by interceptor */ }
  };

  const handleSuspend = async () => {
    if (!suspendDriverId || !suspendReason.trim()) return;
    try {
      await hrApi.updateDriverStatus(suspendDriverId, "SUSPENDED", suspendReason);
      fetchDrivers();
    } catch { /* handled by interceptor */ }
    setSuspendDriverId(null);
    setSuspendReason("");
  };

  const handleDelete = async () => {
    if (!deleteDriverId) return;
    try {
      await hrApi.deleteDriver(deleteDriverId);
      fetchDrivers();
    } catch { /* handled by interceptor */ }
    setDeleteDriverId(null);
  };

  const handleAdjustScore = async () => {
    if (!scoreDriverId) return;
    setScoreSubmitting(true);
    try {
      await hrApi.recalculateScore(scoreDriverId);
      fetchDrivers();
      setScoreModalOpen(false);
      setScoreDriverId(null);
      setScoreAdjustment(0);
      setScoreReason("");
    } catch { /* handled by interceptor */ }
    setScoreSubmitting(false);
  };

  /* ── Style helpers ───────────────────────────────── */
  const cardBg = isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-slate-200";
  const textPrimary = isDark ? "text-[#E4E6DE]" : "text-slate-900";
  const textSecondary = isDark ? "text-[#6B7C6B]" : "text-slate-500";
  const inputCls = `px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
    isDark ? "bg-[#1E2B22] border-[#1E2B22] text-[#E4E6DE] placeholder-neutral-400" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
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
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold leading-tight ${textPrimary}`}>{t("driverManagement.title")}</h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>{t("driverManagement.subtitle")}</p>
          </div>
        </div>

        {canMutate && (
          <button
            onClick={() => { setEditDriver(null); setFormOpen(true); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all shadow-lg ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-emerald-500/20" : "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20"}`}
          >
            <Plus className="w-4 h-4" />
            {t("driverManagement.addDriver")}
          </button>
        )}
      </motion.div>

      {/* Expiring Licenses Alert */}
      {expiringDrivers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[14px] border p-4 ${isDark ? "bg-amber-900/20 border-amber-800/50" : "bg-amber-50 border-amber-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
            <span className={`text-sm font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
              {t("driverManagement.licensesExpiringSoon", { count: expiringDrivers.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringDrivers.slice(0, 5).map((d) => {
              const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              return (
                <span
                  key={d.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    isUrgent
                      ? isDark ? "bg-[#2D1518]/30 text-red-300" : "bg-red-100 text-red-700"
                      : isDark ? "bg-[#2D2410] text-amber-300" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {d.fullName} — {daysLeft <= 0 ? t("common.expired") : t("driverManagement.daysLeft", { days: daysLeft })}
                </span>
              );
            })}
            {expiringDrivers.length > 5 && (
              <span className={`text-xs ${textSecondary}`}>+{expiringDrivers.length - 5} more</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: "ON_DUTY", label: t("driverManagement.statusCards.onDuty"), icon: "🟢", color: isDark ? "text-emerald-400" : "text-emerald-600" },
          { key: "ON_TRIP", label: t("driverManagement.statusCards.onTrip"), icon: "🟢", color: isDark ? "text-emerald-400" : "text-emerald-600" },
          { key: "OFF_DUTY", label: t("driverManagement.statusCards.offDuty"), icon: "⚫", color: isDark ? "text-[#6B7C6B]" : "text-slate-500" },
          { key: "SUSPENDED", label: t("driverManagement.statusCards.suspended"), icon: "🔴", color: isDark ? "text-[#FCA5A5]" : "text-red-600" },
        ] as const).map((item) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[14px] border p-4 ${cardBg} cursor-pointer hover:shadow-md transition-shadow`}
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
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`} />
          <input
            className={`${inputCls} pl-9 w-full`}
            placeholder={t("driverManagement.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`} />
          <select
            className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer`}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{t(f.labelKey)}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <AlertTriangle className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`} />
          <select
            className={`${inputCls} pl-9 pr-8 appearance-none cursor-pointer`}
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
          >
            {EXPIRY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{t(f.labelKey)}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* DataTable */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[14px] border shadow-sm overflow-hidden ${cardBg}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? "border-[#1E2B22] bg-[#111A15]/50" : "border-slate-200 bg-slate-50"}`}>
                {[t("driverManagement.columns.number"), t("driverManagement.columns.name"), t("driverManagement.columns.license"), t("driverManagement.columns.expiry"), t("driverManagement.columns.safetyScore"), t("driverManagement.columns.status"), t("driverManagement.columns.actions")].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={`border-b last:border-0 ${isDark ? "border-[#1E2B22]" : "border-slate-100"}`}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-4 rounded ${isDark ? "bg-[#1E2B22]" : "bg-slate-100"} animate-pulse`}
                          style={{ width: `${50 + (j % 3) * 20}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-neutral-600" : "text-slate-300"}`} />
                    <p className={`text-sm font-medium ${textPrimary}`}>{t("driverManagement.noDrivers")}</p>
                    <p className={`text-xs mt-1 ${textSecondary}`}>
                      {search || statusFilter || expiryFilter ? t("driverManagement.adjustFilters") : t("driverManagement.addFirstDriver")}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b last:border-0 transition-colors duration-100 ${
                      isDark ? "border-[#1E2B22] hover:bg-[#1E2B22]/50" : "border-slate-100 hover:bg-slate-50"
                    } ${d.status === "SUSPENDED" ? "opacity-60" : ""}`}
                  >
                    <td className={`px-4 py-3 ${textSecondary}`}>{(page - 1) * limit + idx + 1}</td>
                    <td className={`px-4 py-3 ${textPrimary}`}>
                      <span className="font-medium">{d.fullName}</span>
                      {d.email && <span className={`block text-xs ${textSecondary}`}>{d.email}</span>}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${textPrimary}`}>{d.licenseNumber}</td>
                    <td className="px-4 py-3">
                      <LicenseExpiryBadge expiryDate={d.licenseExpiryDate} />
                    </td>
                    <td className="px-4 py-3">
                      <SafetyScoreBar score={d.safetyScore} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={d.status} type="driver" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        {canMutate && d.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleEdit(d)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-slate-100 text-slate-400"
                            }`}
                            title={t("driverManagement.editTooltip")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Clock In / Clock Out */}
                        {canMutate && d.status === "OFF_DUTY" && (
                          <button
                            onClick={() => handleToggleDuty(d, "ON_DUTY")}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? "hover:bg-[#14332A] text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"
                            }`}
                            title={t("driverManagement.clockIn")}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canMutate && d.status === "ON_DUTY" && (
                          <button
                            onClick={() => handleToggleDuty(d, "OFF_DUTY")}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-slate-100 text-slate-500"
                            }`}
                            title={t("driverManagement.clockOut")}
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === "ON_TRIP" && (
                          <span className={`text-xs px-1.5 ${textSecondary}`} title="Driver is on a trip — status managed by dispatch">
                            {t("driverManagement.onTripLabel")}
                          </span>
                        )}

                        {/* Suspend */}
                        {canSuspend && d.status !== "SUSPENDED" && d.status !== "ON_TRIP" && (
                          <AlertDialog
                            open={suspendDriverId === d.id}
                            onOpenChange={(open) => { if (!open) { setSuspendDriverId(null); setSuspendReason(""); } }}
                          >
                              <button
                                onClick={() => setSuspendDriverId(d.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? "hover:bg-[#2D1518]/30 text-[#FCA5A5]" : "hover:bg-red-50 text-red-500"
                                }`}
                                title={t("driverManagement.suspendTooltip")}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("driverManagement.suspendDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <span dangerouslySetInnerHTML={{ __html: t("driverManagement.suspendDialog.description", { name: d.fullName }) }} />
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="px-6 pb-2">
                                <textarea
                                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                    isDark ? "bg-[#1E2B22] border-[#1E2B22] text-[#E4E6DE]" : "bg-white border-slate-200 text-slate-900"
                                  }`}
                                  placeholder={t("driverManagement.suspendDialog.placeholder")}
                                  rows={3}
                                  value={suspendReason}
                                  onChange={(e) => setSuspendReason(e.target.value)}
                                />
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={handleSuspend} disabled={!suspendReason.trim()}>
                                  {t("driverManagement.suspendDialog.confirm")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Adjust Safety Score */}
                        {canAdjustScore && (
                          <button
                            onClick={() => {
                              setScoreDriverId(d.id);
                              setScoreAdjustment(0);
                              setScoreReason("");
                              setScoreModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? "hover:bg-violet-900/30 text-violet-400" : "hover:bg-violet-50 text-violet-500"
                            }`}
                            title={t("driverManagement.adjustScoreTooltip")}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        {canDelete && (
                          <AlertDialog
                            open={deleteDriverId === d.id}
                            onOpenChange={(open) => { if (!open) setDeleteDriverId(null); }}
                          >
                              <button
                                onClick={() => setDeleteDriverId(d.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? "hover:bg-[#2D1518]/30 text-[#FCA5A5]" : "hover:bg-red-50 text-red-500"
                                }`}
                                title={t("driverManagement.deleteTooltip")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("driverManagement.deleteDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <span dangerouslySetInnerHTML={{ __html: t("driverManagement.deleteDialog.description", { name: d.fullName }) }} />
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                                  {t("driverManagement.deleteDialog.confirm")}
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
              isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-slate-100 text-slate-500"
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
                        ? "text-[#6B7C6B] hover:bg-[#1E2B22]"
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
              isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className={`text-xs ml-2 ${textSecondary}`}>
            {t("driverManagement.pagination.total", { count: total })}
          </span>
        </div>
      )}

      {/* Safety Score Adjustment Modal */}
      {scoreModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={() => setScoreModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`fixed z-[9991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl shadow-2xl p-6 ${
              isDark ? "bg-[#111A15] border border-[#1E2B22]" : "bg-white border border-slate-200"
            }`}
          >
            <h3 className={`text-base font-bold mb-4 ${textPrimary}`}>{t("driverManagement.scoreModal.title")}</h3>

            <div className="mb-4">
              <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-[#B0B8A8]" : "text-slate-600"}`}>
                {t("driverManagement.scoreModal.adjustment")} <span className={`font-bold ${scoreAdjustment >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {scoreAdjustment > 0 ? "+" : ""}{scoreAdjustment}
                </span>
              </label>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={scoreAdjustment}
                onChange={(e) => setScoreAdjustment(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={textSecondary}>-20</span>
                <span className={textSecondary}>0</span>
                <span className={textSecondary}>+20</span>
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-[#B0B8A8]" : "text-slate-600"}`}>
                {t("driverManagement.scoreModal.reason")}
              </label>
              <textarea
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark ? "bg-[#1E2B22] border-[#1E2B22] text-[#E4E6DE]" : "bg-white border-slate-200 text-slate-900"
                }`}
                placeholder={t("driverManagement.scoreModal.placeholder")}
                rows={3}
                value={scoreReason}
                onChange={(e) => setScoreReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setScoreModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? "text-[#B0B8A8] hover:bg-[#1E2B22]" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAdjustScore}
                disabled={scoreSubmitting}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 transition-all ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20" : "bg-violet-600 hover:bg-violet-500"}`}
              >
                {t("common.apply")}
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* Driver Form Slide-over */}
      <DriverForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDriver(null); }}
        onSuccess={fetchDrivers}
        editData={editDriver}
      />
    </section>
  );
}
