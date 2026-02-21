/**
 * Dashboard — MoveIQ-style fleet management dashboard.
 * Supports light and dark themes via ThemeContext.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Plus,
  Calendar,
  ArrowUpRight,
  MoreHorizontal,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/* ─── Types ──────────────────────────────────────────────────── */
type OrderStatus = "In transit" | "Delivered" | "Picked up";
type OrderTab = "Pending" | "Responded" | "Assigned" | "Completed";

interface Order {
  id: string;
  assignedTo: string;
  routeFrom: string;
  routeTo: string;
  flagFrom: string;
  flagTo: string;
  vehicle: string;
  estDelivery: string;
  status: OrderStatus;
}

/* ─── Mock Data ──────────────────────────────────────────────── */
const ORDERS: Order[] = [
  { id: "#875412903", assignedTo: "Clara Jensen", routeFrom: "Munich, DE", routeTo: "Rotterdam, NL", flagFrom: "🇩🇪", flagTo: "🇳🇱", vehicle: "Volvo FH16", estDelivery: "05 Oct, 2025", status: "In transit" },
  { id: "#458729654", assignedTo: "Michael Torres", routeFrom: "Warsaw, PL", routeTo: "Vienna, AT", flagFrom: "🇵🇱", flagTo: "🇦🇹", vehicle: "Mercedes Actros", estDelivery: "05 Oct, 2025", status: "Delivered" },
  { id: "#913562478", assignedTo: "Sofia Ricci", routeFrom: "Prague, CZ", routeTo: "Zurich, CH", flagFrom: "🇨🇿", flagTo: "🇨🇭", vehicle: "MAN TGX", estDelivery: "05 Oct, 2025", status: "Picked up" },
  { id: "#324561327", assignedTo: "Olivia Novak", routeFrom: "Madrid, ES", routeTo: "Lyon, FR", flagFrom: "🇪🇸", flagTo: "🇫🇷", vehicle: "Scania R500", estDelivery: "15 Sep, 2025", status: "In transit" },
  { id: "#667823145", assignedTo: "Erik Lindberg", routeFrom: "Stockholm, SE", routeTo: "Oslo, NO", flagFrom: "🇸🇪", flagTo: "🇳🇴", vehicle: "DAF XF", estDelivery: "08 Oct, 2025", status: "Delivered" },
];

const TABS: { label: OrderTab; count: number }[] = [
  { label: "Pending", count: 70 },
  { label: "Responded", count: 85 },
  { label: "Assigned", count: 53 },
  { label: "Completed", count: 56 },
];

const STATUS_COLORS: Record<OrderStatus, { dot: string; textLight: string; textDark: string }> = {
  "In transit": { dot: "bg-amber-500", textLight: "text-amber-700", textDark: "text-amber-400" },
  Delivered: { dot: "bg-emerald-500", textLight: "text-emerald-700", textDark: "text-emerald-400" },
  "Picked up": { dot: "bg-blue-500", textLight: "text-blue-700", textDark: "text-blue-400" },
};

const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const CHART_DATA = [20, 35, 45, 87, 60, 40, 55, 50, 45, 30];

const COUNTRIES = [
  { name: "Sweden", pct: 27, color: "bg-[#2d2d2d]", colorDark: "bg-neutral-300" },
  { name: "Iceland", pct: 18, color: "bg-[#4a4a4a]", colorDark: "bg-neutral-400" },
  { name: "Estonia", pct: 14, color: "bg-[#8a8a6a]", colorDark: "bg-amber-400" },
  { name: "Other", pct: 41, color: "bg-[#c4c4a0]", colorDark: "bg-emerald-400" },
];

