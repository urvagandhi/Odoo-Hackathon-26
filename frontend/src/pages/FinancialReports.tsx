/**
 * FinancialReports — Monthly revenue / cost breakdown + export.
 * Backend: /api/v1/analytics/monthly, /roi, /fuel-efficiency, /export/csv
 * Roles: MANAGER, FINANCE_ANALYST
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi } from "../api/client";

/* ── Types ──────────────────────────────────────────────── */
interface MonthRow {
  month: number;
  monthName: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  profit: number;
  tripCount: number;
}

interface FuelEfficiency {
  vehicleId: string;
  licensePlate: string;
  avgKmPerLiter: number;
  totalFuelCost: number;
  totalLiters: number;
}

interface VehicleROI {
  vehicleId: string;
  licensePlate: string;
  totalRevenue: number;
  totalCost: number;
  roi: number;
}

export default function FinancialReports() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [fuel, setFuel] = useState<FuelEfficiency[]>([]);
  const [roi, setROI] = useState<VehicleROI[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pnl" | "fuel" | "roi">("pnl");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, fRes, rRes] = await Promise.all([
        analyticsApi.getMonthlyReport(year),
        analyticsApi.getFuelEfficiency(),
        analyticsApi.getVehicleROI(),
      ]);
      setMonthly((Array.isArray(mRes) ? mRes : []) as unknown as MonthRow[]);

      const fuelList = (Array.isArray(fRes) ? fRes : []) as unknown as Record<string, unknown>[];
      setFuel(
        fuelList.map((v) => ({ ...v, vehicleId: String(v.vehicleId ?? v.id) })) as FuelEfficiency[]
      );

      const roiList = (Array.isArray(rRes) ? rRes : []) as unknown as Record<string, unknown>[];
      setROI(
        roiList.map((v) => ({ ...v, vehicleId: String(v.vehicleId ?? v.id) })) as VehicleROI[]
      );
    } catch {
      /* silently handle */
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  /* ── Export CSV ───────────────────────────────────── */
  const handleExport = async () => {
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const csv = await analyticsApi.exportTripsCSV(startDate, endDate);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleetflow-report-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* handle error */
    }
  };

  /* ── Aggregate P&L ───────────────────────────────── */
  const totalRevenue = monthly.reduce((s, m) => s + Number(m.revenue ?? 0), 0);
  const totalCost = monthly.reduce(
    (s, m) => s + Number(m.fuelCost ?? 0) + Number(m.maintenanceCost ?? 0) + Number(m.otherExpenses ?? 0),
    0
  );
  const netProfit = totalRevenue - totalCost;

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
      active
        ? "bg-violet-600 text-white"
        : isDark
        ? "text-[#6B7C6B] hover:bg-[#1E2B22]"
        : "text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#090D0B]" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>
              {t("financialReports.title")}
            </h1>
            <p className={`text-sm ${isDark ? "text-[#6B7C6B]" : "text-slate-500"}`}>
              {t("financialReports.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border text-sm ${isDark ? "bg-[#111A15] border-[#1E2B22] text-[#E4E6DE]" : "bg-white border-slate-200"}`}
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("financialReports.exportCSV")}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: t("financialReports.summary.totalRevenue"), value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500" },
          { label: t("financialReports.summary.totalCosts"), value: `₹${totalCost.toLocaleString()}`, icon: TrendingDown, color: "text-red-500" },
          { label: t("financialReports.summary.netProfit"), value: `₹${netProfit.toLocaleString()}`, icon: DollarSign, color: netProfit >= 0 ? "text-emerald-500" : "text-red-500" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-[14px] border ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-slate-200"}`}
          >
            <s.icon className={`w-6 h-6 mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-[#6B7C6B]" : "text-slate-500"}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button className={tabCls(tab === "pnl")} onClick={() => setTab("pnl")}>{t("financialReports.tabs.pnl")}</button>
        <button className={tabCls(tab === "fuel")} onClick={() => setTab("fuel")}>{t("financialReports.tabs.fuelEfficiency")}</button>
        <button className={tabCls(tab === "roi")} onClick={() => setTab("roi")}>{t("financialReports.tabs.roi")}</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* P&L Table */}
          {tab === "pnl" && (
            <div className={`rounded-[14px] border overflow-x-auto ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-slate-200"}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? "text-[#6B7C6B] border-b border-[#1E2B22]" : "text-slate-500 border-b border-slate-200"}>
                    <th className="text-left px-4 py-3 font-medium">{t("financialReports.pnlColumns.month")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.revenue")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.fuel")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.maintenance")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.other")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.profit")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.pnlColumns.trips")}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-sm opacity-50">{t("financialReports.noDataForYear", { year })}</td>
                    </tr>
                  ) : (
                    monthly.map((m) => {
                      const profit = Number(m.revenue ?? 0) - Number(m.fuelCost ?? 0) - Number(m.maintenanceCost ?? 0) - Number(m.otherExpenses ?? 0);
                      return (
                        <tr key={m.month} className={isDark ? "border-b border-[#1E2B22]/50 hover:bg-[#1E2B22]/30" : "border-b border-slate-100 hover:bg-slate-50"}>
                          <td className={`px-4 py-3 font-medium ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>{m.monthName ?? `Month ${m.month}`}</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-500">₹{Number(m.revenue ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-400">₹{Number(m.fuelCost ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-400">₹{Number(m.maintenanceCost ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-400">₹{Number(m.otherExpenses ?? 0).toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-mono font-semibold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            ₹{profit.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-right ${isDark ? "text-[#B0B8A8]" : "text-slate-700"}`}>{m.tripCount ?? 0}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Fuel Efficiency */}
          {tab === "fuel" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fuel.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <Fuel className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-[#4A5C4A]" : "text-slate-300"}`} />
                  <p className={`text-sm ${isDark ? "text-[#6B7C6B]" : "text-slate-500"}`}>{t("financialReports.fuelEfficiency.noData")}</p>
                </div>
              ) : (
                fuel.map((v) => (
                  <motion.div
                    key={v.vehicleId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-[14px] border ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-slate-200"}`}
                  >
                    <p className={`font-semibold mb-1 ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>{v.licensePlate}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-emerald-500">{Number(v.avgKmPerLiter ?? 0).toFixed(1)}</p>
                        <p className={`text-[10px] ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`}>{t("financialReports.fuelEfficiency.kmPerL")}</p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>{Number(v.totalLiters ?? 0).toFixed(0)}L</p>
                        <p className={`text-[10px] ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`}>{t("financialReports.fuelEfficiency.totalFuel")}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400 font-mono">₹{Number(v.totalFuelCost ?? 0).toLocaleString()}</p>
                        <p className={`text-[10px] ${isDark ? "text-[#4A5C4A]" : "text-slate-400"}`}>{t("financialReports.fuelEfficiency.fuelCost")}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Vehicle ROI */}
          {tab === "roi" && (
            <div className={`rounded-[14px] border overflow-x-auto ${isDark ? "bg-[#111A15] border-[#1E2B22]" : "bg-white border-slate-200"}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? "text-[#6B7C6B] border-b border-[#1E2B22]" : "text-slate-500 border-b border-slate-200"}>
                    <th className="text-left px-4 py-3 font-medium">{t("financialReports.roiColumns.vehicle")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.roiColumns.revenue")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.roiColumns.cost")}</th>
                    <th className="text-right px-4 py-3 font-medium">{t("financialReports.roiColumns.roi")}</th>
                  </tr>
                </thead>
                <tbody>
                  {roi.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-sm opacity-50">{t("financialReports.noRoiData")}</td>
                    </tr>
                  ) : (
                    roi.map((v) => (
                      <tr key={v.vehicleId} className={isDark ? "border-b border-[#1E2B22]/50 hover:bg-[#1E2B22]/30" : "border-b border-slate-100 hover:bg-slate-50"}>
                        <td className={`px-4 py-3 font-medium ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>{v.licensePlate}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">₹{Number(v.totalRevenue ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">₹{Number(v.totalCost ?? 0).toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${Number(v.roi) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {Number(v.roi ?? 0).toFixed(1)}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
