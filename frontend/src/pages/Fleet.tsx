/**
 * Fleet — Vehicle Registry (Asset Management)
 * CRUD for vehicles with status management, vehicle type filter
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Edit3, Trash2, X, Truck, ChevronDown } from "lucide-react";
import { fleetApi, type Vehicle, type VehicleType } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
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

const STATUS_CONFIG: Record<string, { labelKey: string; className: string }> = {
    AVAILABLE: { labelKey: "fleet.status.AVAILABLE", className: "bg-emerald-100 text-emerald-700" },
    ON_TRIP: { labelKey: "fleet.status.ON_TRIP", className: "bg-blue-100 text-blue-700" },
    IN_SHOP: { labelKey: "fleet.status.IN_SHOP", className: "bg-amber-100 text-amber-700" },
    RETIRED: { labelKey: "fleet.status.RETIRED", className: "bg-neutral-100 text-neutral-500" },
};

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

export default function Fleet() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const toast = useToast();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<Partial<Vehicle & { vehicleTypeId: string }>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [actionVehicleId, setActionVehicleId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [v, vt] = await Promise.all([
                fleetApi.listVehicles({ limit: 100 }),
                fleetApi.listVehicleTypes(),
            ]);
            setVehicles(v.data ?? []);
            setVehicleTypes(vt ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = vehicles.filter(v =>
        (!statusFilter || v.status === statusFilter) &&
        (!search || v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
            `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()))
    );

    const openCreate = () => { setEditVehicle(null); setForm({ currentOdometer: 0 }); setError(""); setShowModal(true); };
    const openEdit = (v: Vehicle) => { setEditVehicle(v); setForm({ ...v, vehicleTypeId: v.vehicleType?.id }); setError(""); setShowModal(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError("");
        try {
            if (editVehicle) {
                await fleetApi.updateVehicle(editVehicle.id, form);
                toast.success(t("fleet.toast.updated"), { title: t("fleet.toast.updatedTitle") });
            } else {
                await fleetApi.createVehicle(form as Parameters<typeof fleetApi.createVehicle>[0]);
                toast.success(t("fleet.toast.created"), { title: t("fleet.toast.createdTitle") });
            }
            setShowModal(false);
            load();
        } catch (err: unknown) {
            setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t("fleet.toast.retireFailed"));
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await fleetApi.deleteVehicle(id);
            toast.success(t("fleet.toast.retired"));
            load();
        } catch {
            toast.error(t("fleet.toast.retireFailed"));
        }
        setActionVehicleId(null);
    };

    const handleStatusChange = async (v: Vehicle, status: string) => {
        try {
            await fleetApi.updateVehicleStatus(v.id, status);
            toast.success(t("fleet.toast.statusUpdated"), { title: t("fleet.toast.updatedTitle") });
            load();
        } catch {
            toast.error(t("fleet.toast.statusFailed"));
        }
    };

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;

    return (
        <div className="max-w-[1400px] mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("fleet.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fleet.vehiclesInFleet", { count: vehicles.length })}</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all active:scale-[0.97]">
                    <Plus className="w-4 h-4" /> {t("fleet.addVehicle")}
                </button>
            </div>

            {/* Filters */}
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
                <div className="relative w-full sm:flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t("fleet.searchPlaceholder")}
                        className={`${inputClass} pl-9`}
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                    <Filter className="w-4 h-4 text-neutral-400 shrink-0" />
                    {["", "AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s
                                    ? "bg-emerald-500 text-white"
                                    : isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-neutral-600 hover:bg-neutral-100"
                                }`}
                        >
                            {s ? t(STATUS_CONFIG[s]?.labelKey) : t("common.all")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                {loading ? (
                    <div className="flex items-center justify-center h-40 text-neutral-400">{t("common.loading")}</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                        <Truck className="w-10 h-10 mb-2 opacity-30" />
                        <p>{t("fleet.noVehicles")}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                        <thead>
                            <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? "text-neutral-400 border-neutral-700 bg-neutral-900/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
                                {[
                                    t("fleet.columns.vehicle"),
                                    t("fleet.columns.type"),
                                    t("fleet.columns.licensePlate"),
                                    t("fleet.columns.capacity"),
                                    t("fleet.columns.odometer"),
                                    t("fleet.columns.status"),
                                    t("fleet.columns.actions"),
                                ].map(h =>
                                    <th key={h} className="text-left px-4 py-3">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((v, i) => (
                                <motion.tr
                                    key={v.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className={`border-b last:border-0 transition-colors ${isDark ? "border-neutral-700 hover:bg-neutral-700/30" : "border-neutral-50 hover:bg-neutral-50/80"}`}
                                >
                                    <td className="px-4 py-3.5">
                                        <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{v.year} {v.make} {v.model}</p>
                                        {v.color && <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{v.color}</p>}
                                    </td>
                                    <td className={`px-4 py-3.5 text-xs font-medium ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <VehicleTypeThumbnail typeName={v.vehicleType?.name ?? ""} />
                                            {v.vehicleType?.name ?? "—"}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3.5 font-mono text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                        {v.licensePlate}
                                    </td>
                                    <td className={`px-4 py-3.5 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                                        {v.capacityWeight ? `${v.capacityWeight} kg` : "—"}
                                    </td>
                                    <td className={`px-4 py-3.5 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
                                        {v.currentOdometer?.toLocaleString()} km
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="relative group inline-block" tabIndex={0}>
                                            <button className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[v.status]?.className}`}>
                                                {STATUS_CONFIG[v.status] ? t(STATUS_CONFIG[v.status].labelKey) : v.status}
                                                <ChevronDown className="w-3 h-3" />
                                            </button>
                                            <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block group-focus-within:block bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-[130px]">
                                                {["AVAILABLE", "IN_SHOP", "RETIRED"].map(s =>
                                                    s !== v.status && (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(v, s)}
                                                            className="block w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"
                                                        >
                                                            {t(STATUS_CONFIG[s]?.labelKey)}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(v)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-700" : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"}`}>
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {v.status !== "ON_TRIP" && (
                                                <AlertDialog
                                                    open={actionVehicleId === v.id}
                                                    onOpenChange={(open) => !open && setActionVehicleId(null)}
                                                >
                                                        <button onClick={() => setActionVehicleId(v.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("fleet.retireVehicle")}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("fleet.retireVehicleDesc", { plate: v.licensePlate })}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction variant="destructive" onClick={() => handleDelete(v.id)}>
                                                                {t("fleet.retireVehicle")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {/* Modal */}
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
                                    {editVehicle ? t("fleet.editVehicle") : t("fleet.addNewVehicle")}
                                </h2>
                                <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-neutral-100 text-neutral-400"}`}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {error && <div className="mb-4 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.make")} *</label>
                                        <input required value={form.make ?? ""} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className={inputClass} placeholder={t("fleet.form.makePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.model")} *</label>
                                        <input required value={form.model ?? ""} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className={inputClass} placeholder={t("fleet.form.modelPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.year")} *</label>
                                        <input required type="number" min="1990" max="2030" value={form.year ?? ""} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.color")}</label>
                                        <input value={form.color ?? ""} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className={inputClass} placeholder={t("fleet.form.colorPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.licensePlate")} *</label>
                                        <input required value={form.licensePlate ?? ""} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))} className={inputClass} placeholder={t("fleet.form.platePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.vin")}</label>
                                        <input value={form.vin ?? ""} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className={inputClass} placeholder={t("fleet.form.vinPlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.vehicleType")} *</label>
                                        <select required value={form.vehicleTypeId ?? ""} onChange={e => setForm(f => ({ ...f, vehicleTypeId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("fleet.form.selectType")}</option>
                                            {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.capacity")}</label>
                                        <input type="number" min="0" value={form.capacityWeight ?? ""} onChange={e => setForm(f => ({ ...f, capacityWeight: +e.target.value }))} className={inputClass} placeholder="5000" />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.odometer")}</label>
                                    <input type="number" min="0" value={form.currentOdometer ?? ""} onChange={e => setForm(f => ({ ...f, currentOdometer: +e.target.value }))} className={inputClass} placeholder="0" />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                                        {t("common.cancel")}
                                    </button>
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-60">
                                        {saving ? t("common.saving") : editVehicle ? t("fleet.updateVehicle") : t("fleet.createVehicle")}
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
