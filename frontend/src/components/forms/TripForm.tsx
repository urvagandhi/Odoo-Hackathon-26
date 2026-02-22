/**
 * TripForm — slide-over for creating a new trip.
 * ⭐ Star feature: filtered vehicle/driver dropdowns + capacity validation bar.
 * Vehicles filtered to AVAILABLE only, drivers to ON_DUTY with valid licenses.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Navigation, Save, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { fleetApi, hrApi, dispatchApi } from "../../api/client";
import { createTripSchema, type CreateTripFormData } from "../../validators/trip";
import { CapacityBar } from "../ui/CapacityBar";
import { LocationAutocomplete } from "../ui/LocationAutocomplete";

interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  capacityWeight: number;
  status: string;
}

interface Driver {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status: string;
}

interface TripFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_FORM: CreateTripFormData = {
  vehicleId: "",
  driverId: "",
  origin: "",
  destination: "",
  cargoWeight: 0,
  distanceEstimated: 0,
  cargoDescription: "",
  clientName: "",
  revenue: "",
};

export function TripForm({ open, onClose, onSuccess }: TripFormProps) {
  const { isDark } = useTheme();

  const [form, setForm] = useState<CreateTripFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Available vehicles & on-duty drivers
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load available vehicles + on-duty drivers
  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    setForm(INITIAL_FORM);
    setErrors({});
    setServerError("");

    Promise.all([
      fleetApi.listVehicles({ status: "AVAILABLE", limit: 100 }),
      hrApi.listDrivers({ status: "ON_DUTY", limit: 100 }),
    ])
      .then(([vRes, dRes]) => {
        setVehicles(vRes.data.map((v) => ({
          ...v,
          id: String(v.id),
          capacityWeight: Number(v.capacityWeight),
        })));

        // Filter out expired licenses client-side
        const now = new Date();
        setDrivers(
          dRes.data
            .map((d) => ({ ...d, id: String(d.id) }))
            .filter((d) => new Date(d.licenseExpiryDate) > now)
        );
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [open]);

  const handleChange = (field: keyof CreateTripFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Selected vehicle for capacity check
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === form.vehicleId),
    [vehicles, form.vehicleId]
  );

  const cargoWeight = Number(form.cargoWeight) || 0;
  const maxCapacity = selectedVehicle?.capacityWeight ?? 0;
  const isOverCapacity = maxCapacity > 0 && cargoWeight > maxCapacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const result = createTripSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (isOverCapacity) {
      setErrors((prev) => ({ ...prev, cargoWeight: "Cargo exceeds vehicle capacity" }));
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        vehicleId: result.data.vehicleId,
        driverId: result.data.driverId,
        origin: result.data.origin,
        destination: result.data.destination,
        cargoWeight: result.data.cargoWeight,
        distanceEstimated: result.data.distanceEstimated,
      };

      if (result.data.cargoDescription) payload.cargoDescription = result.data.cargoDescription;
      if (result.data.clientName) payload.clientName = result.data.clientName;
      if (result.data.revenue) payload.revenue = Number(result.data.revenue);

      await dispatchApi.createTrip(payload as Parameters<typeof dispatchApi.createTrip>[0]);
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
            key="tf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="tf-panel"
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
                  <Navigation className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>New Trip</h2>
                  <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    Plan a new dispatch trip
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

              {loadingOptions ? (
                <div className={`py-8 text-center text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                  Loading vehicles and drivers...
                </div>
              ) : (
                <>
                  {/* Vehicle Dropdown */}
                  <div>
                    <label className={labelCls}>Vehicle (Available Only) *</label>
                    <select
                      className={`${inputCls} ${errors.vehicleId ? "border-red-400" : ""}`}
                      value={form.vehicleId}
                      onChange={(e) => handleChange("vehicleId", e.target.value)}
                    >
                      <option value="">Select a vehicle...</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.licensePlate} — {v.make} {v.model} ({v.capacityWeight.toLocaleString()} kg)
                        </option>
                      ))}
                    </select>
                    {vehicles.length === 0 && (
                      <p className={`text-xs mt-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>No available vehicles</p>
                    )}
                    {errors.vehicleId && <p className={errCls}>{errors.vehicleId}</p>}
                  </div>

                  {/* Driver Dropdown */}
                  <div>
                    <label className={labelCls}>Driver (On Duty, Valid License) *</label>
                    <select
                      className={`${inputCls} ${errors.driverId ? "border-red-400" : ""}`}
                      value={form.driverId}
                      onChange={(e) => handleChange("driverId", e.target.value)}
                    >
                      <option value="">Select a driver...</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} — {d.licenseNumber}
                        </option>
                      ))}
                    </select>
                    {drivers.length === 0 && (
                      <p className={`text-xs mt-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>No eligible drivers</p>
                    )}
                    {errors.driverId && <p className={errCls}>{errors.driverId}</p>}
                  </div>

                  {/* Origin + Destination */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Origin *</label>
                      <LocationAutocomplete
                        className={`${inputCls} ${errors.origin ? "border-red-400" : ""}`}
                        placeholder="Start typing..."
                        value={form.origin}
                        onChange={(val) => handleChange("origin", val)}
                      />
                      {errors.origin && <p className={errCls}>{errors.origin}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Destination *</label>
                      <LocationAutocomplete
                        className={`${inputCls} ${errors.destination ? "border-red-400" : ""}`}
                        placeholder="Start typing..."
                        value={form.destination}
                        onChange={(val) => handleChange("destination", val)}
                      />
                      {errors.destination && <p className={errCls}>{errors.destination}</p>}
                    </div>
                  </div>

                  {/* Cargo Weight + Distance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Cargo Weight (kg) *</label>
                      <input
                        type="number"
                        className={`${inputCls} ${errors.cargoWeight ? "border-red-400" : ""}`}
                        placeholder="0"
                        value={form.cargoWeight || ""}
                        onChange={(e) => handleChange("cargoWeight", e.target.value)}
                      />
                      {errors.cargoWeight && <p className={errCls}>{errors.cargoWeight}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Est. Distance (km) *</label>
                      <input
                        type="number"
                        className={`${inputCls} ${errors.distanceEstimated ? "border-red-400" : ""}`}
                        placeholder="0"
                        value={form.distanceEstimated || ""}
                        onChange={(e) => handleChange("distanceEstimated", e.target.value)}
                      />
                      {errors.distanceEstimated && <p className={errCls}>{errors.distanceEstimated}</p>}
                    </div>
                  </div>

                  {/* ⭐ Capacity Bar — the wow factor */}
                  {selectedVehicle && cargoWeight > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`p-3 rounded-xl border ${
                        isOverCapacity
                          ? isDark ? "border-red-800 bg-red-900/20" : "border-red-200 bg-red-50"
                          : isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <CapacityBar cargoWeight={cargoWeight} maxCapacity={maxCapacity} />
                    </motion.div>
                  )}

                  {/* Cargo Description */}
                  <div>
                    <label className={labelCls}>Cargo Description</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Electronics, perishables..."
                      value={form.cargoDescription ?? ""}
                      onChange={(e) => handleChange("cargoDescription", e.target.value)}
                    />
                  </div>

                  {/* Client + Revenue */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Client Name</label>
                      <input
                        className={inputCls}
                        placeholder="Acme Corp"
                        value={form.clientName ?? ""}
                        onChange={(e) => handleChange("clientName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Revenue (₹)</label>
                      <input
                        type="number"
                        className={inputCls}
                        placeholder="0"
                        value={form.revenue ?? ""}
                        onChange={(e) => handleChange("revenue", e.target.value)}
                      />
                    </div>
                  </div>
                </>
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
                disabled={submitting || isOverCapacity || loadingOptions}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Create Trip (Draft)
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
