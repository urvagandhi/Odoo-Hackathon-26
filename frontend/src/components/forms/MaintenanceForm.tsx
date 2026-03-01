/**
 * MaintenanceForm — slide-over for creating a new maintenance/service log.
 * ⚠️ Warning banner: "Creating this log will set the vehicle to IN_SHOP."
 */
import { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench, Save, Loader2, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { fleetApi } from "../../api/client";
import { createMaintenanceSchema, type CreateMaintenanceFormData } from "../../validators/finance";
import { Select } from "../ui/Select";

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  status: string;
  currentOdometer: number;
}

interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPES = [
  "OIL_CHANGE",
  "BRAKE_INSPECTION",
  "TIRE_ROTATION",
  "ENGINE_REPAIR",
  "TRANSMISSION",
  "ELECTRICAL",
  "BODY_WORK",
  "OTHER",
];

const INITIAL: CreateMaintenanceFormData = {
  vehicleId: "",
  serviceType: "",
  description: "",
  cost: 0,
  odometerAtService: 0,
  technicianName: "",
  shopName: "",
  serviceDate: new Date().toISOString().split("T")[0],
  nextServiceDue: "",
};

export function MaintenanceForm({ open, onClose, onSuccess }: MaintenanceFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateMaintenanceFormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL);
    setErrors({});
    setServerError("");
    setLoadingVehicles(true);
    // Load non-retired vehicles
    fleetApi.listVehicles({ limit: 500 })
      .then((res) => {
        setVehicles(
          res.data
            .filter((v) => v.status !== "RETIRED")
            .map((v) => ({
              ...v,
              id: String(v.id),
              currentOdometer: Number(v.currentOdometer),
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, [open]);

  const handleChange = (field: keyof CreateMaintenanceFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = createMaintenanceSchema.safeParse(form);
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
      await fleetApi.addMaintenanceLog(result.data.vehicleId, {
        serviceType: result.data.serviceType,
        description: result.data.description || undefined,
        cost: result.data.cost,
        odometerAtService: result.data.odometerAtService,
        technicianName: result.data.technicianName || undefined,
        shopName: result.data.shopName || undefined,
        serviceDate: new Date(result.data.serviceDate).toISOString(),
        nextServiceDue: result.data.nextServiceDue
          ? new Date(result.data.nextServiceDue).toISOString()
          : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
    isDark
      ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;
  const labelCls = `block text-xs font-semibold mb-1 ${isDark ? "text-neutral-300" : "text-slate-600"}`;
  const errCls = "text-xs text-red-500 mt-0.5";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            key="mf-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 z-[9991] w-full max-w-lg shadow-2xl flex flex-col ${
              isDark ? "bg-[#111A15]" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
              isDark ? "border-[#1E2B22]" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
                  <Wrench className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("forms.maintenance.title")}</h2>
                  <p className={`text-xs ${isDark ? "text-[#8FA68F]" : "text-slate-500"}`}>{t("forms.maintenance.subtitle")}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label={t("common.close")} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-neutral-700 text-[#8FA68F]" : "hover:bg-slate-100 text-slate-400"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* ⚠️ Warning banner */}
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                isDark ? "bg-amber-900/20 border-amber-800 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">
                  <Trans i18nKey="forms.maintenance.warning" components={{ strong: <strong /> }} />
                </p>
              </div>

              {serverError && (
                <div className={`p-3 rounded-lg text-sm ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {serverError}
                </div>
              )}

              {loadingVehicles ? (
                <div className={`py-8 text-center text-sm ${isDark ? "text-[#8FA68F]" : "text-slate-500"}`}>
                  <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                  {t("forms.maintenance.loadingVehicles")}
                </div>
              ) : (
                <>
                  {/* Vehicle */}
                  <div>
                    <label className={labelCls}>{t("forms.maintenance.vehicle")}</label>
                    <Select className={inputCls} error={!!errors.vehicleId} value={form.vehicleId} onChange={(e) => handleChange("vehicleId", e.target.value)}>
                      <option value="">{t("forms.maintenance.selectVehicle")}</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.licensePlate} — {v.make} {v.model} ({v.status})
                        </option>
                      ))}
                    </Select>
                    {errors.vehicleId && <p className={errCls}>{errors.vehicleId}</p>}
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className={labelCls}>{t("forms.maintenance.serviceType")}</label>
                    <Select className={inputCls} error={!!errors.serviceType} value={form.serviceType} onChange={(e) => handleChange("serviceType", e.target.value)}>
                      <option value="">{t("forms.maintenance.selectType")}</option>
                      {SERVICE_TYPES.map((st) => (
                        <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                      ))}
                    </Select>
                    {errors.serviceType && <p className={errCls}>{errors.serviceType}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelCls}>{t("forms.maintenance.description")}</label>
                    <textarea className={inputCls} rows={2} placeholder={t("forms.maintenance.descriptionPlaceholder")} value={form.description ?? ""} onChange={(e) => handleChange("description", e.target.value)} />
                  </div>

                  {/* Cost + Odometer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.cost")}</label>
                      <input type="number" className={`${inputCls} ${errors.cost ? "border-red-400" : ""}`} value={form.cost || ""} onChange={(e) => handleChange("cost", e.target.value)} />
                      {errors.cost && <p className={errCls}>{errors.cost}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.odometerAtService")}</label>
                      <input type="number" className={`${inputCls} ${errors.odometerAtService ? "border-red-400" : ""}`} value={form.odometerAtService || ""} onChange={(e) => handleChange("odometerAtService", e.target.value)} />
                      {errors.odometerAtService && <p className={errCls}>{errors.odometerAtService}</p>}
                    </div>
                  </div>

                  {/* Technician + Shop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.technicianName")}</label>
                      <input className={inputCls} placeholder={t("forms.maintenance.technicianPlaceholder")} value={form.technicianName ?? ""} onChange={(e) => handleChange("technicianName", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.shopName")}</label>
                      <input className={inputCls} placeholder={t("forms.maintenance.shopPlaceholder")} value={form.shopName ?? ""} onChange={(e) => handleChange("shopName", e.target.value)} />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.serviceDate")}</label>
                      <input type="date" className={`${inputCls} ${errors.serviceDate ? "border-red-400" : ""}`} value={form.serviceDate} onChange={(e) => handleChange("serviceDate", e.target.value)} />
                      {errors.serviceDate && <p className={errCls}>{errors.serviceDate}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>{t("forms.maintenance.nextServiceDue")}</label>
                      <input type="date" className={inputCls} value={form.nextServiceDue ?? ""} onChange={(e) => handleChange("nextServiceDue", e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </form>

            {/* Footer */}
            <div className={`px-6 py-4 border-t shrink-0 flex items-center justify-end gap-3 ${isDark ? "border-[#1E2B22]" : "border-slate-100"}`}>
              <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"}`}>
                {t("common.cancel")}
              </button>
              <button onClick={handleSubmit} disabled={submitting || loadingVehicles} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("forms.maintenance.createServiceLog")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
