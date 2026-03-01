/**
 * Drivers — Driver Performance & Safety Profiles (Page 7 per spec)
 * Features: CRUD, compliance (license expiry blocks assignment if expired),
 * performance: trip completion rates and safety scores,
 * status toggle: On Duty / Off Duty / Suspended
 * Live map showing driver's last known location
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle, Award, Calendar, CheckCircle2, Clock, Download,
    Edit3, Filter, Mail, MapPin, Phone, Plus, Search, Shield,
    Trash2, UserX, Users, X
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { hrApi, analyticsApi, locationsApi, type Driver, type DriverTripStats, type DriverTrip } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
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
import { TableSkeleton } from "../components/ui/TableSkeleton";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STATUS_CONFIG: Record<string, { labelKey: string; className: string; icon: React.ElementType }> = {
    ON_DUTY: { labelKey: "drivers.status.ON_DUTY", className: "bg-emerald-100 text-emerald-700 dark:bg-[#14332A] dark:text-[#86EFAC]", icon: CheckCircle2 },
    OFF_DUTY: { labelKey: "drivers.status.OFF_DUTY", className: "bg-neutral-100 text-neutral-600 dark:bg-[#1E2B22] dark:text-[#B0B8A8]", icon: Clock },
    ON_TRIP: { labelKey: "drivers.status.ON_TRIP", className: "bg-emerald-100 text-emerald-700 dark:bg-[#162822] dark:text-[#6EEAA0]", icon: MapPin },
    SUSPENDED: { labelKey: "drivers.status.SUSPENDED", className: "bg-red-100 text-red-600 dark:bg-[#2D1518] dark:text-[#FCA5A5]", icon: UserX },
};

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

// Rating tier: determines row tint and award badge
function ratingTier(score: number): { color: string; bg: string; darkBg: string; label: string; award: string | null } {
    if (score >= 95) return { color: "text-emerald-400", bg: "bg-emerald-50/50", darkBg: "bg-emerald-500/5", label: "Elite", award: "\u2b50 Elite Driver" };
    if (score >= 85) return { color: "text-emerald-500", bg: "bg-emerald-50/30", darkBg: "bg-emerald-500/3", label: "Excellent", award: "\ud83c\udfc5 Top Performer" };
    if (score >= 70) return { color: "text-amber-500", bg: "bg-amber-50/30", darkBg: "bg-amber-500/3", label: "Good", award: null };
    if (score >= 50) return { color: "text-orange-500", bg: "bg-orange-50/30", darkBg: "bg-orange-500/3", label: "Average", award: null };
    return { color: "text-red-500", bg: "bg-red-50/30", darkBg: "bg-red-500/5", label: "Poor", award: "\u26a0\ufe0f Needs Improvement" };
}

function daysUntilExpiry(date: string): number {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function safetyScoreColor(score: number): string {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
}

function safetyScoreBg(score: number, isDark: boolean): string {
    if (score >= 90) return isDark ? "bg-[#14332A]" : "bg-emerald-50";
    if (score >= 70) return isDark ? "bg-[#2D2410]" : "bg-amber-50";
    return isDark ? "bg-[#2D1518]" : "bg-red-50";
}

interface LocationPoint {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed?: number;
}

export default function Drivers() {
    const { isDark } = useTheme();
    const toast = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editDriver, setEditDriver] = useState<Driver | null>(null);
    const [localError, setLocalError] = useState("");
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [actionDriverId, setActionDriverId] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    // Rating dialog state
    const [ratingDriver, setRatingDriver] = useState<Driver | null>(null);
    const [tripStats, setTripStats] = useState<DriverTripStats | null>(null);
    const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState("");
    const [ratingTripId, setRatingTripId] = useState<string | null>(null);
    const [ratingValue, setRatingValue] = useState<number>(80);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    // Update window state (for status/details changes)
    const [updateDriver, setUpdateDriver] = useState<Driver | null>(null);
    const [updateStatus, setUpdateStatus] = useState("");
    const [form, setForm] = useState({
        fullName: "", licenseNumber: "", phone: "", email: "",
        dateOfBirth: "", licenseExpiryDate: "", licenseClass: "", safetyScore: 100,
    });

    /* ── Fetch Data using React Query ───────────────── */
    const { data: driversData, isLoading: loadingDrivers, refetch: refetchDrivers } = useQuery({
        queryKey: ['drivers'],
        queryFn: async () => {
            const res = await hrApi.listDrivers({ limit: 100 });
            return res.data ?? [];
        }
    });

    const { data: expiringDriversData } = useQuery({
        queryKey: ['drivers', 'expiring'],
        queryFn: async () => {
            try {
                return await hrApi.getExpiringLicenses(30);
            } catch {
                return [];
            }
        }
    });

    const { data: locationsData } = useQuery({
        queryKey: ['drivers', 'locations'],
        queryFn: async () => {
            try {
                return await locationsApi.getLatestLocations();
            } catch {
                return [];
            }
        }
    });

    const drivers = driversData ?? [];
    const expiringDrivers = expiringDriversData ?? [];
    const locations = (locationsData as LocationPoint[]) ?? [];
    const loading = loadingDrivers;

    const filtered = drivers.filter(d =>
        (!statusFilter || d.status === statusFilter) &&
        (!search || d.fullName.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
            (d.email ?? "").toLowerCase().includes(search.toLowerCase()))
    );

    const openCreate = () => {
        setEditDriver(null);
        setForm({ fullName: "", licenseNumber: "", phone: "", email: "", dateOfBirth: "", licenseExpiryDate: "", licenseClass: "", safetyScore: 100 });
        setLocalError(""); setShowModal(true);
    };

    const openEdit = (d: Driver) => {
        setEditDriver(d);
        setForm({
            fullName: d.fullName, licenseNumber: d.licenseNumber,
            phone: d.phone ?? "", email: d.email ?? "",
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "",
            licenseExpiryDate: d.licenseExpiryDate.slice(0, 10),
            licenseClass: d.licenseClass ?? "", safetyScore: d.safetyScore,
        });
        setLocalError(""); setShowModal(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (editDriver) {
                return hrApi.updateDriver(editDriver.id, form as unknown as Partial<Driver>);
            } else {
                return hrApi.createDriver(form);
            }
        },
        onSuccess: () => {
            setShowModal(false);
            toast.success(t("crew.form.savedSuccess"), { title: t("crew.form.savedSuccessTitle") });
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.message || err.message || t("crew.form.savedFailed"));
        },
        onSettled: () => { queryClient.invalidateQueries({ queryKey: ["drivers"] }); }
    });
    const saving = saveMutation.isPending;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");
        saveMutation.mutate();
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => hrApi.deleteDriver(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["drivers"] });
            const previous = queryClient.getQueryData<Driver[]>(["drivers"]);
            queryClient.setQueryData<Driver[]>(["drivers"], old =>
                (old ?? []).filter(d => d.id !== id)
            );
            setActionDriverId(null);
            return { previous };
        },
        onSuccess: () => {
            toast.success(t("drivers.toast.deleted"), { title: t("drivers.toast.deletedTitle") });
        },
        onError: (_err, _id, context) => {
            if (context?.previous) queryClient.setQueryData(["drivers"], context.previous);
            toast.error(t("drivers.toast.deleteFailed"), { title: t("drivers.toast.deleteFailedTitle") });
        },
        onSettled: () => { queryClient.invalidateQueries({ queryKey: ["drivers"] }); }
    });

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleExport = async () => {
        try {
            const csv = await analyticsApi.exportDriversCSV();
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fleetflow-drivers-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(t("drivers.toast.exported"), { title: t("drivers.toast.exportedTitle") });
        } catch {
            toast.error(t("drivers.toast.exportFailed"), { title: t("drivers.toast.exportFailedTitle") });
        }
    };

    const adjustScore = async (d: Driver) => {
        setRatingDriver(d);
        setTripStats(null);
        setDriverTrips([]);
        setRatingTripId(null);
        setStatsLoading(true);
        setStatsError("");
        const [statsResult, tripsResult] = await Promise.allSettled([
            hrApi.getTripStats(d.id),
            hrApi.getDriverTrips(d.id),
        ]);
        if (statsResult.status === "fulfilled") {
            setTripStats(statsResult.value);
        } else {
            const err = statsResult.reason as { response?: { data?: { message?: string }; status?: number }; message?: string };
            setStatsError(err?.response?.data?.message || err?.message || t("drivers.rating.loadStatsFailed"));
        }
        if (tripsResult.status === "fulfilled") {
            setDriverTrips(tripsResult.value);
        }
        setStatsLoading(false);
    };

    const recalculateScore = async () => {
        if (!ratingDriver) return;
        try {
            await hrApi.recalculateScore(ratingDriver.id);
            const [stats, trips] = await Promise.all([
                hrApi.getTripStats(ratingDriver.id),
                hrApi.getDriverTrips(ratingDriver.id),
            ]);
            setTripStats(stats);
            setDriverTrips(trips);
            await refetchDrivers();
            toast.success(t("drivers.rating.scoreRecalculated", { name: ratingDriver.fullName }), { title: t("drivers.rating.scoreUpdatedTitle") });
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = e?.response?.data?.message || e?.message || t("drivers.rating.recalculateFailed");
            toast.error(msg, { title: t("common.error") });
        }
    };

    const submitTripRating = async () => {
        if (!ratingDriver || !ratingTripId) return;
        setRatingSubmitting(true);
        try {
            await hrApi.rateTrip(ratingDriver.id, ratingTripId, ratingValue);
            const [stats, trips] = await Promise.all([
                hrApi.getTripStats(ratingDriver.id),
                hrApi.getDriverTrips(ratingDriver.id),
            ]);
            setTripStats(stats);
            setDriverTrips(trips);
            setRatingTripId(null);
            await refetchDrivers();
            toast.success(t("drivers.rating.tripRated"), { title: t("drivers.rating.ratingSavedTitle") });
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = e?.response?.data?.message || e?.message || t("drivers.rating.rateFailed");
            toast.error(msg, { title: t("common.error") });
        } finally {
            setRatingSubmitting(false);
        }
    };

    // Open the update window for a driver
    const openUpdateWindow = (d: Driver) => {
        setUpdateDriver(d);
        setUpdateStatus(d.status);
    };

    const submitStatusUpdate = async () => {
        if (!updateDriver || updateStatus === updateDriver.status) { setUpdateDriver(null); return; }
        try {
            await hrApi.updateDriverStatus(updateDriver.id, updateStatus);
            refetchDrivers();
            toast.success(t("drivers.toast.statusUpdated", { name: updateDriver.fullName, status: updateStatus.replace(/_/g, " ") }), { title: t("drivers.toast.statusUpdatedTitle") });
            setUpdateDriver(null);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(e?.response?.data?.message || e?.message || t("drivers.toast.statusUpdateFailed"), { title: t("common.error") });
        }
    };

    const inputClass = `${FIELD} ${isDark ? "bg-[#1E2B22] border-[#1E2B22] text-[#E4E6DE] placeholder-[#6B7C6B]" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;
    const cardClass = `rounded-[14px] border p-5 ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`;

    // Stats
    const totalDrivers = drivers.length;
    const onDuty = drivers.filter(d => d.status === "ON_DUTY").length;
    const onTrip = drivers.filter(d => d.status === "ON_TRIP").length;
    const suspended = drivers.filter(d => d.status === "SUSPENDED").length;
    const avgSafety = totalDrivers > 0 ? (drivers.reduce((s, d) => s + Number(d.safetyScore), 0) / totalDrivers).toFixed(1) : "—";

    return (
        <div className="max-w-[1600px] mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("drivers.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>
                        {t("drivers.stats", { total: totalDrivers, onDuty, onTrip })}
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors">
                        <Download className="w-4 h-4" /> {t("drivers.exportCSV")}
                    </button>
                    <button onClick={openCreate} className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-sm font-semibold transition-all active:scale-[0.97] ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                        <Plus className="w-4 h-4" /> {t("drivers.addDriver")}
                    </button>
                </div>
            </div>

            {/* KPI stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatMini label={t("drivers.kpi.totalDrivers")} value={`${totalDrivers}`} icon={Users} color="emerald" isDark={isDark} />
                <StatMini label={t("drivers.kpi.onDuty")} value={`${onDuty}`} icon={CheckCircle2} color="green" isDark={isDark} />
                <StatMini label={t("drivers.kpi.onTrip")} value={`${onTrip}`} icon={MapPin} color="emerald" isDark={isDark} />
                <StatMini label={t("drivers.kpi.suspended")} value={`${suspended}`} icon={UserX} color="red" isDark={isDark} />
                <StatMini label={t("drivers.kpi.avgSafetyScore")} value={avgSafety} icon={Shield} color="amber" isDark={isDark} />
            </div>

            {/* Expiring licenses alert */}
            {expiringDrivers.length > 0 && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className={`text-sm font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                            {t("drivers.expiringLicenses", { count: expiringDrivers.length })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {expiringDrivers.map(d => (
                                <span key={d.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800">
                                    <Shield className="w-3 h-3" />
                                    {d.fullName} — expires {new Date(d.licenseExpiryDate).toLocaleDateString("en-IN")}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile view toggle */}
            <div className={`flex lg:hidden mb-0 gap-1 p-1 rounded-[14px] ${isDark ? 'bg-[#111A15]' : 'bg-neutral-100'}`}>
                <button onClick={() => setMobileView('list')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'list' ? (isDark ? 'bg-[#1E2B22] text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-[#4A5C4A]' : 'text-neutral-500')}`}>
                    <Users className="w-4 h-4" /> Drivers
                </button>
                <button onClick={() => setMobileView('detail')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileView === 'detail' ? (isDark ? 'bg-[#1E2B22] text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : (isDark ? 'text-[#4A5C4A]' : 'text-neutral-500')}`}>
                    <MapPin className="w-4 h-4" /> Detail & Map
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* LEFT: Driver list */}
                <div className={`flex-1 space-y-4 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'}`}>
                    {/* Search & filter */}
                    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-[14px] border ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200"}`}>
                        <div className="relative w-full sm:flex-1 sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("drivers.searchPlaceholder")}
                                className={`${inputClass} pl-9`} />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
                            {["", "ON_DUTY", "OFF_DUTY", "ON_TRIP", "SUSPENDED"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-500 text-white" : isDark ? "text-[#B0B8A8] hover:bg-[#1E2B22]" : "text-neutral-600 hover:bg-neutral-100"}`}
                                >
                                    {s ? t(STATUS_CONFIG[s]?.labelKey) : t("common.all")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`rounded-[14px] border overflow-hidden ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
                        {loading ? (
                            <TableSkeleton />
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                                <Users className="w-10 h-10 mb-2 opacity-30" />
                                <p>{t("drivers.noDrivers")}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[700px]">
                                <thead>
                                    <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? "text-[#6B7C6B] border-[#1E2B22] bg-[#090D0B]/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
                                        {[
                                            t("drivers.columns.driver"),
                                            t("drivers.columns.license"),
                                            t("drivers.columns.safety"),
                                            t("drivers.columns.licenseExpiry"),
                                            t("drivers.columns.status"),
                                            t("drivers.columns.actions"),
                                        ].map(h =>
                                            <th key={h} className="text-left px-4 py-3">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((d, i) => {
                                        const expDays = daysUntilExpiry(d.licenseExpiryDate);
                                        const isExpired = expDays <= 0;
                                        const isExpiring = expDays > 0 && expDays <= 30;
                                        const tier = ratingTier(Number(d.safetyScore));
                                        return (
                                            <motion.tr key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                                onClick={() => setSelectedDriver(d)}
                                                className={`border-b last:border-0 cursor-pointer transition-colors ${selectedDriver?.id === d.id
                                                    ? (isDark ? "bg-emerald-500/10" : "bg-emerald-50")
                                                    : isDark ? `border-[#1E2B22] ${tier.darkBg} hover:bg-[#1E2B22]/30` : `border-neutral-50 ${tier.bg} hover:bg-neutral-50/80`
                                                    }`}
                                            >
                                                {/* Driver name + contact (prominent) */}
                                                <td className="px-4 py-3.5">
                                                    <p className={`font-semibold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{d.fullName}</p>
                                                    {d.phone && <p className={`text-xs mt-0.5 flex items-center gap-1 font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}><Phone className="w-3 h-3" />{d.phone}</p>}
                                                    {d.email && <p className={`text-xs flex items-center gap-1 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}><Mail className="w-3 h-3" />{d.email}</p>}
                                                </td>
                                                <td className={`px-4 py-3.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>
                                                    <p className="font-mono text-xs font-bold">{d.licenseNumber}</p>
                                                    {d.licenseClass && <p className="text-xs text-neutral-400">{d.licenseClass}</p>}
                                                </td>
                                                {/* Safety score — color-coded with tier badge + award */}
                                                <td className="px-4 py-3.5">
                                                    <button onClick={(e) => { e.stopPropagation(); adjustScore(d); }}
                                                        className="flex items-center gap-2 group cursor-pointer" title="Click to view rating details">
                                                        <div className={`w-9 h-9 rounded-lg ${safetyScoreBg(Number(d.safetyScore), isDark)} flex items-center justify-center border ${isDark ? "border-[#1E2B22]" : "border-neutral-200"} group-hover:ring-2 ring-emerald-500/30 transition-all`}>
                                                            <span className={`text-sm font-extrabold ${tier.color}`}>
                                                                {Number(d.safetyScore).toFixed(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.color}`}>{tier.label}</span>
                                                            {tier.award && <span className="text-[10px]">{tier.award}</span>}
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isExpired ? "bg-red-100 text-red-600" : isExpiring ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(d.licenseExpiryDate).toLocaleDateString("en-IN")}
                                                        {isExpired && " (EXPIRED)"}
                                                        {isExpiring && ` (${expDays}d left)`}
                                                    </span>
                                                </td>
                                                {/* Status — just a badge, click "Update" to change */}
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[d.status]?.className}`}>
                                                        {STATUS_CONFIG[d.status] ? t(STATUS_CONFIG[d.status].labelKey) : d.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1">
                                                        {/* Update window button */}
                                                        <button onClick={(e) => { e.stopPropagation(); openUpdateWindow(d); }}
                                                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-emerald-400 hover:bg-emerald-500/10" : "text-emerald-600 hover:bg-emerald-50"}`}
                                                            title="Update driver">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                                                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-[#6B7C6B] hover:text-[#E4E6DE] hover:bg-[#1E2B22]" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"}`}>
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        {d.status === "ON_TRIP" ? (
                                                            <button disabled
                                                                className="p-1.5 rounded-lg text-neutral-300 dark:text-neutral-600 cursor-not-allowed opacity-50"
                                                                title={t("drivers.cannotDeleteOnTrip")}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                        <AlertDialog
                                                            open={actionDriverId === d.id}
                                                            onOpenChange={(open) => !open && setActionDriverId(null)}
                                                        >
                                                                <button onClick={(e) => { e.stopPropagation(); setActionDriverId(d.id); }}
                                                                    className={`p-1.5 rounded-lg text-neutral-400 transition-colors ${isDark ? "hover:text-[#FCA5A5] hover:bg-[#2D1518]/30" : "hover:text-red-500 hover:bg-red-50"}`}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                  <AlertDialogTitle>{t("drivers.removeDriver")}</AlertDialogTitle>
                                                                  <AlertDialogDescription>
                                                                    {t("drivers.removeDriverDesc", { name: d.fullName })}
                                                                  </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                                  <AlertDialogAction variant="destructive" onClick={() => handleDelete(d.id)}>
                                                                    {t("common.delete")}
                                                                  </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Driver detail + map */}
                <div className={`w-full lg:w-[380px] lg:shrink-0 space-y-4 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
                    {selectedDriver ? (
                        <>
                            {/* Driver profile card */}
                            <div className={cardClass}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <span className="text-lg font-extrabold text-emerald-500">
                                            {selectedDriver.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className={`text-base font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{selectedDriver.fullName}</h3>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CONFIG[selectedDriver.status]?.className}`}>
                                            {STATUS_CONFIG[selectedDriver.status] ? t(STATUS_CONFIG[selectedDriver.status].labelKey) : selectedDriver.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2.5 text-sm">
                                    <InfoRow icon={Shield} label={t("drivers.detail.license")} value={selectedDriver.licenseNumber} isDark={isDark} />
                                    {selectedDriver.licenseClass && <InfoRow icon={Award} label={t("drivers.detail.class")} value={selectedDriver.licenseClass} isDark={isDark} />}
                                    {selectedDriver.phone && <InfoRow icon={Phone} label={t("drivers.detail.phone")} value={selectedDriver.phone} isDark={isDark} />}
                                    {selectedDriver.email && <InfoRow icon={Mail} label={t("drivers.detail.email")} value={selectedDriver.email} isDark={isDark} />}
                                    {selectedDriver.dateOfBirth && <InfoRow icon={Calendar} label={t("drivers.detail.dob")} value={new Date(selectedDriver.dateOfBirth).toLocaleDateString("en-IN")} isDark={isDark} />}
                                    <InfoRow icon={Calendar} label={t("drivers.detail.licenseExpiry")} value={new Date(selectedDriver.licenseExpiryDate).toLocaleDateString("en-IN")} isDark={isDark}
                                        highlight={daysUntilExpiry(selectedDriver.licenseExpiryDate) <= 30}
                                    />
                                </div>
                                {/* Safety score gauge */}
                                <div className="mt-4 p-3 rounded-[14px] bg-neutral-50 dark:bg-[#1E2B22]/30">
                                    <p className={`text-xs font-semibold mb-2 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.detail.safetyScore")}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-neutral-200 dark:bg-[#1E2B22] rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${Number(selectedDriver.safetyScore) >= 90 ? "bg-emerald-500" : Number(selectedDriver.safetyScore) >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                                                style={{ width: `${Math.min(100, Number(selectedDriver.safetyScore))}%` }}
                                            />
                                        </div>
                                        <span className={`text-lg font-extrabold ${safetyScoreColor(Number(selectedDriver.safetyScore))}`}>
                                            {Number(selectedDriver.safetyScore).toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Map showing fleet locations */}
                            <div className={`rounded-[14px] border overflow-hidden ${isDark ? "border-[#1E2B22]" : "border-neutral-200 shadow-sm"}`}>
                                <div className={`px-4 py-2 text-xs font-semibold ${isDark ? "bg-[#111A15] text-[#6B7C6B]" : "bg-neutral-50 text-neutral-500"}`}>
                                    <MapPin className="w-3 h-3 inline mr-1" />{t("drivers.map.title")}
                                </div>
                                <MapContainer center={[20.5937, 78.9629]} zoom={5} className="w-full" style={{ height: "280px" }}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    />
                                    {locations.map((loc, i) => (
                                        <Marker key={i} position={[Number(loc.latitude), Number(loc.longitude)]}>
                                            <Popup>
                                                <b>Vehicle</b><br />
                                                Speed: {loc.speed ?? 0} km/h
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </>
                    ) : (
                        <div className={`rounded-[14px] border flex flex-col items-center justify-center p-8 gap-3 h-[400px] ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Users className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className={`font-semibold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("drivers.selectDriver")}</p>
                                <p className={`text-sm mt-1 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.selectDriverDesc")}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={e => e.target === e.currentTarget && setShowModal(false)}
                    >
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200"}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>
                                    {editDriver ? t("drivers.updateDriver") : t("drivers.addDriver")}
                                </h2>
                                <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-neutral-100 text-neutral-400"}`}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {localError && <div className={`mb-4 text-sm rounded-[14px] p-3 flex items-center gap-2 ${isDark ? "text-[#FCA5A5] bg-[#2D1518]/30 border border-[#2D1518]" : "text-red-500 bg-red-50 border border-red-100"}`}><AlertTriangle className="w-4 h-4" />{localError}</div>}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.fullName")} *</label>
                                        <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputClass} placeholder={t("drivers.form.fullNamePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.licenseNumber")} *</label>
                                        <input required value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value.toUpperCase() }))} className={inputClass} placeholder={t("drivers.form.licensePlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.phone")}</label>
                                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder={t("drivers.form.phonePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.email")}</label>
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder={t("drivers.form.emailPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.dateOfBirth")}</label>
                                        <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.licenseExpiry")} *</label>
                                        <input required type="date" value={form.licenseExpiryDate} onChange={e => setForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.licenseClass")}</label>
                                        <input value={form.licenseClass} onChange={e => setForm(f => ({ ...f, licenseClass: e.target.value }))} className={inputClass} placeholder={t("drivers.form.licenseClassPlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.form.safetyScore")}</label>
                                        <input type="number" min="0" max="100" step="0.1" value={form.safetyScore} onChange={e => setForm(f => ({ ...f, safetyScore: +e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-[#B0B8A8] hover:bg-[#1E2B22]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                                        {t("common.cancel")}
                                    </button>
                                    <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold transition-colors disabled:opacity-60 ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                                        {saving ? t("common.saving") : editDriver ? t("drivers.updateDriver") : t("drivers.addDriver")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Rating Dialog (Trip-Based Stats + Per-Trip Rating) ─────────────────────────── */}
            <AnimatePresence>
                {ratingDriver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={e => e.target === e.currentTarget && setRatingDriver(null)}>
                        {(() => {
                            const score = tripStats?.score ?? Number(ratingDriver.safetyScore);
                            const tier = ratingTier(score);
                            const dialogTint = score >= 95 ? (isDark ? "bg-[#0B1A12] border-emerald-500/20" : "bg-emerald-50/60 border-emerald-200")
                                : score >= 85 ? (isDark ? "bg-[#0E1A12] border-emerald-500/15" : "bg-emerald-50/40 border-emerald-100")
                                : score >= 70 ? (isDark ? "bg-[#141A10] border-amber-500/15" : "bg-amber-50/40 border-amber-100")
                                : score >= 50 ? (isDark ? "bg-[#1A1510] border-orange-500/15" : "bg-orange-50/40 border-orange-100")
                                : (isDark ? "bg-[#1A1012] border-red-500/20" : "bg-red-50/50 border-red-200");
                            const unrated = tripStats?.unrated ?? 0;
                            return (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${dialogTint}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-lg font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>
                                    {t("drivers.rating.safetyScoreTitle", { name: ratingDriver.fullName })}
                                </h2>
                                <button onClick={() => setRatingDriver(null)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-neutral-100 text-neutral-400"}`}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Unrated trips notification */}
                            {!statsLoading && unrated > 0 && (
                                <div className={`mb-4 p-3 rounded-2xl flex items-start gap-3 border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className={`text-sm font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                                            {t("drivers.rating.unratedTrips", { count: unrated })}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${isDark ? "text-amber-500/70" : "text-amber-600/70"}`}>
                                            {t("drivers.rating.scrollToRate", { name: ratingDriver.fullName })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {statsLoading ? (
                                <div className={`text-center py-8 ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                                    {t("drivers.rating.loadingStats")}
                                </div>
                            ) : tripStats ? (
                                <>
                                    {/* Score Display */}
                                    <div className={`p-5 rounded-2xl mb-4 border ${isDark ? "bg-[#0E1410]/80 border-[#1E2B22]" : "bg-white/60 border-neutral-200"}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.tripBasedScore")}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-xs font-semibold uppercase tracking-wider ${tier.color}`}>{tier.label}</span>
                                                {tier.award && <span className="text-sm">{tier.award}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-5xl font-black ${tier.color}`}>{score.toFixed(1)}</div>
                                            <div className="flex-1">
                                                <div className={`h-4 rounded-full overflow-hidden ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                    <div className={`h-full rounded-full transition-all duration-700 ${score >= 90 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : score >= 50 ? "bg-orange-500" : "bg-red-500"}`}
                                                        style={{ width: `${Math.min(100, score)}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] mt-1 text-neutral-400">
                                                    <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {[{ label: "Poor", c: "bg-red-500", r: "0-49" }, { label: "Avg", c: "bg-orange-500", r: "50-69" }, { label: "Good", c: "bg-amber-500", r: "70-84" }, { label: "Excellent", c: "bg-emerald-500", r: "85-94" }, { label: "Elite", c: "bg-emerald-400", r: "95+" }].map(l => (
                                                <span key={l.label} className={`flex items-center gap-1 text-[10px] ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                                    <span className={`w-2 h-2 rounded-full ${l.c}`} />{l.label} ({l.r})
                                                </span>
                                            ))}
                                        </div>
                                        {tripStats.avgRating !== null && (
                                            <div className="mt-4">
                                                <div className={`flex items-center justify-between mb-1.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-xs font-semibold">{t("drivers.rating.avgTripRating")}</span>
                                                    </div>
                                                    <span className={`text-lg font-black ${
                                                        tripStats.avgRating >= 90 ? "text-emerald-500" : tripStats.avgRating >= 70 ? "text-amber-500" : tripStats.avgRating >= 50 ? "text-orange-500" : "text-red-500"
                                                    }`}>{tripStats.avgRating.toFixed(1)}<span className="text-xs font-medium text-neutral-400">/100</span></span>
                                                </div>
                                                <div className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                    <div className={`h-full rounded-full transition-all duration-700 ${
                                                        tripStats.avgRating >= 90 ? "bg-emerald-500" : tripStats.avgRating >= 70 ? "bg-amber-500" : tripStats.avgRating >= 50 ? "bg-orange-500" : "bg-red-500"
                                                    }`} style={{ width: `${Math.min(100, Math.max(0, tripStats.avgRating))}%` }} />
                                                </div>
                                                <p className={`text-[10px] mt-1 ${isDark ? "text-[#4A5C4A]" : "text-neutral-400"}`}>
                                                    {t("drivers.rating.basedOnRated", { rated: tripStats.completed - tripStats.unrated, total: tripStats.completed })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Trip Breakdown */}
                                    <div className={`p-4 rounded-2xl mb-4 border ${isDark ? "bg-[#0E1410]/80 border-[#1E2B22]" : "bg-white/60 border-neutral-200"}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.tripBreakdown")}</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`p-3 rounded-xl text-center ${isDark ? "bg-[#1E2B22]/50" : "bg-neutral-50"}`}>
                                                <p className="text-2xl font-black text-emerald-500">{tripStats.completed}</p>
                                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.completed")}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl text-center ${isDark ? "bg-[#1E2B22]/50" : "bg-neutral-50"}`}>
                                                <p className="text-2xl font-black text-red-500">{tripStats.cancelled}</p>
                                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.cancelled")}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl text-center ${isDark ? "bg-[#1E2B22]/50" : "bg-neutral-50"}`}>
                                                <p className={`text-2xl font-black ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{tripStats.dispatched}</p>
                                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.dispatched")}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl text-center ${isDark ? "bg-[#1E2B22]/50" : "bg-neutral-50"}`}>
                                                <p className={`text-2xl font-black ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{tripStats.total}</p>
                                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.totalTrips")}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Metrics */}
                                    <div className={`p-4 rounded-2xl mb-4 border space-y-3 ${isDark ? "bg-[#0E1410]/80 border-[#1E2B22]" : "bg-white/60 border-neutral-200"}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{t("drivers.rating.performanceMetrics")}</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>{t("drivers.rating.completionRate")}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? "bg-[#1E2B22]" : "bg-neutral-200"}`}>
                                                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${tripStats.completionRate}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-500">{tripStats.completionRate}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>{t("drivers.rating.incidents")}</span>
                                            <span className={`text-xs font-bold ${tripStats.incidents === 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                {tripStats.incidents} {tripStats.incidents === 0 ? t("drivers.rating.cleanRecord") : `(−${tripStats.incidents * 5} pts)`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── Individual Trip List with Ratings ──────────────── */}
                                    <div className={`p-4 rounded-2xl mb-4 border ${isDark ? "bg-[#0E1410]/80 border-[#1E2B22]" : "bg-white/60 border-neutral-200"}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>
                                            {t("drivers.rating.tripHistory", { count: driverTrips.length })}
                                        </p>

                                        {driverTrips.length === 0 ? (
                                            <p className={`text-sm text-center py-4 ${isDark ? "text-[#4A5C4A]" : "text-neutral-400"}`}>{t("drivers.rating.noTrips")}</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                {driverTrips.map(trip => {
                                                    const isCompleted = trip.status === "COMPLETED";
                                                    const hasRating = trip.rating !== null;
                                                    const statusColor = trip.status === "COMPLETED" ? "text-emerald-500 bg-emerald-500/10"
                                                        : trip.status === "CANCELLED" ? "text-red-500 bg-red-500/10"
                                                        : trip.status === "DISPATCHED" ? "text-blue-400 bg-blue-500/10"
                                                        : "text-neutral-400 bg-neutral-500/10";

                                                    return (
                                                        <div key={trip.id} className={`p-3 rounded-xl border transition-colors ${
                                                            ratingTripId === trip.id
                                                                ? (isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-300")
                                                                : isDark ? "bg-[#1E2B22]/30 border-[#1E2B22] hover:bg-[#1E2B22]/60" : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                                                        }`}>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                                                                        <p className={`text-xs font-semibold truncate ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>
                                                                            {trip.origin} → {trip.destination}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                                                                            {trip.status}
                                                                        </span>
                                                                        <span className={`text-[10px] ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                                                            {trip.vehicle.licensePlate} · {trip.vehicle.make} {trip.vehicle.model}
                                                                        </span>
                                                                        {trip.completionTime && (
                                                                            <span className={`text-[10px] ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                                                                {new Date(trip.completionTime).toLocaleDateString("en-IN")}
                                                                            </span>
                                                                        )}
                                                                        {!trip.completionTime && trip.createdAt && (
                                                                            <span className={`text-[10px] ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                                                                {new Date(trip.createdAt).toLocaleDateString("en-IN")}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    {isCompleted && hasRating ? (
                                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                                                                            <Award className="w-3 h-3 text-emerald-500" />
                                                                            <span className="text-xs font-bold text-emerald-500">{trip.rating}</span>
                                                                        </div>
                                                                    ) : isCompleted && !hasRating ? (
                                                                        <button
                                                                            onClick={() => { setRatingTripId(trip.id); setRatingValue(80); }}
                                                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                                                                isDark ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20" : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                                                                            }`}>
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            {t("drivers.rating.unratedClickToRate")}
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {/* Expanded rating form */}
                                                            {ratingTripId === trip.id && (
                                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                                    className="mt-3 pt-3 border-t border-dashed"
                                                                    style={{ borderColor: isDark ? "#1E2B22" : "#E5E7EB" }}>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <label className={`text-xs font-semibold ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>{t("drivers.rating.ratingLabel")}</label>
                                                                        <input
                                                                            type="range" min={0} max={100} value={ratingValue}
                                                                            onChange={e => setRatingValue(Number(e.target.value))}
                                                                            className="flex-1 accent-emerald-500"
                                                                        />
                                                                        <span className={`text-sm font-black w-10 text-right ${
                                                                            ratingValue >= 90 ? "text-emerald-500" : ratingValue >= 70 ? "text-amber-500" : ratingValue >= 50 ? "text-orange-500" : "text-red-500"
                                                                        }`}>{ratingValue}</span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => setRatingTripId(null)}
                                                                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${isDark ? "border-[#1E2B22] text-[#B0B8A8]" : "border-neutral-200 text-neutral-600"}`}>
                                                                            {t("common.cancel")}
                                                                        </button>
                                                                        <button onClick={submitTripRating} disabled={ratingSubmitting}
                                                                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${isDark ? "bg-emerald-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                                                                            {ratingSubmitting ? t("common.saving") : t("drivers.rating.saveRating")}
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button onClick={() => setRatingDriver(null)} className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold border ${isDark ? "border-[#1E2B22] text-[#B0B8A8]" : "border-neutral-200 text-neutral-600"}`}>{t("common.close")}</button>
                                        <button onClick={recalculateScore}
                                            className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold transition-colors ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                                            {t("drivers.rating.recalculateScore")}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className={`text-center py-8 ${isDark ? "text-[#6B7C6B]" : "text-neutral-400"}`}>
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                    <p className="text-sm font-medium mb-1">{statsError || t("drivers.rating.loadStatsFailed")}</p>
                                    <button onClick={() => adjustScore(ratingDriver!)}
                                        className={`text-xs underline ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                        {t("common.retry")}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Update Window (status + quick info) ────────────────── */}
            <AnimatePresence>
                {updateDriver && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={e => e.target === e.currentTarget && setUpdateDriver(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-lg font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{t("drivers.updateDriver")}</h2>
                                <button onClick={() => setUpdateDriver(null)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-[#1E2B22] text-[#6B7C6B]" : "hover:bg-neutral-100 text-neutral-400"}`}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Driver summary */}
                            <div className={`p-3 rounded-2xl mb-4 ${isDark ? "bg-[#0E1410]" : "bg-neutral-50"}`}>
                                <p className={`font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{updateDriver.fullName}</p>
                                {updateDriver.phone && <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}><Phone className="w-3 h-3" />{updateDriver.phone}</p>}
                                <p className={`text-xs mt-1 ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{updateDriver.licenseNumber}</p>
                            </div>

                            {/* Status selector */}
                            <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-[#B0B8A8]" : "text-neutral-700"}`}>{t("drivers.columns.status")}</label>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {["ON_DUTY", "OFF_DUTY", "SUSPENDED"].map(s => (
                                    <button key={s} onClick={() => setUpdateStatus(s)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${updateStatus === s
                                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                                            : isDark ? "border-[#1E2B22] text-[#B0B8A8] hover:bg-[#1E2B22]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                        }`}>
                                        {STATUS_CONFIG[s] ? t(STATUS_CONFIG[s].labelKey) : s}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setUpdateDriver(null)} className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold border ${isDark ? "border-[#1E2B22] text-[#B0B8A8]" : "border-neutral-200 text-neutral-600"}`}>{t("common.cancel")}</button>
                                <button onClick={submitStatusUpdate}
                                    className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold transition-colors ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                                    {t("common.save")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatMini({ label, value, icon: Icon, color, isDark }: {
    label: string; value: string; icon: React.ElementType; color: string; isDark: boolean;
}) {
    const bgMap: Record<string, string> = {
        emerald: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
        green: isDark ? "bg-green-500/10" : "bg-green-50",
        red: isDark ? "bg-red-500/10" : "bg-red-50",
        amber: isDark ? "bg-amber-500/10" : "bg-amber-50",
    };
    const textMap: Record<string, string> = {
        emerald: "text-emerald-500", green: "text-green-500", red: "text-red-500", amber: "text-amber-500",
    };
    return (
        <div className={`rounded-[14px] border p-4 ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-neutral-200 shadow-sm"}`}>
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bgMap[color]} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${textMap[color]}`} />
                </div>
                <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-[#6B7C6B]" : "text-neutral-500"}`}>{label}</p>
                    <p className={`text-xl font-extrabold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, isDark, highlight }: {
    icon: React.ElementType; label: string; value: string; isDark: boolean; highlight?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 shrink-0 ${highlight ? "text-amber-500" : isDark ? "text-[#4A5C4A]" : "text-neutral-400"}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDark ? "text-[#4A5C4A]" : "text-neutral-400"}`}>{label}</p>
                <p className={`text-sm font-semibold truncate ${highlight ? "text-amber-500" : isDark ? "text-[#E4E6DE]" : "text-neutral-900"}`}>{value}</p>
            </div>
        </div>
    );
}
