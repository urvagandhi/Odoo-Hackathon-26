/**
 * FleetDashboard — Command Center (Page 2 per spec)
 * KPIs: Active Fleet, Maintenance Alerts, Utilization Rate, Pending Cargo
 * Charts: Revenue trend (line), Expense breakdown (donut)
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Truck, Wrench, TrendingUp, Package, Users, AlertTriangle,
    CheckCircle2, Clock, BarChart3, RefreshCw, MapPin,
} from "lucide-react";
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

const card = "rounded-2xl border p-5 transition-all duration-200";
const lightCard = "bg-white border-neutral-200 shadow-sm hover:shadow-md";
const darkCard = "bg-neutral-800 border-neutral-700 shadow-sm hover:shadow-md";

export default function FleetDashboard() {
    const { isDark } = useTheme();
    const cardClass = `${card} ${isDark ? darkCard : lightCard}`;
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
    const [locations, setLocations] = useState<Array<{ vehicleId: number; latitude: number; longitude: number; speed?: number; plateNumber?: string }>>([]);
    const [loading, setLoading] = useState(true);

    const fetch = async () => {
        setLoading(true);
        try {
            const [k, m] = await Promise.all([
                analyticsApi.getDashboardKPIs(),
                analyticsApi.getMonthlyReport(new Date().getFullYear()),
            ]);
            setKpis(k);
            setMonthly(m);
            // Fetch fleet locations (don't block on it)
            try {
                const locs = await locationsApi.getLatestLocations() as Array<{ vehicleId: number; latitude: number; longitude: number; speed?: number; vehicle?: { plateNumber?: string } }>;
                setLocations(locs.map(l => ({ vehicleId: l.vehicleId, latitude: l.latitude, longitude: l.longitude, speed: l.speed, plateNumber: l.vehicle?.plateNumber })));
            } catch { /* locations endpoint may return empty */ }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const expenseData = kpis ? [
        { name: "Active Fleet", value: kpis.fleet.onTrip },
        { name: "In Shop", value: kpis.fleet.inShop },
        { name: "Available", value: kpis.fleet.available },
        { name: "Retired", value: kpis.fleet.retired },
    ].filter(d => d.value > 0) : [];

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                        Command Center
                    </h1>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
                        Live fleet overview — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <button
                    onClick={fetch}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                <KpiCard
                    label="Active Fleet"
                    value={kpis ? `${kpis.fleet.onTrip}` : "—"}
                    sub={kpis ? `of ${kpis.fleet.total} total` : "loading..."}
                    icon={Truck}
                    color="emerald"
                    isDark={isDark}
                />
                <KpiCard
                    label="Maintenance Alerts"
                    value={kpis ? `${kpis.fleet.inShop}` : "—"}
                    sub="vehicles in shop"
                    icon={Wrench}
                    color="amber"
                    isDark={isDark}
                />
                <KpiCard
                    label="Utilization Rate"
                    value={kpis ? kpis.fleet.utilizationRate : "—"}
                    sub="fleet assigned vs idle"
                    icon={TrendingUp}
                    color="violet"
                    isDark={isDark}
                />
                <KpiCard
                    label="Pending Cargo"
                    value={kpis ? `${kpis.trips.pending}` : "—"}
                    sub="trips in DRAFT"
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
                    label="Active Trips"
                    value={kpis ? `${kpis.trips.active}` : "—"}
                    sub="currently dispatched"
                    icon={BarChart3}
                    color="teal"
                    isDark={isDark}
                />
                <KpiCard
                    label="Drivers On Duty"
                    value={kpis ? `${kpis.drivers.onDuty}` : "—"}
                    sub={kpis ? `of ${kpis.drivers.total} drivers` : ""}
                    icon={Users}
                    color="emerald"
                    isDark={isDark}
                />
                <KpiCard
                    label="Completed Today"
                    value={kpis ? `${kpis.trips.completedToday}` : "—"}
                    sub="trips finished today"
                    icon={CheckCircle2}
                    color="green"
                    isDark={isDark}
                />
                <KpiCard
                    label="Expiring Licenses"
                    value={kpis ? `${kpis.alerts.expiringLicenses}` : "—"}
                    sub="within 30 days"
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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                            Live Fleet Map
                        </h2>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${locations.length > 0 ? "bg-emerald-500/10 text-emerald-500" : isDark ? "bg-neutral-700 text-neutral-400" : "bg-neutral-100 text-neutral-500"}`}>
                        {locations.length > 0 ? `${locations.length} vehicle${locations.length > 1 ? "s" : ""} tracked` : "No live data"}
                    </span>
                </div>
                <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700" style={{ height: 340 }}>
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
                                        <p className="font-bold">{loc.plateNumber || `Vehicle #${loc.vehicleId}`}</p>
                                        {loc.speed != null && <p className="text-xs text-neutral-500">{loc.speed} km/h</p>}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>
                            Revenue vs Cost — {new Date().getFullYear()}
                        </h2>
                        <span className="text-xs text-emerald-500 font-semibold">Monthly</span>
                    </div>
                    {monthly.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
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
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f0f0f0"} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} tickFormatter={v => v.split(" ")[0]} />
                                <YAxis tick={{ fontSize: 10, fill: isDark ? "#9CA3AF" : "#6B7280" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: isDark ? "#1f2937" : "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: 12 }}
                                    formatter={(v: number, name: string) => [`₹${v.toLocaleString()}`, name]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                                <Area type="monotone" dataKey="totalCost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" name="Total Cost" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-neutral-400">
                            <Clock className="w-6 h-6 mr-2" /> {loading ? "Loading chart..." : "No trip data yet"}
                        </div>
                    )}
                </div>

                {/* Fleet status donut */}
                <div className={cardClass}>
                    <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>
                        Fleet Status
                    </h2>
                    {expenseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-neutral-400">
                            {loading ? "Loading..." : "No vehicles"}
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
                    <h2 className={`text-base font-bold mb-4 ${isDark ? "text-white" : "text-neutral-900"}`}>
                        Monthly Performance Summary
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={isDark ? "text-neutral-400 border-b border-neutral-700" : "text-neutral-500 border-b border-neutral-100"}>
                                    {["Month", "Trips", "Distance (km)", "Revenue", "Fuel Cost", "Maintenance", "Profit"].map(h =>
                                        <th key={h} className="text-left pb-3 pr-4 font-semibold text-xs">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {monthly.filter(m => m.tripsCompleted > 0).map(m => (
                                    <tr key={m.month} className={isDark ? "border-b border-neutral-700/50" : "border-b border-neutral-50"}>
                                        <td className={`py-2.5 pr-4 font-medium ${isDark ? "text-white" : "text-neutral-900"}`}>{m.label}</td>
                                        <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{m.tripsCompleted}</td>
                                        <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{m.totalDistanceKm.toLocaleString()}</td>
                                        <td className="py-2.5 pr-4 text-emerald-500 font-semibold">₹{m.revenue.toLocaleString()}</td>
                                        <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{m.fuelCost.toLocaleString()}</td>
                                        <td className={`py-2.5 pr-4 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>₹{m.maintenanceCost.toLocaleString()}</td>
                                        <td className={`py-2.5 font-bold ${m.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
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
    const colorMap: Record<string, { bg: string; text: string; darkBg: string }> = {
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "bg-emerald-500/10" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", darkBg: "bg-amber-500/10" },
        violet: { bg: "bg-violet-50", text: "text-violet-600", darkBg: "bg-violet-500/10" },
        blue: { bg: "bg-blue-50", text: "text-blue-600", darkBg: "bg-blue-500/10" },
        teal: { bg: "bg-teal-50", text: "text-teal-600", darkBg: "bg-teal-500/10" },
        green: { bg: "bg-green-50", text: "text-green-600", darkBg: "bg-green-500/10" },
        red: { bg: "bg-red-50", text: "text-red-600", darkBg: "bg-red-500/10" },
    };
    const c = colorMap[color] ?? colorMap.emerald;
    return (
        <div className={`${card} ${isDark ? `${darkCard} ` : lightCard}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-xs font-semibold mb-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{label}</p>
                    <p className={`text-3xl font-extrabold ${isDark ? "text-white" : "text-neutral-900"}`}>{value}</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? c.darkBg : c.bg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
            </div>
        </div>
    );
}
