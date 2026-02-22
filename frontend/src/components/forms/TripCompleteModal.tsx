/**
 * TripCompleteModal — modal for completing a trip with actual distance input.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { dispatchApi } from "../../api/client";
import { completeTripSchema } from "../../validators/trip";

interface TripCompleteModalProps {
  open: boolean;
  tripId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TripCompleteModal({ open, tripId, onClose, onSuccess }: TripCompleteModalProps) {
  const { isDark } = useTheme();
  const [distanceActual, setDistanceActual] = useState("");
  const [odometerEnd, setOdometerEnd] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-neutral-400" : "text-slate-500";

  const handleSubmit = async () => {
    setErrors({});
    setServerError("");

    const result = completeTripSchema.safeParse({ distanceActual, odometerEnd: odometerEnd || undefined });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!tripId) return;
    setSubmitting(true);
    try {
      const payload: { status: "COMPLETED"; distanceActual: number; odometerEnd?: number } = {
        status: "COMPLETED",
        distanceActual: result.data.distanceActual,
      };
      if (result.data.odometerEnd != null && result.data.odometerEnd !== 0) {
        payload.odometerEnd = Number(result.data.odometerEnd);
      }

      await dispatchApi.transitionStatus(tripId, payload);
      onSuccess();
      onClose();
      setDistanceActual("");
      setOdometerEnd("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
    isDark ? "bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;
  const labelCls = `block text-xs font-semibold mb-1 ${isDark ? "text-neutral-300" : "text-slate-600"}`;
  const errCls = "text-xs text-red-500 mt-0.5";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="tcm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9992] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            key="tcm-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed z-[9993] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl shadow-2xl p-6 ${
              isDark ? "bg-neutral-800 border border-neutral-700" : "bg-white border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className={`text-base font-bold ${textPrimary}`}>Complete Trip</h3>
            </div>

            <p className={`text-sm mb-4 ${textSecondary}`}>
              Enter the actual distance traveled to complete this trip. Vehicle and driver will be released.
            </p>

            {serverError && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {serverError}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className={labelCls}>Actual Distance (km) *</label>
                <input
                  type="number"
                  className={`${inputCls} ${errors.distanceActual ? "border-red-400" : ""}`}
                  placeholder="e.g. 1450"
                  value={distanceActual}
                  onChange={(e) => setDistanceActual(e.target.value)}
                />
                {errors.distanceActual && <p className={errCls}>{errors.distanceActual}</p>}
              </div>

              <div>
                <label className={labelCls}>Odometer End (optional)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Current odometer reading"
                  value={odometerEnd}
                  onChange={(e) => setOdometerEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete Trip
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
