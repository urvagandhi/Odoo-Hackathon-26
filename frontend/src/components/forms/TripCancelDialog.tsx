/**
 * TripCancelDialog — AlertDialog with reason textarea for cancelling trips.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, XCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { dispatchApi } from "../../api/client";

interface TripCancelDialogProps {
  open: boolean;
  tripId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TripCancelDialog({ open, tripId, onClose, onSuccess }: TripCancelDialogProps) {
  const { isDark } = useTheme();
  const [reason, setReason] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-neutral-400" : "text-slate-500";

  const handleSubmit = async () => {
    if (reason.trim().length < 5) return;
    if (!tripId) return;
    setServerError("");
    setSubmitting(true);
    try {
      await dispatchApi.transitionStatus(tripId, { status: "CANCELLED", cancelledReason: reason });
      onSuccess();
      onClose();
      setReason("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="tcd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9992] bg-black/40"
            onClick={onClose}
          />
          <motion.div
            key="tcd-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed z-[9993] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl shadow-2xl p-6 ${
              isDark ? "bg-neutral-800 border border-neutral-700" : "bg-white border border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h3 className={`text-base font-bold ${textPrimary}`}>Cancel Trip</h3>
            </div>

            <p className={`text-sm mb-4 ${textSecondary}`}>
              This action will cancel the trip. If the trip was dispatched, the vehicle and driver will be released.
            </p>

            {serverError && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                {serverError}
              </div>
            )}

            <div className="mb-4">
              <label className={`block text-xs font-semibold mb-1 ${isDark ? "text-neutral-300" : "text-slate-600"}`}>
                Reason for Cancellation *
              </label>
              <textarea
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark ? "bg-neutral-700 border-neutral-600 text-white" : "bg-white border-slate-200 text-slate-900"
                }`}
                placeholder="Please explain why this trip is being cancelled (min 5 chars)..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {reason.length > 0 && reason.length < 5 && (
                <p className="text-xs text-red-500 mt-0.5">Minimum 5 characters required</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { onClose(); setReason(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? "text-neutral-300 hover:bg-neutral-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Keep Trip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || reason.trim().length < 5}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel Trip
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
