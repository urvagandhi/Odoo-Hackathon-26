/**
 * Analytics — Monthly financial table, KPI cards, bar chart, and CSV export.
 * Uses analyticsApi.getMonthlyReport(), getVehicleROI(), getDashboardKPIs().
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Loader2,
  TrendingUp,
  Fuel,
  Wrench,
  DollarSign,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { analyticsApi } from "../api/client";
import { DataTable, type Column } from "../components/ui/DataTable";
import { useToast } from "../hooks/useToast";

/* ── Types ──────────────────────────────────────────────── */
interface MonthlyRow {
  month: number;
  label: string;
  tripsCompleted: number;
  totalDistanceKm: number;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
  profit: number;
}

interface VehicleROI {
  vehicleId: string;
  licensePlate: string;
  make: string;
  model: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  profit: number;
  profitMargin: string;
}

interface KPIData {
  fleet: { total: number; utilizationRate: string };
}

export default function Analytics() {
  const { isDark } = useTheme();
  const toast = useToast();

  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleROI[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<"monthly" | "roi">("monthly");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, vRes, kRes] = await Promise.all([
        analyticsApi.getMonthlyReport(year),
        analyticsApi.getVehicleROI(),
        analyticsApi.getDashboardKPIs(),
      ]);
      const mBody = mRes.data?.data ?? mRes.data;
      const vBody = vRes.data?.data ?? vRes.data;
      const kBody = kRes.data?.data ?? kRes.data;
      setMonthly((Array.isArray(mBody) ? mBody : mBody?.report ?? []) as MonthlyRow[]);
      setVehicles(
        ((Array.isArray(vBody) ? vBody : vBody?.vehicles ?? []) as VehicleROI[]).map(
          (v: Record<string, unknown>) => ({ ...v, vehicleId: String(v.vehicleId) }) as VehicleROI
        )
      );
      setKpi(kBody as KPIData);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [year]);

  const handleExportCSV = async () => {
    try {
      const res = await analyticsApi.exportCSV();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleetflow_trips_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully!");
    } catch {
      toast.error("CSV export failed.");
    }
  };

  /* ── Aggregate KPIs ──────────────────────────────── */
  const totalRevenue = monthly.reduce((s, m) => s + Number(m.revenue), 0);
  const totalFuel = monthly.reduce((s, m) => s + Number(m.fuelCost), 0);
  const totalMaint = monthly.reduce((s, m) => s + Number(m.maintenanceCost), 0);
  const totalProfit = monthly.reduce((s, m) => s + Number(m.profit), 0);
  const maxProfit = Math.max(...monthly.map((m) => Math.abs(Number(m.profit))), 1);

  /* ── Monthly Columns ─────────────────────────────── */
  const monthlyCols: Column<MonthlyRow>[] = [
    { key: "label", header: "Month", render: (m) => <span className="font-medium">{m.label}</span> },
    { key: "trips", header: "Trips", render: (m) => m.tripsCompleted },
    { key: "distance", header: "Distance (km)", render: (m) => Number(m.totalDistanceKm).toLocaleString() },
    { key: "revenue", header: "Revenue", render: (m) => <span className="font-mono text-emerald-500">₹{Number(m.revenue).toLocaleString()}</span> },
    { key: "fuel", header: "Fuel Cost", render: (m) => <span className="font-mono text-amber-500">₹{Number(m.fuelCost).toLocaleString()}</span> },
    { key: "maint", header: "Maintenance", render: (m) => <span className="font-mono">₹{Number(m.maintenanceCost).toLocaleString()}</span> },
    { key: "other", header: "Other", render: (m) => <span className="font-mono">₹{Number(m.otherExpenses).toLocaleString()}</span> },
    {
      key: "profit",
      header: "Profit",
      render: (m) => {
        const p = Number(m.profit);
        return <span className={`font-mono font-bold ${p >= 0 ? "text-emerald-500" : "text-red-500"}`}>₹{p.toLocaleString()}</span>;
      },
    },
  ];

  /* ── ROI Columns ─────────────────────────────────── */
  const roiCols: Column<VehicleROI>[] = [
    { key: "vehicle", header: "Vehicle", render: (v) => <span className="font-medium">{v.licensePlate} — {v.make} {v.model}</span> },
    { key: "revenue", header: "Revenue", render: (v) => <span className="font-mono text-emerald-500">₹{Number(v.revenue).toLocaleString()}</span> },
    { key: "fuel", header: "Fuel", render: (v) => <span className="font-mono">₹{Number(v.fuelCost).toLocaleString()}</span> },
    { key: "maint", header: "Maint.", render: (v) => <span className="font-mono">₹{Number(v.maintenanceCost).toLocaleString()}</span> },
    { key: "total", header: "Total Cost", render: (v) => <span className="font-mono">₹{Number(v.totalCost).toLocaleString()}</span> },
    {
      key: "profit",
      header: "Profit",
      render: (v) => {
        const p = Number(v.profit);
        return <span className={`font-mono font-bold ${p >= 0 ? "text-emerald-500" : "text-red-500"}`}>₹{p.toLocaleString()}</span>;
      },
    },
    {
      key: "margin",
      header: "Margin",
      render: (v) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          parseFloat(v.profitMargin) >= 0
            ? isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
            : isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700"
        }`}>
          {v.profitMargin}
        </span>
      ),
    },
  ];

  const tabCls = (active: boolean) =>
    `px-5 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
      active
        ? isDark ? "bg-neutral-800 text-white border-b-2 border-violet-500" : "bg-white text-slate-900 border-b-2 border-violet-600"
        : isDark ? "text-neutral-400 hover:text-neutral-200" : "text-slate-500 hover:text-slate-700"
    }`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 mx-auto mb-3 animate-spin ${isDark ? "text-violet-400" : "text-violet-600"}`} />
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
          <p className={`text-sm ${isDark ? "text-neutral-300" : "text-slate-600"}`}>{error}</p>
          <button onClick={fetchAll} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Analytics</h1>
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              Financial insights & fleet performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border text-sm ${
              isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200"
            }`}
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "bg-emerald-600" },
          { label: "Fuel Cost", value: `₹${totalFuel.toLocaleString()}`, icon: Fuel, color: "bg-amber-600" },
          { label: "Maintenance Cost", value: `₹${totalMaint.toLocaleString()}`, icon: Wrench, color: "bg-blue-600" },
          { label: "Net Profit", value: `₹${totalProfit.toLocaleString()}`, icon: DollarSign, color: totalProfit >= 0 ? "bg-emerald-600" : "bg-red-600" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
          >
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <p className={`text-2xl font-bold font-mono ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly Profit Chart (CSS bars) */}
      {monthly.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border mb-6 ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
            Monthly Profit Overview — {year}
          </h3>
          <div className="flex items-end gap-1.5 h-48">
            {monthly.map((m) => {
              const profit = Number(m.profit);
              const heightPercent = Math.max((Math.abs(profit) / maxProfit) * 100, 4);
              const isPositive = profit >= 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1" title={`${m.label}: ₹${profit.toLocaleString()}`}>
                  <span className={`text-[10px] font-mono ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                    {profit >= 1000 ? `${(profit / 1000).toFixed(0)}k` : profit}
                  </span>
                  <div
                    className={`w-full max-w-[40px] rounded-t-md transition-all ${
                      isPositive
                        ? isDark ? "bg-emerald-500/60" : "bg-emerald-400"
                        : isDark ? "bg-red-500/60" : "bg-red-400"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className={`text-[10px] ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                    {m.label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tabs + Table */}
      <div className={`flex border-b mb-0 ${isDark ? "border-neutral-700" : "border-slate-200"}`}>
        <button className={tabCls(tab === "monthly")} onClick={() => setTab("monthly")}>
          Monthly Report
        </button>
        <button className={tabCls(tab === "roi")} onClick={() => setTab("roi")}>
          Vehicle ROI ({vehicles.length})
        </button>
      </div>

      {tab === "monthly" ? (
        <DataTable
          columns={monthlyCols}
          rows={monthly}
          rowKey={(m) => String(m.month)}
          emptyTitle="No data for this year"
          emptyMessage="Try selecting a different year."
        />
      ) : (
        <DataTable
          columns={roiCols}
          rows={vehicles}
          rowKey={(v) => v.vehicleId}
          emptyTitle="No vehicle ROI data"
          emptyMessage="Add trips and expenses to see per-vehicle returns."
        />
      )}

      {/* Utilization note */}
      {kpi && (
        <div className={`mt-6 p-4 rounded-xl border text-center ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}>
          <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            Fleet utilization rate: <strong className={isDark ? "text-white" : "text-slate-900"}>{kpi.fleet.utilizationRate}</strong>
            {" · "}
            Total fleet size: <strong className={isDark ? "text-white" : "text-slate-900"}>{kpi.fleet.total} vehicles</strong>
          </p>
        </div>
      )}
    </div>
  );
}
