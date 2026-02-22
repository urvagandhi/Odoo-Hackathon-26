/**
 * Analytics — Operational Analytics & Financial Reports (Page 8 per spec)
 * Metrics: Fuel Efficiency (km/L), Vehicle ROI, Monthly financial reports
 * Exports: CSV download for trips
 * Charts: Revenue line chart, expenses donut, fleet performance table, CO2 estimates
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, Fuel, DollarSign, TrendingUp, TrendingDown, Download, RefreshCw,
    Truck, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    analyticsApi, type MonthlyReport, type VehicleROI, type FuelEfficiency,
} from "../api/client";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
import html2canvas from "html2canvas";

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#3b82f6", "#8b5cf6"];
const card = "rounded-2xl border p-5 transition-all duration-200";
const lightCard = "bg-white border-neutral-200 shadow-sm hover:shadow-md";
const darkCard = "bg-neutral-800 border-neutral-700 shadow-sm hover:shadow-md";

export default function Analytics() {
    const { isDark } = useTheme();
    const toast = useToast();
    const cardClass = `${card} ${isDark ? darkCard : lightCard}`;
    const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
    const [fuelEff, setFuelEff] = useState<FuelEfficiency[]>([]);
    const [vehicleROI, setVehicleROI] = useState<VehicleROI[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "fuel" | "roi">("overview");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [m, f, r] = await Promise.all([
                analyticsApi.getMonthlyReport(new Date().getFullYear()),
                analyticsApi.getFuelEfficiency(),
                analyticsApi.getVehicleROI(),
            ]);
            setMonthly(m);
            setFuelEff(f ?? []);
            setVehicleROI(r ?? []);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleExport = async () => {
        try {
            const startDate = `${new Date().getFullYear()}-01-01`;
            const endDate = new Date().toISOString().slice(0, 10);
            const csv = await analyticsApi.exportTripsCSV(startDate, endDate);
            
            // Add Summary section to CSV
            const summaryHeaders = ["Summary Category", "Total Value"];
            const summaryRows = [
                ["Total Revenue", totalRevenue.toFixed(2)],
                ["Total Expenses", totalCost.toFixed(2)],
                ["Net Profit", totalProfit.toFixed(2)],
                ["Total Completed Trips", totalTrips.toString()],
                ["Avg Fuel Efficiency", avgFuelEfficiency],
            ];
            
            const summaryCsv = [
                "--- PERFORMANCE SUMMARY ---",
                summaryHeaders.join(","),
                ...summaryRows.map(r => r.join(",")),
                "",
                "--- DETAILED TRIP DATA ---",
                csv
            ].join("\n");

            const blob = new Blob([summaryCsv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `fleetflow-analytics-${endDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Trips and summary data have been exported to CSV.", { title: "Export Successful" });
        } catch { 
            toast.error("Could not generate CSV export.", { title: "Export Failed" });
        }
    };

    const handleExportPDF = async () => {
        toast.info("Please wait while we capture charts and data...", { title: "Generating PDF" });
        try {
            const doc = new jsPDF();
            const year = new Date().getFullYear();
            const dateStr = new Date().toLocaleDateString();

            // Title & Branding
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229); // Violet-600
            doc.text("FleetFlow", 14, 20);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(14);
            doc.setTextColor(17, 24, 39); // Gray-900
            doc.text(`Financial & Operational Analytics Report`, 14, 30);
            
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128); // Gray-500
            doc.text(`Generated on: ${dateStr}`, 14, 36);

            let startY = 46;

            // Capture Charts if on Overview tab
            const revenueChart = document.getElementById('revenue-trend-chart');
            if (revenueChart) {
                try {
                    const canvas = await html2canvas(revenueChart, { 
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: isDark ? "#1f2937" : "#ffffff"
                    });
                    const imgData = canvas.toDataURL('image/png');
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.setTextColor(17, 24, 39);
                    doc.text("Revenue & Cost Trends", 14, startY);
                    doc.addImage(imgData, 'PNG', 14, startY + 5, 180, 70);
                    startY += 85;
                } catch (chartErr) {
                    console.error("Failed to capture revenue chart:", chartErr);
                    toast.warning("Could not include Revenue chart in PDF, but continuing with data...", { title: "Chart Capture Warning" });
                    startY += 10;
                }
            }

            // Table 1: Monthly Financials
            if (monthly.length > 0) {
                if (startY > 230) { doc.addPage(); startY = 20; }
                doc.setFontSize(12);
                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.text(`Monthly Financials (${year})`, 14, startY);
                
                const monthlyData = monthly.filter(m => m.tripsCompleted > 0).map(m => [
                    m.label, m.tripsCompleted.toString(), m.totalDistanceKm.toString(),
                    `Rs. ${m.revenue.toLocaleString()}`, `Rs. ${m.totalCost.toLocaleString()}`,
                    `Rs. ${m.profit.toLocaleString()}`
                ]);

                autoTable(doc, {
                    startY: startY + 4,
                    head: [["Month", "Trips", "Distance (km)", "Revenue", "Total Cost", "Profit"]],
                    body: monthlyData,
                    theme: "grid",
                    headStyles: { fillColor: [79, 70, 229] },
                });
                
                // Track Y position
                // @ts-ignore
                startY = (doc as any).lastAutoTable.finalY + 15;
            }

            // Table 2: Vehicle ROI
            if (vehicleROI.length > 0) {
                if (startY > 230) {
                    doc.addPage();
                    startY = 20;
                }
                
                doc.setFontSize(12);
                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.text("Vehicle Performance & ROI", 14, startY);
                
                const roiData = vehicleROI.map(v => [
                    v.licensePlate, `${v.make} ${v.model}`, `Rs. ${Number(v.revenue).toLocaleString()}`,
                    `Rs. ${Number(v.totalCost).toLocaleString()}`, `Rs. ${Number(v.profit).toLocaleString()}`,
                    v.roi
                ]);

                autoTable(doc, {
                    startY: startY + 4,
                    head: [["License Plate", "Vehicle", "Revenue", "Total Cost", "Profit", "ROI"]],
                    body: roiData,
                    theme: "grid",
                    headStyles: { fillColor: [16, 185, 129] },
                });
            }

            doc.save(`fleetflow-analytics-${year}.pdf`);
            toast.success("Analytics report has been downloaded.", { title: "Export Successful" });
        } catch (err) {
            console.error("PDF Export Error:", err);
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error(`Export failed: ${msg}`, { title: "Error Generating PDF" });
        }
    };

    // Computed metrics
    const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
    const totalCost = monthly.reduce((s, m) => s + m.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;
    const totalTrips = monthly.reduce((s, m) => s + m.tripsCompleted, 0);

    const expenseBreakdown = monthly.length > 0 ? [
        { name: "Fuel", value: monthly.reduce((s, m) => s + m.fuelCost, 0) },
        { name: "Maintenance", value: monthly.reduce((s, m) => s + m.maintenanceCost, 0) },
        { name: "Other", value: monthly.reduce((s, m) => s + m.otherExpenses, 0) },
    ].filter(d => d.value > 0) : [];

    const avgFuelEfficiency = fuelEff.length > 0
        ? (fuelEff.filter(f => f.kmPerLiter != null).reduce((s, f) => s + (f.kmPerLiter ?? 0), 0) / fuelEff.filter(f => f.kmPerLiter != null).length).toFixed(2)
        : "—";

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                        Operations Intel
                    </h1>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Financial performance & operational insights — {new Date().getFullYear()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10">
                        <Download className="w-4 h-4" /> Export PDF
                    </button>
                    <button onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={load}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Tab navigation */}
            <div className={`inline-flex rounded-xl p-1 ${isDark ? "bg-neutral-800" : "bg-neutral-100"}`}>
                {[
                    { key: "overview", label: "Overview", icon: BarChart3 },
                    { key: "fuel", label: "Fuel Efficiency", icon: Fuel },
                    { key: "roi", label: "Vehicle ROI", icon: DollarSign },
                ].map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === t.key
                            ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                            : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-neutral-700"
                            }`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Top KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <FinKpi label="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(0)}K`} icon={DollarSign}
                            color="emerald" sub={`${totalTrips} trips`} isDark={isDark} />
                        <FinKpi label="Total Expenses" value={`₹${(totalCost / 1000).toFixed(0)}K`} icon={TrendingDown}
                            color="amber" sub="Fuel + Maintenance + Other" isDark={isDark} />
                        <FinKpi label="Net Profit" value={`₹${(totalProfit / 1000).toFixed(0)}K`} icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
                            color={totalProfit >= 0 ? "emerald" : "red"} sub={totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : ""} isDark={isDark} />
                        <FinKpi label="Avg Fuel Efficiency" value={`${avgFuelEfficiency} km/L`} icon={Fuel}
                            color="blue" sub={`${fuelEff.length} vehicles tracked`} isDark={isDark} />
                    </div>

                    {/* Revenue chart + Expense breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue/cost line chart */}
                        <div className={`${cardClass} lg:col-span-2`} id="revenue-trend-chart">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>Revenue vs Cost Trend</h2>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Revenue</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Cost</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500" /> Profit</span>
                                </div>
                            </div>
                            {monthly.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revGradA" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="costGradA" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} tickFormatter={v => v.split(" ")[0]} />
                                        <YAxis tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{ background: isDark ? "#1f2937" : "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: 12 }}
                                            formatter={(v: unknown) => String(v)}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGradA)" name="Revenue" />
                                        <Area type="monotone" dataKey="totalCost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGradA)" name="Total Cost" />
                                        <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Profit" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <EmptyState loading={loading} isDark={isDark} text="No monthly data" />}
                        </div>

                        {/* Expense donut */}
                        <div className={cardClass}>
                            <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>Expense Breakdown</h2>
                            {expenseBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={expenseBreakdown} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        >
                                            {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} formatter={(v: unknown) => `₹${Number(v).toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <EmptyState loading={loading} isDark={isDark} text="No expense data" />}
                            {expenseBreakdown.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {expenseBreakdown.map((e, i) => (
                                        <div key={e.name} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                                <span className={isDark ? "text-neutral-300" : "text-neutral-700"}>{e.name}</span>
                                            </span>
                                            <span className={`font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>₹{e.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fleet performance table */}
                    {vehicleROI.length > 0 && (
                        <div className={cardClass}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>Fleet Performance</h2>
                                <span className={`text-xs ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>By vehicle</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={isDark ? "text-neutral-400 border-b border-neutral-700" : "text-neutral-500 border-b border-neutral-100"}>
                                            {["#", "Fleet", "Revenue", "Cost", "Profit", "ROI"].map(h =>
                                                <th key={h} className="text-left pb-3 pr-4 font-semibold text-xs">{h}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicleROI.slice(0, 10).map((v, i) => (
                                            <tr key={v.vehicleId} className={isDark ? "border-b border-neutral-700/50" : "border-b border-neutral-50"}>
                                                <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{i + 1}</td>
                                                <td className="py-2.5 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                            <Truck className="w-3.5 h-3.5 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <p className={`font-semibold text-xs ${isDark ? "text-white" : "text-neutral-900"}`}>{v.licensePlate}</p>
                                                            <p className={`text-[10px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{v.make} {v.model}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 pr-4 text-emerald-500 font-semibold">₹{Number(v.revenue).toLocaleString()}</td>
                                                <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{Number(v.totalCost).toLocaleString()}</td>
                                                <td className={`py-2.5 pr-4 font-bold ${Number(v.profit) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                    <span className="flex items-center gap-1">
                                                        {Number(v.profit) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        ₹{Math.abs(Number(v.profit)).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 max-w-[80px] bg-neutral-200 dark:bg-neutral-600 rounded-full h-2 overflow-hidden">
                                                            <div className={`h-full rounded-full ${parseFloat(v.roi) >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                                                                style={{ width: `${Math.min(100, Math.abs(parseFloat(v.roi)))}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-semibold ${parseFloat(v.roi) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                            {v.roi}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Monthly report table */}
                    {monthly.filter(m => m.tripsCompleted > 0).length > 0 && (
                        <div className={cardClass}>
                            <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>
                                Monthly Financial Report
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={isDark ? "text-neutral-400 border-b border-neutral-700" : "text-neutral-500 border-b border-neutral-100"}>
                                            {["Month", "Trips", "Distance (km)", "Revenue", "Fuel", "Maintenance", "Other", "Total Cost", "Profit"].map(h =>
                                                <th key={h} className="text-left pb-3 pr-3 font-semibold text-xs">{h}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthly.filter(m => m.tripsCompleted > 0).map(m => (
                                            <tr key={m.month} className={isDark ? "border-b border-neutral-700/50" : "border-b border-neutral-50"}>
                                                <td className={`py-2.5 pr-3 font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{m.label}</td>
                                                <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{m.tripsCompleted}</td>
                                                <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{m.totalDistanceKm.toLocaleString()}</td>
                                                <td className="py-2.5 pr-3 text-emerald-500 font-semibold">₹{m.revenue.toLocaleString()}</td>
                                                <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{m.fuelCost.toLocaleString()}</td>
                                                <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{m.maintenanceCost.toLocaleString()}</td>
                                                <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{m.otherExpenses.toLocaleString()}</td>
                                                <td className="py-2.5 pr-3 text-amber-500 font-semibold">₹{m.totalCost.toLocaleString()}</td>
                                                <td className={`py-2.5 font-bold ${m.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                    {m.profit >= 0 ? "+" : ""}₹{m.profit.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ═══ FUEL EFFICIENCY TAB ═══ */}
            {activeTab === "fuel" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Fuel efficiency bar chart */}
                    <div className={cardClass}>
                        <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>Fuel Efficiency by Vehicle (km/L)</h2>
                        {fuelEff.filter(f => f.kmPerLiter != null).length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={fuelEff.filter(f => f.kmPerLiter != null)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                                    <XAxis dataKey="licensePlate" tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} />
                                    <YAxis tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} />
                                    <Tooltip contentStyle={{ background: isDark ? "#1f2937" : "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: 12 }} />
                                    <Bar dataKey="kmPerLiter" name="km/L" fill="#10b981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState loading={loading} isDark={isDark} text="No fuel efficiency data" />}
                    </div>

                    {/* Fuel efficiency table */}
                    <div className={cardClass}>
                        <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>Fuel Efficiency Details</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={isDark ? "text-neutral-400 border-b border-neutral-700" : "text-neutral-500 border-b border-neutral-100"}>
                                        {["Vehicle", "Total Distance", "Total Liters", "Fuel Cost", "km/L", "₹/km"].map(h =>
                                            <th key={h} className="text-left pb-3 pr-4 font-semibold text-xs">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {fuelEff.map(f => (
                                        <tr key={f.vehicleId} className={isDark ? "border-b border-neutral-700/50" : "border-b border-neutral-50"}>
                                            <td className="py-2.5 pr-4">
                                                <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{f.licensePlate}</p>
                                                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{f.make} {f.model}</p>
                                            </td>
                                            <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{Number(f.totalDistanceKm).toLocaleString()} km</td>
                                            <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{Number(f.totalLiters).toFixed(1)} L</td>
                                            <td className="py-2.5 pr-4 text-blue-500 font-semibold">₹{Number(f.totalFuelCost).toLocaleString()}</td>
                                            <td className="py-2.5 pr-4">
                                                {f.kmPerLiter != null ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${Number(f.kmPerLiter) >= 5 ? "bg-emerald-100 text-emerald-700" : Number(f.kmPerLiter) >= 2 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                                                        <Fuel className="w-3 h-3" />{Number(f.kmPerLiter).toFixed(2)}
                                                    </span>
                                                ) : <span className="text-neutral-400">—</span>}
                                            </td>
                                            <td className={`py-2.5 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                                                {f.costPerKm != null ? `₹${Number(f.costPerKm).toFixed(2)}` : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ═══ VEHICLE ROI TAB ═══ */}
            {activeTab === "roi" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* ROI bar chart */}
                    <div className={cardClass}>
                        <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>Vehicle ROI — Profit by Vehicle</h2>
                        <p className={`text-xs mb-4 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                            ROI = (Revenue − (Maintenance + Fuel + Expenses)) / Revenue
                        </p>
                        {vehicleROI.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={vehicleROI} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                                    <XAxis dataKey="licensePlate" tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} />
                                    <YAxis tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip contentStyle={{ background: isDark ? "#1f2937" : "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: 12 }}
                                        formatter={(v: unknown) => String(v)} />
                                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                                    <Bar dataKey="totalCost" name="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="b" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState loading={loading} isDark={isDark} text="No ROI data" />}
                    </div>

                    {/* ROI details table */}
                    <div className={cardClass}>
                        <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>Vehicle ROI Details</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={isDark ? "text-neutral-400 border-b border-neutral-700" : "text-neutral-500 border-b border-neutral-100"}>
                                        {["Vehicle", "Revenue", "Fuel Cost", "Maintenance", "Expenses", "Total Cost", "Profit", "ROI"].map(h =>
                                            <th key={h} className="text-left pb-3 pr-3 font-semibold text-xs">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicleROI.map(v => (
                                        <tr key={v.vehicleId} className={isDark ? "border-b border-neutral-700/50" : "border-b border-neutral-50"}>
                                            <td className="py-2.5 pr-3">
                                                <p className={`font-semibold ${isDark ? "text-white" : "text-neutral-900"}`}>{v.licensePlate}</p>
                                                <p className={`text-xs ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{v.make} {v.model}</p>
                                            </td>
                                            <td className="py-2.5 pr-3 text-emerald-500 font-semibold">₹{Number(v.revenue).toLocaleString()}</td>
                                            <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{Number(v.fuelCost).toLocaleString()}</td>
                                            <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{Number(v.maintenanceCost).toLocaleString()}</td>
                                            <td className={`py-2.5 pr-3 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{Number(v.expenseCost).toLocaleString()}</td>
                                            <td className="py-2.5 pr-3 text-amber-500 font-semibold">₹{Number(v.totalCost).toLocaleString()}</td>
                                            <td className={`py-2.5 pr-3 font-bold ${Number(v.profit) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                {Number(v.profit) >= 0 ? "+" : ""}₹{Number(v.profit).toLocaleString()}
                                            </td>
                                            <td className="py-2.5">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${parseFloat(v.roi) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                                    {v.roi}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function FinKpi({ label, value, sub, icon: Icon, color, isDark }: {
    label: string; value: string; sub: string;
    icon: React.ElementType; color: string; isDark: boolean;
}) {
    const bgMap: Record<string, { bg: string; darkBg: string; text: string }> = {
        emerald: { bg: "bg-emerald-50", darkBg: "bg-emerald-500/10", text: "text-emerald-600" },
        amber: { bg: "bg-amber-50", darkBg: "bg-amber-500/10", text: "text-amber-600" },
        blue: { bg: "bg-blue-50", darkBg: "bg-blue-500/10", text: "text-blue-600" },
        red: { bg: "bg-red-50", darkBg: "bg-red-500/10", text: "text-red-600" },
    };
    const c = bgMap[color] ?? bgMap.emerald;
    return (
        <div className={`${card} ${isDark ? darkCard : lightCard}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-xs font-semibold mb-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{label}</p>
                    <p className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>{value}</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? c.darkBg : c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ loading, isDark, text }: { loading: boolean; isDark: boolean; text: string }) {
    return (
        <div className={`h-[260px] flex items-center justify-center ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
            <BarChart3 className="w-6 h-6 mr-2 opacity-40" />
            {loading ? "Loading..." : text}
        </div>
    );
}
