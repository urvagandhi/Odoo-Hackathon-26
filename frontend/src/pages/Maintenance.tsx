/**
 * Maintenance — Service Logs Management
 * Log service events; auto-triggers IN_SHOP status on vehicle
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Wrench, AlertTriangle, Calendar } from "lucide-react";
import { fleetApi, type Vehicle, type MaintenanceLog } from "../api/client";
import { useTheme } from "../context/ThemeContext";

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

export default function Maintenance() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        serviceType: "", description: "", cost: 0, odometerAtService: 0,
        technicianName: "", shopName: "", serviceDate: new Date().toISOString().slice(0, 10),
        nextServiceDue: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const v = await fleetApi.listVehicles({ limit: 100 });
            setVehicles(v.data ?? []);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!selectedVehicle) { setLogs([]); return; }
        fleetApi.getMaintenanceLogs(selectedVehicle).then(setLogs).catch(() => setLogs([]));
    }, [selectedVehicle]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicle) { setError("Select a vehicle first"); return; }
        setSaving(true); setError("");
        try {
            await fleetApi.addMaintenanceLog(selectedVehicle, form);
            // reload logs + vehicle list (status may change to IN_SHOP)
            const updated = await fleetApi.getMaintenanceLogs(selectedVehicle);
            setLogs(updated);
            setShowModal(false);
            load();
        } catch (err: unknown) {
            setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save");
        } finally { setSaving(false); }
    };

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;

    const totalCost = logs.reduce((sum, l) => sum + Number(l.cost), 0);

    return (
        <div className="max-w-[1200px] mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("maintenance.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("maintenance.subtitle")}</p>
                </div>
                <button onClick={() => { setError(""); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <Plus className="w-4 h-4" /> {t("maintenance.logService")}
                </button>
            </div>

            {/* Vehicle selector */}
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                <label className={`block text-xs font-semibold mb-2 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.selectVehicle")}</label>
                <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className={inputClass} style={{ maxWidth: 360 }}>
                    <option value="">{t("maintenance.allVehicles")}</option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.licensePlate} — {v.make} {v.model}
                            {v.status === "IN_SHOP" ? " 🔧" : ""}
                        </option>
                    ))}
                </select>
                {selectedVehicle && logs.length > 0 && (
                    <p className={`mt-2 text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        {t("maintenance.serviceCount", { count: logs.length, total: totalCost.toLocaleString() })} <span className="font-bold text-amber-500">₹{totalCost.toLocaleString()}</span>
                    </p>
                )}
            </div>

            {/* Maintenance log table */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                {!selectedVehicle ? (
                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                        <Wrench className="w-10 h-10 mb-2 opacity-30" />
                        <p>{t("maintenance.selectVehiclePrompt")}</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-32 text-neutral-400">{t("common.loading")}</div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
                        <Calendar className="w-8 h-8 mb-2 opacity-30" />
                        <p>{t("maintenance.noRecords")}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`text-xs font-semibold uppercase tracking-wide border-b ${isDark ? "text-neutral-400 border-neutral-700 bg-neutral-900/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
                                {[t("maintenance.columns.date"), t("maintenance.columns.serviceType"), t("maintenance.columns.description"), t("maintenance.columns.cost"), t("maintenance.columns.odometer"), t("maintenance.columns.shop"), t("maintenance.columns.nextDue")].map(h =>
                                    <th key={h} className="text-left px-4 py-3">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    className={`border-b last:border-0 ${isDark ? "border-neutral-700" : "border-neutral-50"}`}
                                >
                                    <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                                        {new Date(log.serviceDate).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{log.serviceType}</td>
                                    <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{log.description || "—"}</td>
                                    <td className="px-4 py-3 text-amber-500 font-bold">₹{Number(log.cost).toLocaleString()}</td>
                                    <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>{Number(log.odometerAtService).toLocaleString()} km</td>
                                    <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                                        {[log.shopName, log.technicianName].filter(Boolean).join(" / ") || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {log.nextServiceDue ? (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${new Date(log.nextServiceDue) <= new Date() ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                                                {new Date(log.nextServiceDue).toLocaleDateString("en-IN")}
                                            </span>
                                        ) : "—"}
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
                            className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white"}`}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("maintenance.form.title")}</h2>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.vehicle")} *</label>
                                    <select required value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className={inputClass}>
                                        <option value="">{t("maintenance.selectVehicle")}</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.serviceType")} *</label>
                                        <input required value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className={inputClass} placeholder={t("maintenance.form.serviceTypePlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.cost")} *</label>
                                        <input required type="number" min="0" value={form.cost || ""} onChange={e => setForm(f => ({ ...f, cost: +e.target.value }))} className={inputClass} placeholder="5000" />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.description")}</label>
                                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} placeholder={t("maintenance.form.descriptionPlaceholder")} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.odometer")} *</label>
                                        <input required type="number" min="0" value={form.odometerAtService || ""} onChange={e => setForm(f => ({ ...f, odometerAtService: +e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.serviceDate")} *</label>
                                        <input required type="date" value={form.serviceDate} onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))} className={inputClass} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.shopName")}</label>
                                        <input value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} className={inputClass} placeholder={t("maintenance.form.shopPlaceholder")} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.technician")}</label>
                                        <input value={form.technicianName} onChange={e => setForm(f => ({ ...f, technicianName: e.target.value }))} className={inputClass} placeholder={t("maintenance.form.technicianPlaceholder")} />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("maintenance.form.nextServiceDue")}</label>
                                    <input type="date" value={form.nextServiceDue} onChange={e => setForm(f => ({ ...f, nextServiceDue: e.target.value }))} className={inputClass} />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{t("common.cancel")}</button>
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                                        {saving ? t("common.saving") : t("maintenance.logService")}
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
