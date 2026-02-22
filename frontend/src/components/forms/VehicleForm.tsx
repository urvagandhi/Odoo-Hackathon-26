/**
 * VehicleForm — slide-over modal for creating/editing vehicles.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Save, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { fleetApi } from "../../api/client";
import { createVehicleSchema, type CreateVehicleFormData } from "../../validators/vehicle";

interface VehicleType {
  id: string;
  name: string;
  description?: string;
}

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** If provided, the form is in edit mode with pre-filled data */
  editData?: {
    id: string;
    licensePlate: string;
    make: string;
    model: string;
    year: number;
    color?: string;
    vin?: string;
    vehicleTypeId: string;
    capacityWeight: number;
    capacityVolume?: number;
    currentOdometer?: number;
    region?: string;
    acquisitionCost?: number;
  } | null;
}

const INITIAL_FORM: CreateVehicleFormData = {
  licensePlate: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  color: "",
  vin: "",
  vehicleTypeId: "",
  capacityWeight: 0,
  capacityVolume: "",
  currentOdometer: "",
  region: "",
  acquisitionCost: "",
};

export function VehicleForm({ open, onClose, onSuccess, editData }: VehicleFormProps) {
  const { isDark } = useTheme();
  const isEditing = !!editData;

  const [form, setForm] = useState<CreateVehicleFormData>(INITIAL_FORM);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load vehicle types
  useEffect(() => {
    if (!open) return;
    fleetApi.listVehicleTypes().then((res) => {
      setVehicleTypes(res);
    }).catch(() => {});
  }, [open]);

  // Pre-fill for edit mode
  useEffect(() => {
    if (editData) {
      setForm({
        licensePlate: editData.licensePlate,
        make: editData.make,
        model: editData.model,
        year: editData.year,
        color: editData.color ?? "",
        vin: editData.vin ?? "",
        vehicleTypeId: editData.vehicleTypeId,
        capacityWeight: editData.capacityWeight,
        capacityVolume: editData.capacityVolume ?? "",
        currentOdometer: editData.currentOdometer ?? "",
        region: editData.region ?? "",
        acquisitionCost: editData.acquisitionCost ?? "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setServerError("");
  }, [editData, open]);

  const handleChange = (field: keyof CreateVehicleFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    // Validate
    const result = createVehicleSchema.safeParse(form);
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
      const payload: Record<string, unknown> = {
        licensePlate: result.data.licensePlate,
        make: result.data.make,
        model: result.data.model,
        year: result.data.year,
        vehicleTypeId: result.data.vehicleTypeId,
        capacityWeight: result.data.capacityWeight,
      };

      if (result.data.color) payload.color = result.data.color;
      if (result.data.vin) payload.vin = result.data.vin;
      if (result.data.capacityVolume) {
        payload.capacityVolume = Number(result.data.capacityVolume);
      }
      if (result.data.region) payload.region = result.data.region;
      if (result.data.acquisitionCost) {
        payload.acquisitionCost = Number(result.data.acquisitionCost);
      }

      if (isEditing && editData) {
        await fleetApi.updateVehicle(editData.id, payload as Parameters<typeof fleetApi.updateVehicle>[1]);
      } else {
        if (result.data.currentOdometer) payload.currentOdometer = result.data.currentOdometer;
        await fleetApi.createVehicle(payload as Parameters<typeof fleetApi.createVehicle>[0]);
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
            key="vf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />

          {/* Slide-over */}
          <motion.div
            key="vf-panel"
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
                  <Truck className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {isEditing ? "Edit Vehicle" : "New Vehicle"}
                  </h2>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {isEditing ? "Update vehicle details" : "Register a new fleet asset"}
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
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {serverError}
                </div>
              )}

              {/* Registration Plate */}
              <div>
                <label className={labelCls}>Registration Plate *</label>
                <input
                  className={`${inputCls} ${errors.licensePlate ? "border-red-400" : ""}`}
                  placeholder="MH-12-AB-1234"
                  value={form.licensePlate}
                  onChange={(e) => handleChange("licensePlate", e.target.value)}
                />
                {errors.licensePlate && <p className={errCls}>{errors.licensePlate}</p>}
              </div>

              {/* Make + Model row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Make *</label>
                  <input
                    className={`${inputCls} ${errors.make ? "border-red-400" : ""}`}
                    placeholder="Tata"
                    value={form.make}
                    onChange={(e) => handleChange("make", e.target.value)}
                  />
                  {errors.make && <p className={errCls}>{errors.make}</p>}
                </div>
                <div>
                  <label className={labelCls}>Model *</label>
                  <input
                    className={`${inputCls} ${errors.model ? "border-red-400" : ""}`}
                    placeholder="Prima"
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                  />
                  {errors.model && <p className={errCls}>{errors.model}</p>}
                </div>
              </div>

              {/* Year + Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year *</label>
                  <input
                    type="number"
                    className={`${inputCls} ${errors.year ? "border-red-400" : ""}`}
                    value={form.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                  />
                  {errors.year && <p className={errCls}>{errors.year}</p>}
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <input
                    className={inputCls}
                    placeholder="White"
                    value={form.color ?? ""}
                    onChange={(e) => handleChange("color", e.target.value)}
                  />
                </div>
              </div>

              {/* VIN */}
              <div>
                <label className={labelCls}>VIN</label>
                <input
                  className={inputCls}
                  placeholder="17-character VIN (optional)"
                  maxLength={17}
                  value={form.vin ?? ""}
                  onChange={(e) => handleChange("vin", e.target.value)}
                />
                {errors.vin && <p className={errCls}>{errors.vin}</p>}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className={labelCls}>Vehicle Type *</label>
                <select
                  className={`${inputCls} ${errors.vehicleTypeId ? "border-red-400" : ""}`}
                  value={form.vehicleTypeId}
                  onChange={(e) => handleChange("vehicleTypeId", e.target.value)}
                >
                  <option value="">Select type...</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
                {errors.vehicleTypeId && <p className={errCls}>{errors.vehicleTypeId}</p>}
              </div>

              {/* Capacity Weight + Volume */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Max Capacity (kg) *</label>
                  <input
                    type="number"
                    className={`${inputCls} ${errors.capacityWeight ? "border-red-400" : ""}`}
                    placeholder="5000"
                    value={form.capacityWeight || ""}
                    onChange={(e) => handleChange("capacityWeight", e.target.value)}
                  />
                  {errors.capacityWeight && <p className={errCls}>{errors.capacityWeight}</p>}
                </div>
                <div>
                  <label className={labelCls}>Volume (m³)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="Optional"
                    value={form.capacityVolume ?? ""}
                    onChange={(e) => handleChange("capacityVolume", e.target.value)}
                  />
                </div>
              </div>

              {/* Region + Acquisition Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Region</label>
                  <input
                    className={`${inputCls} ${errors.region ? "border-red-400" : ""}`}
                    placeholder="e.g. North America"
                    value={form.region ?? ""}
                    onChange={(e) => handleChange("region", e.target.value)}
                  />
                  {errors.region && <p className={errCls}>{errors.region}</p>}
                </div>
                <div>
                  <label className={labelCls}>Acquisition Cost ($)</label>
                  <input
                    type="number"
                    className={`${inputCls} ${errors.acquisitionCost ? "border-red-400" : ""}`}
                    placeholder="Optional"
                    value={form.acquisitionCost ?? ""}
                    onChange={(e) => handleChange("acquisitionCost", e.target.value)}
                  />
                  {errors.acquisitionCost && <p className={errCls}>{errors.acquisitionCost}</p>}
                </div>
              </div>

              {/* Odometer (create only) */}
              {!isEditing && (
                <div>
                  <label className={labelCls}>Initial Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    placeholder="0"
                    value={form.currentOdometer}
                    onChange={(e) => handleChange("currentOdometer", e.target.value)}
                  />
                </div>
              )}
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
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEditing ? "Update Vehicle" : "Create Vehicle"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
