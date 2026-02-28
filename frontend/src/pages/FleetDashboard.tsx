/**
 * FleetDashboard — Command Center (Page 2 per spec)
 * KPIs: Active Fleet, Maintenance Alerts, Utilization Rate, Pending Cargo
 * Charts: Revenue trend (line), Expense breakdown (donut)
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
    Truck, Wrench, TrendingUp, Package, Users, AlertTriangle,
    CheckCircle2, Clock, BarChart3, RefreshCw, MapPin,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { analyticsApi, locationsApi, type DashboardKPIs, type MonthlyReport } from "../api/client";
import { useTheme } from "../context/ThemeContext";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const truckIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097180.png",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
});

const movingTruckIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2554/2554936.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
});

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

// Simulated route: Mumbai → Pune (National Highway 48)
const MOVING_ROUTE: [number, number][] = [
    [19.076, 72.8777],  // Mumbai
    [19.033, 72.8553],
    [18.973, 72.8194],
    [18.928, 73.0624],
    [18.851, 73.2329],
    [18.753, 73.3808],
    [18.664, 73.4412],
    [18.588, 73.5521],
    [18.559, 73.7798],
    [18.5204, 73.8567], // Pune
];


function useMovingVehicle() {
    const [posIndex, setPosIndex] = useState(0);
    const forward = useRef(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setPosIndex(prev => {
                if (forward.current) {
                    if (prev >= MOVING_ROUTE.length - 1) { forward.current = false; return prev - 1; }
                    return prev + 1;
                } else {
                    if (prev <= 0) { forward.current = true; return prev + 1; }
                    return prev - 1;
                }
            });
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return MOVING_ROUTE[posIndex] || MOVING_ROUTE[0];
}

const card = "rounded-3xl border p-6 transition-all duration-300 relative overflow-hidden backdrop-blur-xl shrink-0";
const lightCard = "bg-gradient-to-br from-white via-white to-slate-50/80 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]";
const darkCard = "bg-slate-900/60 border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]";

export default function FleetDashboard() {
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const cardClass = `${card} ${isDark ? darkCard : lightCard}`;
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
    const [locations, setLocations] = useState<Array<{ vehicleId: number; latitude: number; longitude: number; speed?: number; plateNumber?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const movingPos = useMovingVehicle();

    const fetch = async () => {
        setLoading(true);
        try {
            // First, fetch KPIs which are accessible to all
            try {
                const k = await analyticsApi.getDashboardKPIs();
                setKpis(k);
            } catch (err) {
                console.error("Failed to fetch KPIs:", err);
            }

            // Then, fetch monthly reports (Manager/Finance Analyst only)
            try {
                const m = await analyticsApi.getMonthlyReport(new Date().getFullYear());
                setMonthly(m);
            } catch (err) {
                // If this fails (e.g. 403), we just don't show the chart
                console.warn("Failed to fetch monthly report (likely unauthorized):", err);
                setMonthly([]);
            }

            // Fetch fleet locations (don't block on it)
            try {
                const locs = await locationsApi.getLatestLocations() as Array<{ vehicleId: number; latitude: number; longitude: number; speed?: number; vehicle?: { plateNumber?: string } }>;
                setLocations(locs.map(l => ({ vehicleId: l.vehicleId, latitude: l.latitude, longitude: l.longitude, speed: l.speed, plateNumber: l.vehicle?.plateNumber })));
            } catch { /* locations endpoint may return empty */ }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch();
        const interval = setInterval(fetch, 1000);
        return () => clearInterval(interval);
    }, []);

    const expenseData = kpis ? [
        { name: "Active Fleet", value: kpis.fleet.onTrip },
        { name: "In Shop", value: kpis.fleet.inShop },
        { name: "Available", value: kpis.fleet.available },
        { name: "Retired", value: kpis.fleet.retired },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {t("fleetDashboard.title")}
                    </h1>
                    <p className={`text-sm mt-1.5 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {t("fleetDashboard.liveOverview", { date: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) })}
                    </p>
                </div>
                <button
                    onClick={fetch}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    {t("common.refresh")}
                </button>
            </div>

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <KpiCard
                    label={t("fleetDashboard.kpi.activeFleet")}
                    value={kpis ? `${kpis.fleet.onTrip}` : "—"}
                    sub={kpis ? t("fleetDashboard.kpi.ofTotal", { total: kpis.fleet.total }) : t("common.loading")}
                    icon={Truck}
                    color="emerald"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.maintenanceAlerts")}
                    value={kpis ? `${kpis.fleet.inShop}` : "—"}
                    sub={t("fleetDashboard.kpi.vehiclesInShop")}
                    icon={Wrench}
                    color="amber"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.utilizationRate")}
                    value={kpis ? kpis.fleet.utilizationRate : "—"}
                    sub={t("fleetDashboard.kpi.fleetAssignedVsIdle")}
                    icon={TrendingUp}
                    color="violet"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.pendingCargo")}
                    value={kpis ? `${kpis.trips.pending}` : "—"}
                    sub={t("fleetDashboard.kpi.tripsInDraft")}
                    icon={Package}
                    color="blue"
                    isDark={isDark}
                />
            </motion.div>

            {/* Secondary KPI row */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <KpiCard
                    label={t("fleetDashboard.kpi.activeTrips")}
                    value={kpis ? `${kpis.trips.active}` : "—"}
                    sub={t("fleetDashboard.kpi.currentlyDispatched")}
                    icon={BarChart3}
                    color="teal"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.driversOnDuty")}
                    value={kpis ? `${kpis.drivers.onDuty}` : "—"}
                    sub={kpis ? t("fleetDashboard.kpi.ofDrivers", { total: kpis.drivers.total }) : ""}
                    icon={Users}
                    color="emerald"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.completedToday")}
                    value={kpis ? `${kpis.trips.completedToday}` : "—"}
                    sub={t("fleetDashboard.kpi.tripsFinishedToday")}
                    icon={CheckCircle2}
                    color="green"
                    isDark={isDark}
                />
                <KpiCard
                    label={t("fleetDashboard.kpi.expiringLicenses")}
                    value={kpis ? `${kpis.alerts.expiringLicenses}` : "—"}
                    sub={t("fleetDashboard.kpi.within30Days")}
                    icon={AlertTriangle}
                    color="red"
                    isDark={isDark}
                />
            </motion.div>

            {/* Live Fleet Map */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                className={cardClass}
            >
                {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />}
                {!isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />}
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                           <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                            {t("fleetDashboard.liveFleetMap")}
                        </h2>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${locations.length > 0 ? (isDark ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-blue-100 text-blue-700") : (isDark ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-500")}`}>
                        {locations.length > 0 ? t("fleetDashboard.vehiclesTracked", { count: locations.length }) : t("fleetDashboard.noLiveData")}
                    </span>
                </div>
                <div className={`rounded-2xl overflow-hidden border relative z-10 h-[280px] sm:h-[380px] ${isDark ? "border-slate-800" : "border-slate-200 shadow-inner"}`}>
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        style={{ width: "100%", height: "100%" }}
                        scrollWheelZoom
                    >
                        <TileLayer
                            url={isDark
                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            }
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                        />
                        {locations.map((loc) => (
                            <Marker key={loc.vehicleId} position={[loc.latitude, loc.longitude]} icon={truckIcon}>
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-bold">{loc.plateNumber || t("fleetDashboard.vehicleNumber", { id: loc.vehicleId })}</p>
                                        {loc.speed != null && <p className="text-xs text-neutral-500">{loc.speed} km/h</p>}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {/* Simulated moving vehicle: Mumbai → Pune */}
                        <Polyline positions={MOVING_ROUTE} color="#3b82f6" weight={3} opacity={0.5} dashArray="8 6" />
                        <Marker position={movingPos} icon={movingTruckIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">MH-01-AB-1234</p>
                                    <p className="text-xs text-blue-600 font-medium">{t("fleetDashboard.inTransit", { origin: "Mumbai", destination: "Pune" })}</p>
                                    <p className="text-xs text-neutral-500">~65 km/h</p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </motion.div>

            {/* Charts */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Revenue vs Cost trend */}
                <div className={`${cardClass} lg:col-span-2`}>
                    {isDark && <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />}
                    {!isDark && <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h2 className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                            {t("fleetDashboard.revenueCostYear", { year: new Date().getFullYear() })}
                        </h2>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>{t("fleetDashboard.monthly")}</span>
                    </div>
                    {monthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? "#64748b" : "#64748b", fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={v => v.split(" ")[0]} />
                                <YAxis tick={{ fontSize: 11, fill: isDark ? "#64748b" : "#64748b", fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "16px", fontSize: 13, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                                    itemStyle={{ fontWeight: 600 }}
                                    formatter={(v: unknown) => [`₹${Number(v).toLocaleString()}`]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" name="Revenue" />
                                <Area type="monotone" dataKey="totalCost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" name="Total Cost" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-slate-500 font-medium">
                            <Clock className="w-5 h-5 mr-2" /> {loading ? t("fleetDashboard.loadingChart") : t("fleetDashboard.noTripData")}
                        </div>
                    )}
                </div>

                {/* Fleet status donut */}
                <div className={cardClass}>
                    <h2 className={`text-lg font-bold mb-6 relative z-10 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {t("fleetDashboard.fleetStatus")}
                    </h2>
                    {expenseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={expenseData} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} stroke="none" dataKey="value">
                                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.9)", border: isDark ? "1px solid #334155" : "1px solid #e2e8f0", borderRadius: "16px", fontSize: 13, fontWeight: 600, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }} />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 500, paddingTop: "20px" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-neutral-400">
                            {loading ? t("common.loading") : t("fleetDashboard.noVehicles")}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Monthly table */}
            {monthly.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
                    className={cardClass}
                >
                    <h2 className={`text-lg font-bold mb-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {t("fleetDashboard.monthlyPerformance")}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className={isDark ? "text-slate-400 border-b border-slate-800" : "text-slate-500 border-b border-slate-200"}>
                                    {[t("fleetDashboard.tableHeaders.month"), t("fleetDashboard.tableHeaders.trips"), t("fleetDashboard.tableHeaders.distance"), t("fleetDashboard.tableHeaders.revenue"), t("fleetDashboard.tableHeaders.fuelCost"), t("fleetDashboard.tableHeaders.maintenance"), t("fleetDashboard.tableHeaders.profit")].map(h =>
                                        <th key={h} className="text-left pb-4 pr-4 font-bold text-xs uppercase tracking-wider">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {monthly.filter(m => m.tripsCompleted > 0).map(m => (
                                    <tr key={m.month} className={`transition-colors border-b last:border-0 ${isDark ? "border-slate-800 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50/80"}`}>
                                        <td className={`py-4 pr-4 font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{m.label}</td>
                                        <td className={`py-4 pr-4 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{m.tripsCompleted}</td>
                                        <td className={`py-4 pr-4 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{m.totalDistanceKm.toLocaleString()}</td>
                                        <td className="py-4 pr-4 text-emerald-500 font-bold">₹{m.revenue.toLocaleString()}</td>
                                        <td className={`py-4 pr-4 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>₹{m.fuelCost.toLocaleString()}</td>
                                        <td className={`py-4 pr-4 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>₹{m.maintenanceCost.toLocaleString()}</td>
                                        <td className={`py-4 font-extrabold ${m.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                            {m.profit >= 0 ? "+" : ""}₹{m.profit.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function KpiCard({ label, value, sub, icon: Icon, color, isDark }: {
    label: string; value: string; sub: string;
    icon: React.ElementType; color: string; isDark: boolean;
}) {
    const colorMap: Record<string, { bg: string; text: string; darkBg: string; glow: string }> = {
        emerald: { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50", text: "text-emerald-600", darkBg: "bg-emerald-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]" },
        amber: { bg: "bg-gradient-to-br from-amber-50 to-amber-100/50", text: "text-amber-600", darkBg: "bg-amber-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]" },
        violet: { bg: "bg-gradient-to-br from-violet-50 to-violet-100/50", text: "text-violet-600", darkBg: "bg-violet-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]" },
        blue: { bg: "bg-gradient-to-br from-blue-50 to-blue-100/50", text: "text-blue-600", darkBg: "bg-blue-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]" },
        teal: { bg: "bg-gradient-to-br from-teal-50 to-teal-100/50", text: "text-teal-600", darkBg: "bg-teal-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]" },
        green: { bg: "bg-gradient-to-br from-green-50 to-green-100/50", text: "text-green-600", darkBg: "bg-green-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]" },
        red: { bg: "bg-gradient-to-br from-red-50 to-red-100/50", text: "text-red-600", darkBg: "bg-red-500/10", glow: "group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]" },
    };
    const c = colorMap[color] ?? colorMap.emerald;
    return (
        <div className={`group ${card} ${isDark ? `${darkCard} ` : lightCard}`}>
            {isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
            {!isDark && <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-100 to-transparent opacity-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />}
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
                    <p className={`text-4xl font-extrabold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
                    <p className={`text-xs mt-2 font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>{sub}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${c.glow} ${isDark ? c.darkBg : c.bg}`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                </div>
            </div>
        </div>
    );
}
