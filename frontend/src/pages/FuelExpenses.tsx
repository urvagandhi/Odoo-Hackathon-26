import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Fuel, DollarSign, AlertTriangle, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "../components/ui/Select";
import { fleetApi, financeApi } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { TableSkeleton } from "../components/ui/TableSkeleton";

const FIELD = "block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors";

const EXPENSE_CATEGORIES = ["TOLL", "LODGING", "MAINTENANCE_EN_ROUTE", "MISC"];

export default function FuelExpenses() {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<"fuel" | "expenses">("fuel");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [vehicleFilter, setVehicleFilter] = useState("");

    const [fuelForm, setFuelForm] = useState({
        vehicleId: "", liters: 0, costPerLiter: 0, odometerAtFill: 0, fuelStation: "", loggedAt: new Date().toISOString().slice(0, 10),
    });
    const [expenseForm, setExpenseForm] = useState({
        vehicleId: "", amount: 0, category: "TOLL" as "TOLL" | "LODGING" | "MAINTENANCE_EN_ROUTE" | "MISC", description: "",
    });

    // Queries
    const { data: vehicles = [] } = useQuery({
        queryKey: ["vehicles"],
        queryFn: () => fleetApi.listVehicles({ limit: 100 }).then(res => res.data ?? []),
    });

    const { data: fuelLogs = [], isLoading: loadingFuel } = useQuery({
        queryKey: ["fuel-logs", vehicleFilter],
        queryFn: () => financeApi.listFuelLogs({ vehicleId: vehicleFilter || undefined }).then(res => Array.isArray(res) ? res : []),
    });

    const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
        queryKey: ["expenses", vehicleFilter],
        queryFn: () => financeApi.listExpenses({ vehicleId: vehicleFilter || undefined }).then(res => Array.isArray(res) ? res : []),
    });

    const loading = loadingFuel || loadingExpenses;

    // Mutations
    const fuelMutation = useMutation({
        mutationFn: (data: any) => financeApi.createFuelLog({ ...data, loggedAt: new Date(data.loggedAt).toISOString() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
            setShowModal(false);
            setFuelForm({
                vehicleId: "", liters: 0, costPerLiter: 0, odometerAtFill: 0, fuelStation: "", loggedAt: new Date().toISOString().slice(0, 10),
            });
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Failed to save");
        }
    });

    const expenseMutation = useMutation({
        mutationFn: (data: any) => financeApi.createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            setShowModal(false);
            setExpenseForm({
                vehicleId: "", amount: 0, category: "TOLL", description: "",
            });
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? "Failed to save");
        }
    });

    const handleFuelSave = async (e: React.FormEvent) => {
        e.preventDefault(); setError("");
        fuelMutation.mutate(fuelForm);
    };

    const handleExpenseSave = async (e: React.FormEvent) => {
        e.preventDefault(); setError("");
        expenseMutation.mutate(expenseForm);
    };

    const totalFuel = fuelLogs.reduce((s, l) => s + Number(l.totalCost), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const inputClass = `${FIELD} ${isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400"}`;
    const cardClass = `rounded-2xl border p-5 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`;

    const saving = fuelMutation.isPending || expenseMutation.isPending;

    return (
        <div className="max-w-[1200px] mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{t("fuelExpenses.title")}</h1>
                    <p className={`text-sm ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fuelExpenses.subtitle")}</p>
                </div>
                <button onClick={() => { setError(""); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <Plus className="w-4 h-4" /> {t("fuelExpenses.addEntry")}
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className={cardClass}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Fuel className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fuelExpenses.totalFuelCost")}</p>
                            <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>₹{totalFuel.toLocaleString()}</p>
                            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fuelExpenses.fillUps", { count: fuelLogs.length })}</p>
                        </div>
                    </div>
                </div>
                <div className={cardClass}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                        <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fuelExpenses.totalExpenses")}</p>
                            <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>₹{totalExpenses.toLocaleString()}</p>
                            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{t("fuelExpenses.entries", { count: expenses.length })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Tabs */}
            <div className={`flex items-center justify-between p-3 rounded-2xl border gap-4 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-xl p-1">
                    <button onClick={() => setTab("fuel")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === "fuel" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-500"}`}>
                        {t("fuelExpenses.fuelLogs")}
                    </button>
                    <button onClick={() => setTab("expenses")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === "expenses" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-500"}`}>
                        {t("fuelExpenses.expensesTab")}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <Select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className={`${inputClass} max-w-[220px]`}>
                        <option value="">{t("fuelExpenses.allVehicles")}</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make}</option>)}
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200 shadow-sm"}`}>
                {tab === "fuel" ? (
                    loading ? (
                        <TableSkeleton />
                    ) : fuelLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-neutral-400"><Fuel className="w-8 h-8 mb-2 opacity-30" /><p>{t("fuelExpenses.noFuelLogs")}</p></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-xs font-semibold uppercase border-b ${isDark ? "text-neutral-400 border-neutral-700 bg-neutral-900/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
                                    {[t("fuelExpenses.fuelColumns.date"), t("fuelExpenses.fuelColumns.vehicle"), t("fuelExpenses.fuelColumns.liters"), t("fuelExpenses.fuelColumns.costPerLiter"), t("fuelExpenses.fuelColumns.total"), t("fuelExpenses.fuelColumns.odometer"), t("fuelExpenses.fuelColumns.station")].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {fuelLogs.map((log, i) => (
                                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className={`border-b last:border-0 ${isDark ? "border-neutral-700" : "border-neutral-50"}`}
                                    >
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{new Date(log.loggedAt).toLocaleDateString("en-IN")}</td>
                                        <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{log.vehicle?.licensePlate ?? "—"}</td>
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{Number(log.liters).toFixed(1)} L</td>
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{Number(log.costPerLiter).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-blue-500 font-bold">₹{Number(log.totalCost).toLocaleString()}</td>
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{Number(log.odometerAtFill).toLocaleString()} km</td>
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{log.fuelStation || "—"}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    loading ? (
                        <TableSkeleton />
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-neutral-400"><DollarSign className="w-8 h-8 mb-2 opacity-30" /><p>{t("fuelExpenses.noExpenses")}</p></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-xs font-semibold uppercase border-b ${isDark ? "text-neutral-400 border-neutral-700 bg-neutral-900/30" : "text-neutral-500 border-neutral-100 bg-neutral-50"}`}>
                                    {[t("fuelExpenses.expenseColumns.date"), t("fuelExpenses.expenseColumns.vehicle"), t("fuelExpenses.expenseColumns.category"), t("fuelExpenses.expenseColumns.amount"), t("fuelExpenses.expenseColumns.description")].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp, i) => (
                                    <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className={`border-b last:border-0 ${isDark ? "border-neutral-700" : "border-neutral-50"}`}
                                    >
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{new Date(exp.dateLogged).toLocaleDateString("en-IN")}</td>
                                        <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{exp.vehicleId}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{exp.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-amber-500 font-bold">₹{Number(exp.amount).toLocaleString()}</td>
                                        <td className={`px-4 py-3 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{exp.description || "—"}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )
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
                            className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white"}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-1">
                                    <button onClick={() => setTab("fuel")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === "fuel" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{t("fuelExpenses.form.fuelTab")}</button>
                                    <button onClick={() => setTab("expenses")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === "expenses" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>{t("fuelExpenses.form.expenseTab")}</button>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"><X className="w-4 h-4" /></button>
                            </div>

                            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

                            {tab === "fuel" ? (
                                <form onSubmit={handleFuelSave} className="space-y-4">
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.vehicle")}</label>
                                        <Select required value={fuelForm.vehicleId} onChange={e => setFuelForm(f => ({ ...f, vehicleId: e.target.value }))} className={inputClass}>
                                            <option value="">{t("fuelExpenses.form.selectVehicle")}</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make}</option>)}
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.liters")}</label>
                                            <input required type="number" step="0.1" min="0" value={fuelForm.liters || ""} onChange={e => setFuelForm(f => ({ ...f, liters: +e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.costPerLiter")}</label>
                                            <input required type="number" step="0.01" min="0" value={fuelForm.costPerLiter || ""} onChange={e => setFuelForm(f => ({ ...f, costPerLiter: +e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.odometer")}</label>
                                            <input required type="number" min="0" value={fuelForm.odometerAtFill || ""} onChange={e => setFuelForm(f => ({ ...f, odometerAtFill: +e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>
                                    {fuelForm.liters > 0 && fuelForm.costPerLiter > 0 && (
                                        <p className="text-xs text-emerald-600 font-semibold">{t("fuelExpenses.form.totalLabel", { amount: (fuelForm.liters * fuelForm.costPerLiter).toFixed(2) })}</p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.station")}</label>
                                            <input value={fuelForm.fuelStation} onChange={e => setFuelForm(f => ({ ...f, fuelStation: e.target.value }))} className={inputClass} placeholder={t("fuelExpenses.form.stationPlaceholder")} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.date")}</label>
                                            <input type="date" value={fuelForm.loggedAt} onChange={e => setFuelForm(f => ({ ...f, loggedAt: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{t("common.cancel")}</button>
                                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition-colors">
                                            {saving ? t("common.saving") : t("fuelExpenses.form.logFuel")}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleExpenseSave} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.vehicle")}</label>
                                            <Select required value={expenseForm.vehicleId} onChange={e => setExpenseForm(f => ({ ...f, vehicleId: e.target.value }))} className={inputClass}>
                                                <option value="">{t("fuelExpenses.form.selectVehicle")}</option>
                                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.licensePlate}</option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.category")}</label>
                                            <Select required value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as typeof expenseForm.category }))} className={inputClass}>
                                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.amount")}</label>
                                        <input required type="number" min="0" step="0.01" value={expenseForm.amount || ""} onChange={e => setExpenseForm(f => ({ ...f, amount: +e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{t("fuelExpenses.form.description")}</label>
                                        <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className={inputClass} placeholder={t("fuelExpenses.form.descriptionPlaceholder")} />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>{t("common.cancel")}</button>
                                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                                            {saving ? t("common.saving") : t("fuelExpenses.form.logExpense")}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
