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
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle, Award, Calendar, CheckCircle2, ChevronDown, Clock, Download,
    Edit3, Filter, Mail, MapPin, Phone, Plus, Search, Shield,
    TrendingDown, Trash2, UserX, Users, X
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { hrApi, analyticsApi, locationsApi, type Driver } from "../api/client";
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
    ON_DUTY: { labelKey: "drivers.status.ON_DUTY", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    OFF_DUTY: { labelKey: "drivers.status.OFF_DUTY", className: "bg-neutral-100 text-neutral-600", icon: Clock },
    ON_TRIP: { labelKey: "drivers.status.ON_TRIP", className: "bg-blue-100 text-blue-700", icon: MapPin },
    SUSPENDED: { labelKey: "drivers.status.SUSPENDED", className: "bg-red-100 text-red-600", icon: UserX },
};

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

function daysUntilExpiry(date: string): number {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function safetyScoreColor(score: number): string {
    if (score >= 90) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-red-500";
}

function safetyScoreBg(score: number): string {
    if (score >= 90) return "bg-emerald-50";
    if (score >= 70) return "bg-amber-50";
    return "bg-red-50";
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
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editDriver, setEditDriver] = useState<Driver | null>(null);
    const [saving, setSaving] = useState(false);
    const [localError, setLocalError] = useState("");
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [actionDriverId, setActionDriverId] = useState<string | null>(null);
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setLocalError("");
        try {
            if (editDriver) {
                await hrApi.updateDriver(editDriver.id, form as unknown as Partial<Driver>);
            } else {
                await hrApi.createDriver(form);
            }
            setShowModal(false);
            refetchDrivers();
            toast.success(t("crew.form.savedSuccess"), { title: t("crew.form.savedSuccessTitle") });
        } catch (err: any) {
            setLocalError(err.response?.data?.message || err.message || t("crew.form.savedFailed"));
        } finally {
            setSaving(false);
        }
    };



    const handleStatusChange = async (d: Driver, status: string) => {
        try {
            await hrApi.updateDriverStatus(d.id, status);
            toast.success(t("drivers.toast.statusUpdated", { name: d.fullName, status: status.replace('_', ' ') }), { title: t("drivers.toast.statusUpdatedTitle") });
            refetchDrivers();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t("drivers.toast.statusUpdateFailed"), { title: t("drivers.toast.statusUpdateFailedTitle") });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await hrApi.deleteDriver(id);
            toast.success(t("drivers.toast.deleted"), { title: t("drivers.toast.deletedTitle") });
            refetchDrivers();
        } catch {
            toast.error(t("drivers.toast.deleteFailed"), { title: t("drivers.toast.deleteFailedTitle") });
        }
        setActionDriverId(null);
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

    const adjustScore = async (d: Driver, adj: number) => {
        const reason = prompt(`Reason for ${adj > 0 ? "+" : ""}${adj} safety score?`);
        if (reason === null) return;
        await hrApi.adjustSafetyScore(d.id, adj, reason);
        refetchDrivers();
    };

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;
    const cardClass = `rounded-2xl border p-5 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`;

    // Stats
    const totalDrivers = drivers.length;
    const onDuty = drivers.filter(d => d.status === "ON_DUTY").length;
    const onTrip = drivers.filter(d => d.status === "ON_TRIP").length;
    const suspended = drivers.filter(d => d.status === "SUSPENDED").length;
    const avgSafety = totalDrivers > 0 ? (drivers.reduce((s, d) => s + Number(d.safetyScore), 0) / totalDrivers).toFixed(1) : "—";

    return (
        <div className="max-w-[1600px] mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("drivers.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        {t("drivers.stats", { total: totalDrivers, onDuty, onTrip })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors">
                        <Download className="w-4 h-4" /> {t("drivers.exportCSV")}
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                        <Plus className="w-4 h-4" /> {t("drivers.addDriver")}
                    </button>
                </div>
            </div>

            {/* KPI stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatMini label={t("drivers.kpi.totalDrivers")} value={`${totalDrivers}`} icon={Users} color="emerald" isDark={isDark} />
                <StatMini label={t("drivers.kpi.onDuty")} value={`${onDuty}`} icon={CheckCircle2} color="green" isDark={isDark} />
                <StatMini label={t("drivers.kpi.onTrip")} value={`${onTrip}`} icon={MapPin} color="blue" isDark={isDark} />
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

            <div className="flex gap-5">
                {/* LEFT: Driver list */}
                <div className="flex-1 space-y-4">
                    {/* Search & filter */}
                    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("drivers.searchPlaceholder")}
                                className={`${inputClass} pl-9`} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-neutral-400" />
                            {["", "ON_DUTY", "OFF_DUTY", "ON_TRIP", "SUSPENDED"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-emerald-500 text-white" : isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-100"}`}
                                >
                                    {s ? t(STATUS_CONFIG[s]?.labelKey) : t("common.all")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                        {loading ? (
                            <TableSkeleton />
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                                <Users className="w-10 h-10 mb-2 opacity-30" />
                                <p>{t("drivers.noDrivers")}</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? "text-neutral-400 border-neutral-700 bg-neutral-900/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
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
                                        return (
                                            <motion.tr key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                                onClick={() => setSelectedDriver(d)}
                                                className={`border-b last:border-0 cursor-pointer transition-colors ${selectedDriver?.id === d.id
                                                    ? (isDark ? "bg-emerald-500/10" : "bg-emerald-50")
                                                    : isDark ? "border-neutral-700 hover:bg-neutral-700/30" : "border-neutral-50 hover:bg-neutral-50/80"
                                                    }`}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{d.fullName}</p>
                                                    <div className={`flex items-center gap-2 text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                                        {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                                                        {d.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>}
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3.5 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                                                    <p className="font-mono text-xs font-bold">{d.licenseNumber}</p>
                                                    {d.licenseClass && <p className="text-xs text-neutral-400">{d.licenseClass}</p>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-lg ${safetyScoreBg(Number(d.safetyScore))} flex items-center justify-center`}>
                                                            <span className={`text-sm font-extrabold ${safetyScoreColor(Number(d.safetyScore))}`}>
                                                                {Number(d.safetyScore).toFixed(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <button onClick={(e) => { e.stopPropagation(); adjustScore(d, 5); }}
                                                                className="text-emerald-500 hover:text-emerald-600 text-xs" title="+5 safety">
                                                                <Award className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); adjustScore(d, -5); }}
                                                                className="text-red-400 hover:text-red-500 text-xs" title="-5 safety">
                                                                <TrendingDown className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isExpired ? "bg-red-100 text-red-600" : isExpiring ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(d.licenseExpiryDate).toLocaleDateString("en-IN")}
                                                        {isExpired && " (EXPIRED)"}
                                                        {isExpiring && ` (${expDays}d left)`}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="relative group inline-block">
                                                        <button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[d.status]?.className}`}>
                                                            {STATUS_CONFIG[d.status] ? t(STATUS_CONFIG[d.status].labelKey) : d.status}
                                                            <ChevronDown className="w-3 h-3" />
                                                        </button>
                                                        <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                                                            {["ON_DUTY", "OFF_DUTY", "SUSPENDED"].filter(s => s !== d.status).map(s => (
                                                                <button key={s} onClick={(e) => { e.stopPropagation(); handleStatusChange(d, s); }}
                                                                    className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50">
                                                                    {t(STATUS_CONFIG[s]?.labelKey)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                                                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-700" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"}`}>
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <AlertDialog
                                                            open={actionDriverId === d.id}
                                                            onOpenChange={(open) => !open && setActionDriverId(null)}
                                                        >
                                                                <button onClick={(e) => { e.stopPropagation(); setActionDriverId(d.id); }}
                                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* RIGHT: Driver detail + map */}
                <div className="w-[380px] shrink-0 space-y-4">
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
                                        <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{selectedDriver.fullName}</h3>
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
                                <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-700/30">
                                    <p className={`text-xs font-semibold mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("drivers.detail.safetyScore")}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-neutral-200 dark:bg-neutral-600 rounded-full h-3 overflow-hidden">
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
                            <div className={`rounded-2xl border overflow-hidden ${isDark ? "border-neutral-700" : "border-neutral-200 shadow-sm"}`}>
                                <div className={`px-4 py-2 text-xs font-semibold ${isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-50 text-neutral-500"}`}>
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
                        <div className={`rounded-2xl border flex flex-col items-center justify-center p-8 gap-3 h-[400px] ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Users className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("drivers.selectDriver")}</p>
                                <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("drivers.selectDriverDesc")}</p>
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
                            className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                                    {editDriver ? t("drivers.updateDriver") : t("drivers.addDriver")}
                                </h2>
                                <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-neutral-100 text-neutral-400"}`}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {localError && <div className="mb-4 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{localError}</div>}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.fullName")} *</label>
                                        <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className={inputClass} placeholder={t("drivers.form.fullNamePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.licenseNumber")} *</label>
                                        <input required value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value.toUpperCase() }))} className={inputClass} placeholder={t("drivers.form.licensePlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.phone")}</label>
                                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder={t("drivers.form.phonePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.email")}</label>
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} placeholder={t("drivers.form.emailPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.dateOfBirth")}</label>
                                        <input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.licenseExpiry")} *</label>
                                        <input required type="date" value={form.licenseExpiryDate} onChange={e => setForm(f => ({ ...f, licenseExpiryDate: e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.licenseClass")}</label>
                                        <input value={form.licenseClass} onChange={e => setForm(f => ({ ...f, licenseClass: e.target.value }))} className={inputClass} placeholder={t("drivers.form.licenseClassPlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("drivers.form.safetyScore")}</label>
                                        <input type="number" min="0" max="100" step="0.1" value={form.safetyScore} onChange={e => setForm(f => ({ ...f, safetyScore: +e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                                        {t("common.cancel")}
                                    </button>
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
                                        {saving ? t("common.saving") : editDriver ? t("drivers.updateDriver") : t("drivers.addDriver")}
                                    </button>
                                </div>
                            </form>
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
        blue: isDark ? "bg-blue-500/10" : "bg-blue-50",
        red: isDark ? "bg-red-500/10" : "bg-red-50",
        amber: isDark ? "bg-amber-500/10" : "bg-amber-50",
    };
    const textMap: Record<string, string> = {
        emerald: "text-emerald-500", green: "text-green-500", blue: "text-blue-500", red: "text-red-500", amber: "text-amber-500",
    };
    return (
        <div className={`rounded-2xl border p-4 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${bgMap[color]} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${textMap[color]}`} />
                </div>
                <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{label}</p>
                    <p className={`text-xl font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>{value}</p>
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
            <Icon className={`w-4 h-4 shrink-0 ${highlight ? "text-amber-500" : isDark ? "text-neutral-500" : "text-neutral-400"}`} />
            <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{label}</p>
                <p className={`text-sm font-semibold truncate ${highlight ? "text-amber-500" : isDark ? "text-white" : "text-neutral-900"}`}>{value}</p>
            </div>
        </div>
    );
}
