/**
 * TripLedgerDrawer — slide-over showing trip financial summary.
 * Fuel costs, expenses, revenue, profit, ROI.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Loader2, TrendingUp, TrendingDown, Fuel, Receipt, IndianRupee } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { tripsApi } from "../../api/client";

interface TripLedgerDrawerProps {
  open: boolean;
  tripId: string | null;
  onClose: () => void;
}

interface LedgerData {
  tripId: string;
  status: string;
  revenue: number;
  fuelCost: number;
  expenseCost: number;
  totalCost: number;
  profit: number;
  roi: string;
  fuelLogs: Array<{
    id: string;
    liters: number;
    costPerLiter: number;
    totalCost: number;
    fuelStation?: string;
    loggedAt: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description?: string;
    dateLogged: string;
  }>;
}

export function TripLedgerDrawer({ open, tripId, onClose }: TripLedgerDrawerProps) {
  const { isDark } = useTheme();
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-neutral-400" : "text-slate-500";
  const cardBg = isDark ? "bg-neutral-700/50 border-neutral-600" : "bg-slate-50 border-slate-200";

  useEffect(() => {
    if (!open || !tripId) return;
    setLoading(true);
    setError("");

    tripsApi.getTripLedger(tripId)
      .then((res) => {
        const body = res.data?.data ?? res.data;
        setLedger({
          ...body,
          revenue: Number(body.revenue),
          fuelCost: Number(body.fuelCost),
          expenseCost: Number(body.expenseCost),
          totalCost: Number(body.totalCost),
          profit: Number(body.profit),
          fuelLogs: (body.fuelLogs ?? []).map((l: Record<string, unknown>) => ({
            ...l,
            id: String(l.id),
            liters: Number(l.liters),
            costPerLiter: Number(l.costPerLiter),
            totalCost: Number(l.totalCost),
          })),
          expenses: (body.expenses ?? []).map((e: Record<string, unknown>) => ({
            ...e,
            id: String(e.id),
            amount: Number(e.amount),
          })),
        });
      })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message ?? "Failed to load ledger");
      })
      .finally(() => setLoading(false));
  }, [open, tripId]);

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="tld-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="tld-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 bottom-0 z-[9991] w-full max-w-md shadow-2xl flex flex-col ${
              isDark ? "bg-neutral-800" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
              isDark ? "border-neutral-700" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${textPrimary}`}>Trip Ledger</h2>
                  <p className={`text-xs ${textSecondary}`}>Financial summary for trip #{tripId}</p>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {loading && (
                <div className="py-12 text-center">
                  <Loader2 className={`w-6 h-6 mx-auto animate-spin ${textSecondary}`} />
                </div>
              )}

              {error && (
                <div className={`p-3 rounded-lg text-sm ${isDark ? "bg-red-900/30 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {error}
                </div>
              )}

              {ledger && !loading && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg border p-3 ${cardBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <IndianRupee className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                        <span className={`text-xs ${textSecondary}`}>Revenue</span>
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                        {formatCurrency(ledger.revenue)}
                      </p>
                    </div>

                    <div className={`rounded-lg border p-3 ${cardBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Receipt className={`w-3.5 h-3.5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                        <span className={`text-xs ${textSecondary}`}>Total Cost</span>
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${isDark ? "text-red-400" : "text-red-600"}`}>
                        {formatCurrency(ledger.totalCost)}
                      </p>
                    </div>

                    <div className={`rounded-lg border p-3 ${cardBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {ledger.profit >= 0 ? (
                          <TrendingUp className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                        ) : (
                          <TrendingDown className={`w-3.5 h-3.5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                        )}
                        <span className={`text-xs ${textSecondary}`}>Profit</span>
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${
                        ledger.profit >= 0
                          ? isDark ? "text-emerald-400" : "text-emerald-600"
                          : isDark ? "text-red-400" : "text-red-600"
                      }`}>
                        {formatCurrency(ledger.profit)}
                      </p>
                    </div>

                    <div className={`rounded-lg border p-3 ${cardBg}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 className={`w-3.5 h-3.5 ${isDark ? "text-violet-400" : "text-violet-600"}`} />
                        <span className={`text-xs ${textSecondary}`}>ROI</span>
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${isDark ? "text-violet-400" : "text-violet-600"}`}>
                        {ledger.roi}
                      </p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div>
                    <h4 className={`text-sm font-semibold mb-2 ${textPrimary}`}>Cost Breakdown</h4>
                    <div className={`rounded-lg border divide-y ${isDark ? "border-neutral-600 divide-neutral-600" : "border-slate-200 divide-slate-200"}`}>
                      <div className={`flex items-center justify-between px-3 py-2 text-sm ${cardBg.split(" ")[0]}`}>
                        <div className="flex items-center gap-2">
                          <Fuel className={`w-3.5 h-3.5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                          <span className={textPrimary}>Fuel</span>
                        </div>
                        <span className={`font-medium tabular-nums ${textPrimary}`}>{formatCurrency(ledger.fuelCost)}</span>
                      </div>
                      <div className={`flex items-center justify-between px-3 py-2 text-sm ${cardBg.split(" ")[0]}`}>
                        <div className="flex items-center gap-2">
                          <Receipt className={`w-3.5 h-3.5 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                          <span className={textPrimary}>Expenses</span>
                        </div>
                        <span className={`font-medium tabular-nums ${textPrimary}`}>{formatCurrency(ledger.expenseCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel Logs */}
                  {ledger.fuelLogs.length > 0 && (
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 ${textPrimary}`}>Fuel Logs ({ledger.fuelLogs.length})</h4>
                      <div className="space-y-2">
                        {ledger.fuelLogs.map((log) => (
                          <div key={log.id} className={`rounded-lg border p-2.5 text-xs ${cardBg}`}>
                            <div className="flex justify-between">
                              <span className={textPrimary}>{log.liters.toFixed(1)}L @ ₹{log.costPerLiter.toFixed(2)}/L</span>
                              <span className={`font-semibold ${textPrimary}`}>{formatCurrency(log.totalCost)}</span>
                            </div>
                            {log.fuelStation && <p className={`mt-0.5 ${textSecondary}`}>{log.fuelStation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expenses */}
                  {ledger.expenses.length > 0 && (
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 ${textPrimary}`}>Expenses ({ledger.expenses.length})</h4>
                      <div className="space-y-2">
                        {ledger.expenses.map((exp) => (
                          <div key={exp.id} className={`rounded-lg border p-2.5 text-xs ${cardBg}`}>
                            <div className="flex justify-between">
                              <span className={`uppercase font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                {exp.category.replace(/_/g, " ")}
                              </span>
                              <span className={`font-semibold ${textPrimary}`}>{formatCurrency(exp.amount)}</span>
                            </div>
                            {exp.description && <p className={`mt-0.5 ${textSecondary}`}>{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {ledger.fuelLogs.length === 0 && ledger.expenses.length === 0 && (
                    <div className={`text-center py-6 text-sm ${textSecondary}`}>
                      No fuel logs or expenses recorded for this trip yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
