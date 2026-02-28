import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Edit3, Trash2, X, Truck, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "../components/ui/Select";
import { fleetApi, type Vehicle } from "../api/client";
import { TableSkeleton } from "../components/ui/TableSkeleton";
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
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [regionFilter, setRegionFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
    const [form, setForm] = useState<Partial<Vehicle & { vehicleTypeId: string }>>({});
    const [localError, setLocalError] = useState("");
    const [actionVehicleId, setActionVehicleId] = useState<string | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Queries
    const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
        queryKey: ["vehicles"],
        queryFn: () => fleetApi.listVehicles({ limit: 100 }).then(res => res.data ?? []),
    });

    const { data: vehicleTypes = [] } = useQuery({
        queryKey: ["vehicle-types"],
        queryFn: () => fleetApi.listVehicleTypes().then(res => res ?? []),
    });

    const loading = loadingVehicles;

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editVehicle) {
                return fleetApi.updateVehicle(editVehicle.id, payload);
            } else {
                return fleetApi.createVehicle(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(editVehicle ? t("fleet.toast.updated") : t("fleet.toast.created"), { 
                title: editVehicle ? t("fleet.toast.updatedTitle") : t("fleet.toast.createdTitle") 
            });
            setShowModal(false);
        },
        onError: (err: any) => {
            const response = err.response;
            if (response?.status === 422 && response.data?.details) {
                const details = response.data.details;
                const errorMsg = Object.entries(details)
                    .map(([field, msgs]: [any, any]) => `${field}: ${msgs.join(', ')}`)
                    .join('; ');
                setLocalError(`${t("common.error")}: ${errorMsg}`);
            } else {
                setLocalError(response?.data?.message ?? t("common.error"));
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => fleetApi.deleteVehicle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(t("fleet.toast.retired"));
            setActionVehicleId(null);
        },
        onError: () => {
            toast.error(t("fleet.toast.retireFailed"));
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) => fleetApi.updateVehicleStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(t("fleet.toast.statusUpdated"), { title: t("fleet.toast.updatedTitle") });
        },
        onError: () => {
            toast.error(t("fleet.toast.statusFailed"));
        }
    });

    // Close dropdown on outside click
    useEffect(() => {
        const h = () => setOpenDropdownId(null);
        window.addEventListener("click", h);
        return () => window.removeEventListener("click", h);
    }, []);

    const filtered = vehicles.filter(v => {
        const matchStatus = !statusFilter || v.status === statusFilter;
        const matchRegion = !regionFilter || (v as any).region === regionFilter;
        const matchSearch = !search ||
            v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
            v.make.toLowerCase().includes(search.toLowerCase()) ||
            v.model.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchRegion && matchSearch;
    });

    const openCreate = () => { setEditVehicle(null); setForm({ currentOdometer: 0 }); setLocalError(""); setShowModal(true); };
    const openEdit = (v: Vehicle) => { setEditVehicle(v); setForm({ ...v, vehicleTypeId: v.vehicleType?.id }); setLocalError(""); setShowModal(true); };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");
        
        // Clean payload
        const {
            id, licensePlate, currentOdometer, vehicleType, driver,
            createdAt, updatedAt, ...cleanForm
        } = form as any;

        const payload = {
            ...cleanForm,
            year: Number(form.year),
            vehicleTypeId: Number(form.vehicleTypeId),
            ...(form.capacityWeight != null ? { capacityWeight: Number(form.capacityWeight) } : {}),
            ...(form.capacityVolume != null ? { capacityVolume: Number(form.capacityVolume) } : {}),
            ...(form.acquisitionCost != null ? { acquisitionCost: Number(form.acquisitionCost) } : {}),
            ...(editVehicle ? {} : { licensePlate: form.licensePlate, currentOdometer: Number(form.currentOdometer) })
        };

        saveMutation.mutate(payload);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleStatusChange = (v: Vehicle, status: string) => {
        statusMutation.mutate({ id: v.id, status });
    };

    const saving = saveMutation.isPending;

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;

    return (
        <div className="max-w-[1400px] mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("fleet.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fleet.vehiclesInFleet", { count: vehicles.length })}</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <Plus className="w-4 h-4" /> {t("fleet.addVehicle")}
                </button>
            </div>

            {/* Filters */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t("fleet.searchPlaceholder")}
                        className={`${inputClass} pl-9`}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-400" />
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
                <div className="flex items-center gap-2 border-l pl-2 border-neutral-200 dark:border-neutral-700">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <Select
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        className={`rounded-xl border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${isDark ? "bg-neutral-700 border-neutral-600 text-white" : "bg-white border-neutral-200 text-neutral-900"}`}
                    >
                        <option value="">{t("common.all")} {t("fleet.form.region")}</option>
                        {["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL", "INTERNATIONAL"].map(r => (
                            <option key={r} value={r}>{t(`fleet.form.regions.${r}`)}</option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                {loading ? (
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b last:border-0">
                            <td colSpan={7} className="p-0">
                                <TableSkeleton />
                            </td>
                            </tr>
                        </tbody>
                    </table>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                        <Truck className="w-10 h-10 mb-2 opacity-30" />
                        <p>{t("fleet.noVehicles")}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
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
                                        {v.vehicleType?.name ?? "—"}
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
                                        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                                            <button
                                                disabled={v.status === "RETIRED"}
                                                onClick={() => setOpenDropdownId(openDropdownId === v.id ? null : v.id)}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${STATUS_CONFIG[v.status]?.className} ${v.status === "RETIRED" ? "opacity-60 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
                                            >
                                                {STATUS_CONFIG[v.status] ? t(STATUS_CONFIG[v.status].labelKey) : v.status}
                                                {v.status !== "RETIRED" && <ChevronDown className={`w-3 h-3 transition-transform ${openDropdownId === v.id ? "rotate-180" : ""}`} />}
                                            </button>
                                            
                                            <AnimatePresence>
                                                {openDropdownId === v.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                                        className={`absolute left-0 top-full mt-1 z-30 border rounded-xl shadow-xl py-1 min-w-[140px] ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-100"}`}
                                                    >
                                                        {(v.status === "ON_TRIP" ? ["IN_SHOP"] : ["AVAILABLE", "IN_SHOP", "RETIRED"]).map(s =>
                                                            s !== v.status && (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => {
                                                                        handleStatusChange(v, s);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className={`block w-full text-left px-3 py-2 text-xs transition-colors ${isDark ? "text-neutral-300 hover:bg-neutral-700 hover:text-white" : "text-neutral-700 hover:bg-neutral-50"}`}
                                                                >
                                                                    {t(STATUS_CONFIG[s]?.labelKey)}
                                                                </button>
                                                            )
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
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
                                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                                    {editVehicle ? t("fleet.editVehicle") : t("fleet.addNewVehicle")}
                                </h2>
                                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-neutral-700 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900"}`}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {localError && <div className="mb-4 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-3">{localError}</div>}

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Section 1: Basic Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <Truck className="w-4 h-4 text-emerald-500" />
                                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("nav.sections.general")}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.make")} *</label>
                                            <input required value={form.make ?? ""} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className={inputClass} placeholder={t("fleet.form.makePlaceholder")} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.model")} *</label>
                                            <input required value={form.model ?? ""} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className={inputClass} placeholder={t("fleet.form.modelPlaceholder")} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.year")} *</label>
                                            <input required type="number" min="1990" max="2030" value={form.year ?? ""} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.color")}</label>
                                            <input value={form.color ?? ""} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className={inputClass} placeholder={t("fleet.form.colorPlaceholder")} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Registration Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <Search className="w-4 h-4 text-blue-500" />
                                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>REGISTRATION & REGION</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.licensePlate")} *</label>
                                            <input required value={form.licensePlate ?? ""} onChange={e => setForm(f => ({ ...f, licensePlate: e.target.value.toUpperCase() }))} className={`${inputClass} font-mono font-bold tracking-wider`} placeholder={t("fleet.form.platePlaceholder")} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.region")}</label>
                                            <Select value={form.region ?? ""} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className={inputClass}>
                                                <option value="">{t("fleet.form.selectRegion")}</option>
                                                {["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL", "INTERNATIONAL"].map(r => (
                                                    <option key={r} value={r}>{t(`fleet.form.regions.${r}`)}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.vin")}</label>
                                        <input value={form.vin ?? ""} onChange={e => setForm(f => ({ ...f, vin: e.target.value.toUpperCase() }))} className={`${inputClass} font-mono text-xs`} placeholder={t("fleet.form.vinPlaceholder")} maxLength={17} />
                                    </div>
                                </div>

                                {/* Section 3: Technical Specs */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <Filter className="w-4 h-4 text-amber-500" />
                                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>TECHNICAL SPECIFICATIONS</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.vehicleType")} *</label>
                                            <Select required value={form.vehicleTypeId ?? ""} onChange={e => setForm(f => ({ ...f, vehicleTypeId: e.target.value }))} className={inputClass}>
                                                <option value="">{t("fleet.form.selectType")}</option>
                                                {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.capacity")} (kg) *</label>
                                            <div className="relative">
                                                <input required type="number" min="1" value={form.capacityWeight ?? ""} onChange={e => setForm(f => ({ ...f, capacityWeight: +e.target.value }))} className={inputClass} placeholder="5000" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">KG</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fleet.form.odometer")} (km)</label>
                                        <div className="relative">
                                            <input type="number" min="0" value={form.currentOdometer ?? ""} onChange={e => setForm(f => ({ ...f, currentOdometer: +e.target.value }))} className={inputClass} placeholder="0" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400">KM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t dark:border-neutral-700">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                                        {t("common.cancel")}
                                    </button>
                                    <button type="submit" disabled={saving} className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 ${isDark ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"}`}>
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