/* ─── Animation ──────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<OrderTab>("Assigned");
  const [searchValue, setSearchValue] = useState("");
  const { isDark } = useTheme();

  /* ─── Theme-aware class helpers ──────────────────────────────── */
  const card = isDark
    ? "bg-neutral-800 border-neutral-700"
    : "bg-white border-neutral-200";
  const heading = isDark ? "text-white" : "text-neutral-900";
  const subtext = isDark ? "text-neutral-400" : "text-neutral-500";
  const subtextStrong = isDark ? "text-neutral-300" : "text-neutral-600";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ═══ TOP BAR: Search + Export + Add ═══════════════════════ */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${subtext}`} />
          <input
            type="text"
            placeholder="Search order..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-transparent transition-all ${
              isDark
                ? "bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                : "bg-white border-neutral-200 text-neutral-900"
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              isDark
                ? "border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add new shipment
          </button>
        </div>
      </motion.div>

      {/* ═══ CHARTS ROW ═════════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fulfillment Performance (3/5) */}
        <div className={`lg:col-span-3 rounded-2xl border p-6 ${card}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-bold ${heading}`}>Fulfillment Performance</h2>
            <div className="flex items-center gap-2">
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-white text-neutral-900 hover:bg-neutral-200"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-end gap-1 mb-2">
            {MONTHS.map((m) => (
              <div key={m} className={`flex-1 text-center text-xs font-medium ${subtext}`}>
                {m}
              </div>
            ))}
          </div>

          <div className="flex items-end gap-1 h-48">
            {CHART_DATA.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    i === 3
                      ? isDark
                        ? "bg-emerald-500"
                        : "bg-neutral-900"
                      : isDark
                      ? "bg-neutral-700 group-hover:bg-neutral-600"
                      : "bg-neutral-200 group-hover:bg-neutral-300"
                  }`}
                  style={{ height: `${val}%` }}
                />
                {i === 3 && (
                  <div
                    className={`absolute -top-8 text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isDark
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    87%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sales Overview (2/5) */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold ${heading}`}>Sales Overview</h2>
            <button
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isDark
                  ? "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-2">
            <span className={`text-4xl font-extrabold ${heading}`}>$716,084</span>
            <span className={`ml-2 text-sm ${subtext}`}>32.2%</span>
            <TrendingUp className="inline-block w-4 h-4 text-emerald-500 ml-1" />
          </div>

          {/* Gauge */}
          <div className="flex items-center justify-center my-6">
            <div className="relative w-48 h-24">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path
                  d="M 20 90 A 80 80 0 0 1 180 90"
                  fill="none"
                  stroke={isDark ? "#333" : "#e5e5e5"}
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path d="M 20 90 A 80 80 0 0 1 73 22" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" />
                <path d="M 73 22 A 80 80 0 0 1 127 22" fill="none" stroke="#a3a35a" strokeWidth="16" strokeLinecap="round" />
                <path d="M 127 22 A 80 80 0 0 1 180 90" fill="none" stroke={isDark ? "#555" : "#2d2d2d"} strokeWidth="16" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Country legend */}
          <div className="space-y-2">
            {COUNTRIES.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isDark ? c.colorDark : c.color}`} />
                  <span className={subtextStrong}>{c.name}</span>
                </div>
                <span className={`font-semibold ${heading}`}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ ORDERS TABLE ═══════════════════════════════════════════ */}
      <motion.div variants={itemVariants} className={`rounded-2xl border overflow-hidden ${card}`}>
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center justify-between border-b ${
            isDark ? "border-neutral-700" : "border-neutral-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-bold ${heading}`}>Orders</h2>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isDark ? "bg-neutral-700 text-neutral-300" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              264
            </span>
          </div>

          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.label
                    ? isDark
                      ? "bg-white text-neutral-900"
                      : "bg-[#1a1a1a] text-white"
                    : isDark
                    ? "text-neutral-400 hover:bg-neutral-700 hover:text-white"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs ${
                    activeTab === tab.label
                      ? isDark
                        ? "text-neutral-500"
                        : "text-neutral-300"
                      : "text-neutral-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}

            <button
              className={`ml-2 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                isDark
                  ? "border-neutral-700 text-neutral-400 hover:bg-neutral-700"
                  : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? "border-neutral-700" : "border-neutral-100"}`}>
                {["Order ID", "Order assigned to", "Route", "Vehicle", "Est. delivery", "Status", ""].map(
                  (h) => (
                    <th key={h} className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${subtext}`}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-neutral-800" : "divide-neutral-50"}`}>
              {ORDERS.map((order) => {
                const statusStyle = STATUS_COLORS[order.status];
                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isDark ? "hover:bg-neutral-700/30" : "hover:bg-neutral-50/50"
                    }`}
                  >
                    <td className={`px-6 py-4 text-sm font-medium ${heading}`}>{order.id}</td>
                    <td className={`px-6 py-4 text-sm ${subtextStrong}`}>{order.assignedTo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base leading-none">{order.flagFrom}</span>
                          <div className={`w-px h-3 ${isDark ? "bg-neutral-600" : "bg-neutral-300"}`} />
                          <span className="text-base leading-none">{order.flagTo}</span>
                        </div>
                        <div className={`text-xs ${subtext}`}>
                          <p>{order.routeFrom}</p>
                          <p>{order.routeTo}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${subtextStrong}`}>{order.vehicle}</td>
                    <td className={`px-6 py-4 text-sm ${subtext}`}>{order.estDelivery}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                        <span className={`text-sm font-medium ${isDark ? statusStyle.textDark : statusStyle.textLight}`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className={`text-xs font-medium transition-colors ${subtext} hover:${heading}`}>
                          See more
                        </button>
                        <button
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isDark
                              ? "text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300"
                              : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
