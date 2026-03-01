/**
 * ExpenseForm — slide-over with two tabs: Fuel Log and Misc Expense.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Fuel, Receipt } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { fleetApi, financeApi } from "../../api/client";
import {
  createFuelLogSchema,
  createExpenseSchema,
  type CreateFuelLogFormData,
  type CreateExpenseFormData,
} from "../../validators/finance";
import { Select } from "../ui/Select";

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
}

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: "fuel" | "expense";
}

const FUEL_INITIAL: CreateFuelLogFormData = {
  vehicleId: "",
  tripId: "",
  liters: 0,
  costPerLiter: 0,
  odometerAtFill: 0,
  fuelStation: "",
};

const EXPENSE_INITIAL: CreateExpenseFormData = {
  vehicleId: "",
  tripId: "",
  amount: 0,
  category: "TOLL",
  description: "",
};

const CATEGORY_VALUES = ["TOLL", "LODGING", "MAINTENANCE_EN_ROUTE", "MISC"] as const;

export function ExpenseForm({ open, onClose, onSuccess, defaultTab = "fuel" }: ExpenseFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"fuel" | "expense">(defaultTab);
  const [fuelForm, setFuelForm] = useState<CreateFuelLogFormData>(FUEL_INITIAL);
  const [expForm, setExpForm] = useState<CreateExpenseFormData>(EXPENSE_INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    if (!open) return;
    setFuelForm(FUEL_INITIAL);
    setExpForm(EXPENSE_INITIAL);
    setErrors({});
    setServerError("");
    setTab(defaultTab);
    setLoadingVehicles(true);
    fleetApi
      .listVehicles({ limit: 500 })
      .then((res) => {
        setVehicles(res.data.filter((v) => v.status !== "RETIRED").map((v) => ({ ...v, id: String(v.id) })));
      })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, [open, defaultTab]);

  const handleFuelChange = (field: keyof CreateFuelLogFormData, value: string | number) => {
    setFuelForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleExpChange = (field: keyof CreateExpenseFormData, value: string | number) => {
    setExpForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const totalCost = (fuelForm.liters || 0) * (fuelForm.costPerLiter || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    if (tab === "fuel") {
      const result = createFuelLogSchema.safeParse(fuelForm);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const key = err.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setSubmitting(true);
      try {
        await financeApi.createFuelLog({
          vehicleId: result.data.vehicleId,
          tripId: result.data.tripId || undefined,
          liters: result.data.liters,
          costPerLiter: result.data.costPerLiter,
          odometerAtFill: result.data.odometerAtFill,
          fuelStation: result.data.fuelStation || undefined,
        });
        onSuccess();
        onClose();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setServerError(axiosErr.response?.data?.message ?? "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    } else {
      const result = createExpenseSchema.safeParse(expForm);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const key = err.path[0] as string;
          if (!fieldErrors[key]) fieldErrors[key] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      setSubmitting(true);
      try {
        await financeApi.createExpense({
          vehicleId: result.data.vehicleId,
          tripId: result.data.tripId || undefined,
          amount: result.data.amount,
          category: result.data.category,
          description: result.data.description || undefined,
        });
        onSuccess();
        onClose();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setServerError(axiosErr.response?.data?.message ?? "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
    isDark
      ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;
  const labelCls = `block text-xs font-semibold mb-1 ${isDark ? "text-neutral-300" : "text-slate-600"}`;
  const errCls = "text-xs text-red-500 mt-0.5";
  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      active
        ? isDark
          ? "bg-neutral-700 text-white border-b-2 border-violet-500"
          : "bg-white text-slate-900 border-b-2 border-violet-600"
        : isDark
        ? "text-[#6B7C6B] hover:text-neutral-200"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ef-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            key="ef-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 z-[9991] w-full max-w-lg shadow-2xl flex flex-col ${
              isDark ? "bg-[#111A15]" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? "border-[#1E2B22]" : "border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                  {tab === "fuel" ? <Fuel className="w-4.5 h-4.5 text-white" /> : <Receipt className="w-4.5 h-4.5 text-white" />}
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {tab === "fuel" ? t("forms.expense.fuelTitle") : t("forms.expense.expenseTitle")}
                  </h2>
                  <p className={`text-xs ${isDark ? "text-[#6B7C6B]" : "text-slate-500"}`}>
                    {tab === "fuel" ? t("forms.expense.fuelSubtitle") : t("forms.expense.expenseSubtitle")}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-neutral-700 text-[#6B7C6B]" : "hover:bg-slate-100 text-slate-400"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex px-6 pt-3 border-b ${isDark ? "border-[#1E2B22]" : "border-slate-100"}`}>
              <button className={tabCls(tab === "fuel")} onClick={() => { setTab("fuel"); setErrors({}); setServerError(""); }}>
                <Fuel className="w-3.5 h-3.5 inline mr-1.5" /> {t("forms.expense.fuelTab")}
              </button>
              <button className={tabCls(tab === "expense")} onClick={() => { setTab("expense"); setErrors({}); setServerError(""); }}>
                <Receipt className="w-3.5 h-3.5 inline mr-1.5" /> {t("forms.expense.expenseTab")}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {serverError && (
                <div className={`p-3 rounded-lg text-sm ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {serverError}
                </div>
              )}

              {loadingVehicles ? (
                <div className={`py-8 text-center text-sm ${isDark ? "text-[#6B7C6B]" : "text-slate-500"}`}>
                  <svg className="w-5 h-5 mx-auto mb-2 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("forms.expense.loadingVehicles")}
                </div>
              ) : tab === "fuel" ? (
                /* ── FUEL LOG ── */
                <>
                  <div>
                    <label className={labelCls}>{t("forms.expense.vehicle")}</label>
                    <Select className={inputCls} error={!!errors.vehicleId} value={fuelForm.vehicleId} onChange={(e) => handleFuelChange("vehicleId", e.target.value)}>
                      <option value="">{t("forms.expense.selectVehicle")}</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
                    </Select>
                    {errors.vehicleId && <p className={errCls}>{errors.vehicleId}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.tripId")}</label>
                    <input className={inputCls} placeholder={t("forms.expense.tripIdPlaceholder")} value={fuelForm.tripId ?? ""} onChange={(e) => handleFuelChange("tripId", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t("forms.expense.liters")}</label>
                      <input type="number" step="0.01" className={`${inputCls} ${errors.liters ? "border-red-400" : ""}`} value={fuelForm.liters || ""} onChange={(e) => handleFuelChange("liters", e.target.value)} />
                      {errors.liters && <p className={errCls}>{errors.liters}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>{t("forms.expense.costPerLiter")}</label>
                      <input type="number" step="0.01" className={`${inputCls} ${errors.costPerLiter ? "border-red-400" : ""}`} value={fuelForm.costPerLiter || ""} onChange={(e) => handleFuelChange("costPerLiter", e.target.value)} />
                      {errors.costPerLiter && <p className={errCls}>{errors.costPerLiter}</p>}
                    </div>
                  </div>
                  {/* Live total */}
                  <div className={`p-3 rounded-lg text-center text-lg font-bold ${isDark ? "bg-neutral-700 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                    {t("forms.expense.totalLabel", { amount: totalCost.toFixed(2) })}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.odometerAtFill")}</label>
                    <input type="number" className={`${inputCls} ${errors.odometerAtFill ? "border-red-400" : ""}`} value={fuelForm.odometerAtFill || ""} onChange={(e) => handleFuelChange("odometerAtFill", e.target.value)} />
                    {errors.odometerAtFill && <p className={errCls}>{errors.odometerAtFill}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.fuelStation")}</label>
                    <input className={inputCls} placeholder={t("forms.expense.fuelStationPlaceholder")} value={fuelForm.fuelStation ?? ""} onChange={(e) => handleFuelChange("fuelStation", e.target.value)} />
                  </div>
                </>
              ) : (
                /* ── EXPENSE ── */
                <>
                  <div>
                    <label className={labelCls}>{t("forms.expense.vehicle")}</label>
                    <Select className={inputCls} error={!!errors.vehicleId} value={expForm.vehicleId} onChange={(e) => handleExpChange("vehicleId", e.target.value)}>
                      <option value="">{t("forms.expense.selectVehicle")}</option>
                      {vehicles.map((v) => <option key={v.id} value={v.id}>{v.licensePlate} — {v.make} {v.model}</option>)}
                    </Select>
                    {errors.vehicleId && <p className={errCls}>{errors.vehicleId}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.tripId")}</label>
                    <input className={inputCls} placeholder={t("forms.expense.tripIdPlaceholder")} value={expForm.tripId ?? ""} onChange={(e) => handleExpChange("tripId", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.category")}</label>
                    <Select className={inputCls} error={!!errors.category} value={expForm.category} onChange={(e) => handleExpChange("category", e.target.value)}>
                      {CATEGORY_VALUES.map((c) => <option key={c} value={c}>{t(`forms.expense.categories.${c}`)}</option>)}
                    </Select>
                    {errors.category && <p className={errCls}>{errors.category}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.amount")}</label>
                    <input type="number" step="0.01" className={`${inputCls} ${errors.amount ? "border-red-400" : ""}`} value={expForm.amount || ""} onChange={(e) => handleExpChange("amount", e.target.value)} />
                    {errors.amount && <p className={errCls}>{errors.amount}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>{t("forms.expense.description")}</label>
                    <textarea className={inputCls} rows={2} placeholder={t("forms.expense.descriptionPlaceholder")} value={expForm.description ?? ""} onChange={(e) => handleExpChange("description", e.target.value)} />
                  </div>
                </>
              )}
            </form>

            {/* Footer */}
            <div className={`px-6 py-4 border-t shrink-0 flex items-center justify-end gap-3 ${isDark ? "border-[#1E2B22]" : "border-slate-100"}`}>
              <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"}`}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSubmit} disabled={submitting || loadingVehicles} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {tab === "fuel" ? t("forms.expense.createFuelLog") : t("forms.expense.createExpense")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
