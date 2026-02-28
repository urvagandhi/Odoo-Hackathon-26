/**
 * DriverForm — slide-over modal for creating/editing drivers.
 * Follows the same pattern as VehicleForm.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Save } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { hrApi } from "../../api/client";
import { createDriverSchema, type CreateDriverFormData } from "../../validators/driver";

interface DriverFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: {
    id: string;
    fullName: string;
    licenseNumber: string;
    licenseExpiryDate: string;
    licenseClass?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
  } | null;
}

const INITIAL_FORM: CreateDriverFormData = {
  fullName: "",
  licenseNumber: "",
  licenseExpiryDate: "",
  licenseClass: "",
  phone: "",
  email: "",
  dateOfBirth: "",
};

/**
 * Render a slide-over panel containing a form for creating a new driver or editing an existing driver.
 *
 * @param open - Whether the slide-over is visible.
 * @param onClose - Callback invoked to close the panel.
 * @param onSuccess - Callback invoked after a successful create or update operation.
 * @param editData - Optional existing driver data to pre-fill the form; expected fields include `id`, `fullName`, `licenseNumber`, `licenseExpiryDate`, `licenseClass`, `phone`, `email`, and `dateOfBirth`.
 * @returns The slide-over driver form element.
 */
export function DriverForm({ open, onClose, onSuccess, editData }: DriverFormProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const isEditing = !!editData;

  const [form, setForm] = useState<CreateDriverFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill for edit mode
  useEffect(() => {
    if (editData) {
      setForm({
        fullName: editData.fullName,
        licenseNumber: editData.licenseNumber,
        licenseExpiryDate: editData.licenseExpiryDate ? editData.licenseExpiryDate.split("T")[0] : "",
        licenseClass: editData.licenseClass ?? "",
        phone: editData.phone ?? "",
        email: editData.email ?? "",
        dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split("T")[0] : "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setServerError("");
  }, [editData, open]);

  const handleChange = (field: keyof CreateDriverFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const result = createDriverSchema.safeParse(form);
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
      const typedPayload = {
        fullName: result.data.fullName as string,
        licenseNumber: result.data.licenseNumber as string,
        licenseExpiryDate: result.data.licenseExpiryDate as string,
        ...(result.data.licenseClass ? { licenseClass: result.data.licenseClass as string } : {}),
        ...(result.data.phone ? { phone: result.data.phone as string } : {}),
        ...(result.data.email ? { email: result.data.email as string } : {}),
        ...(result.data.dateOfBirth ? { dateOfBirth: result.data.dateOfBirth as string } : {}),
      };

      if (isEditing && editData) {
        await hrApi.updateDriver(editData.id, typedPayload);
      } else {
        await hrApi.createDriver(typedPayload);
      }

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
          {/* Backdrop */}
          <motion.div
            key="df-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />

          {/* Slide-over */}
          <motion.div
            key="df-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 z-[9991] w-full max-w-lg shadow-2xl flex flex-col ${
              isDark ? "bg-neutral-800" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
              isDark ? "border-neutral-700" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {isEditing ? t("forms.driver.editTitle") : t("forms.driver.newTitle")}
                  </h2>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {isEditing ? t("forms.driver.editSubtitle") : t("forms.driver.newSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-400"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {serverError && (
                <div className={`p-3 rounded-lg text-sm ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {serverError}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className={labelCls}>{t("forms.driver.fullName")}</label>
                <input
                  className={`${inputCls} ${errors.fullName ? "border-red-400" : ""}`}
                  placeholder={t("forms.driver.fullNamePlaceholder")}
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
                {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
              </div>

              {/* License Number + Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t("forms.driver.licenseNumber")}</label>
                  <input
                    className={`${inputCls} ${errors.licenseNumber ? "border-red-400" : ""}`}
                    placeholder={t("forms.driver.licensePlaceholder")}
                    value={form.licenseNumber}
                    onChange={(e) => handleChange("licenseNumber", e.target.value)}
                  />
                  {errors.licenseNumber && <p className={errCls}>{errors.licenseNumber}</p>}
                </div>
                <div>
                  <label className={labelCls}>{t("forms.driver.licenseClass")}</label>
                  <input
                    className={inputCls}
                    placeholder={t("forms.driver.licenseClassPlaceholder")}
                    value={form.licenseClass ?? ""}
                    onChange={(e) => handleChange("licenseClass", e.target.value)}
                  />
                </div>
              </div>

              {/* License Expiry */}
              <div>
                <label className={labelCls}>{t("forms.driver.licenseExpiry")}</label>
                <input
                  type="date"
                  className={`${inputCls} ${errors.licenseExpiryDate ? "border-red-400" : ""}`}
                  value={form.licenseExpiryDate}
                  onChange={(e) => handleChange("licenseExpiryDate", e.target.value)}
                />
                {errors.licenseExpiryDate && <p className={errCls}>{errors.licenseExpiryDate}</p>}
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t("forms.driver.phone")}</label>
                  <input
                    className={inputCls}
                    placeholder={t("forms.driver.phonePlaceholder")}
                    value={form.phone ?? ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t("forms.driver.email")}</label>
                  <input
                    type="email"
                    className={`${inputCls} ${errors.email ? "border-red-400" : ""}`}
                    placeholder={t("forms.driver.emailPlaceholder")}
                    value={form.email ?? ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                  {errors.email && <p className={errCls}>{errors.email}</p>}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className={labelCls}>{t("forms.driver.dateOfBirth")}</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.dateOfBirth ?? ""}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                />
              </div>
            </form>

            {/* Footer */}
            <div className={`px-6 py-4 border-t shrink-0 flex items-center justify-end gap-3 ${
              isDark ? "border-neutral-700" : "border-slate-100"
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEditing ? t("forms.driver.updateDriver") : t("forms.driver.createDriver")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
