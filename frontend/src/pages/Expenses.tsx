/**
 * Expenses — tabbed page for Fuel Logs and Misc Expenses.
 * Each tab has its own DataTable with pagination.
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Fuel,
  Receipt,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { financeApi } from "../api/client";
import { DataTable, type Column } from "../components/ui/DataTable";
import { ExpenseForm } from "../components/forms/ExpenseForm";

/* ── Types ──────────────────────────────────────────────── */
interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  vehicle?: { licensePlate: string; make: string; model: string };
  trip?: { id: string };
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometerAtFill: number;
  fuelStation?: string;
  createdAt: string;
}

interface Expense {
  id: string;
  vehicleId: string;
  tripId?: string;
  vehicle?: { licensePlate: string; make: string; model: string };
  trip?: { id: string };
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
}

type Tab = "fuel" | "expenses";

/**
 * Render the Expenses page with tabbed views for fuel logs and miscellaneous expenses, including search, pagination, summary cards, and a role-restricted form to add records.
 *
 * The component fetches and normalizes fuel logs and expenses on mount, provides client-side filtering and pagination, computes totals, and exposes UI controls for switching tabs, searching, and opening the add-record form (visible to users with MANAGER or FINANCE_ANALYST roles). Table columns, empty states, and labels are localized; visual styling adapts to the current theme.
 *
 * @returns The Expenses page React element.
 */
export default function Expenses() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>("fuel");
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(true);
  const [loadingExp, setLoadingExp] = useState(true);
  const [fuelPage, setFuelPage] = useState(1);
  const [expPage, setExpPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const limit = 10;

  const canMutate =
    user?.role === "MANAGER" ||
    user?.role === "FINANCE_ANALYST";

  /* ── Fetch Fuel Logs ──────────────────────────────── */
  const fetchFuel = useCallback(async () => {
    setLoadingFuel(true);
    try {
      const res = await financeApi.listFuelLogs();
      const list = (Array.isArray(res) ? res : []) as unknown as Record<string, unknown>[];
      setFuelLogs(
        list.map((l) => ({
          ...l,
          id: String(l.id),
          vehicleId: String(l.vehicleId),
          tripId: l.tripId ? String(l.tripId) : undefined,
        })) as FuelLog[]
      );
    } catch {
      setFuelLogs([]);
    } finally {
      setLoadingFuel(false);
    }
  }, []);

  /* ── Fetch Expenses ─────────────────────────────── */
  const fetchExp = useCallback(async () => {
    setLoadingExp(true);
    try {
      const res = await financeApi.listExpenses();
      const list = (Array.isArray(res) ? res : []) as unknown as Record<string, unknown>[];
      setExpenses(
        list.map((l) => ({
          ...l,
          id: String(l.id),
          vehicleId: String(l.vehicleId),
          tripId: l.tripId ? String(l.tripId) : undefined,
        })) as Expense[]
      );
    } catch {
      setExpenses([]);
    } finally {
      setLoadingExp(false);
    }
  }, []);

  useEffect(() => {
    fetchFuel();
    fetchExp();
  }, [fetchFuel, fetchExp]);

  /* ── Client-side search ──────────────────────────── */
  const q = search.toLowerCase();
  const filteredFuel = fuelLogs.filter(
    (l) =>
      !q ||
      l.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      l.fuelStation?.toLowerCase().includes(q)
  );
  const filteredExp = expenses.filter(
    (e) =>
      !q ||
      e.vehicle?.licensePlate?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
  );

  const fuelTotalPages = Math.ceil(filteredFuel.length / limit) || 1;
  const expTotalPages = Math.ceil(filteredExp.length / limit) || 1;
  const paginatedFuel = filteredFuel.slice((fuelPage - 1) * limit, fuelPage * limit);
  const paginatedExp = filteredExp.slice((expPage - 1) * limit, expPage * limit);

  /* ── Totals ──────────────────────────────────────── */
  const totalFuelCost = fuelLogs.reduce((s, l) => s + Number(l.totalCost || 0), 0);
  const totalExpAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  /* ── Tab styling ─────────────────────────────────── */
  const tabCls = (active: boolean) =>
    `flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl transition-colors cursor-pointer ${
      active
        ? isDark
          ? "bg-neutral-800 text-white border-b-2 border-emerald-500"
          : "bg-white text-slate-900 border-b-2 border-emerald-600"
        : isDark
        ? "text-neutral-400 hover:text-neutral-200"
        : "text-slate-500 hover:text-slate-700"
    }`;

  /* ── Fuel Columns ────────────────────────────────── */
  const fuelCols: Column<FuelLog>[] = [
    {
      key: "vehicle",
      header: t("expenses.fuelColumns.vehicle"),
      render: (l) => <span className="font-medium">{l.vehicle?.licensePlate ?? `#${l.vehicleId}`}</span>,
    },
    {
      key: "trip",
      header: t("expenses.fuelColumns.trip"),
      render: (l) => (l.tripId ? `#${l.tripId}` : "—"),
    },
    {
      key: "liters",
      header: t("expenses.fuelColumns.liters"),
      render: (l) => `${Number(l.liters).toFixed(1)} L`,
    },
    {
      key: "rate",
      header: t("expenses.fuelColumns.costPerLiter"),
      render: (l) => `₹${Number(l.costPerLiter).toFixed(2)}`,
    },
    {
      key: "total",
      header: t("expenses.fuelColumns.total"),
      render: (l) => <span className="font-mono font-semibold">₹{Number(l.totalCost).toLocaleString()}</span>,
    },
    {
      key: "odometer",
      header: t("expenses.fuelColumns.odometer"),
      render: (l) => `${Number(l.odometerAtFill).toLocaleString()} km`,
    },
    {
      key: "date",
      header: t("expenses.fuelColumns.date"),
      render: (l) => new Date(l.createdAt).toLocaleDateString(),
    },
  ];

  /* ── Expense Columns ─────────────────────────────── */
  const expCols: Column<Expense>[] = [
    {
      key: "vehicle",
      header: t("expenses.expenseColumns.vehicle"),
      render: (e) => <span className="font-medium">{e.vehicle?.licensePlate ?? `#${e.vehicleId}`}</span>,
    },
    {
      key: "trip",
      header: t("expenses.expenseColumns.trip"),
      render: (e) => (e.tripId ? `#${e.tripId}` : "—"),
    },
    {
      key: "category",
      header: t("expenses.expenseColumns.category"),
      render: (e) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-700"}`}>
          {e.category.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("expenses.expenseColumns.amount"),
      render: (e) => <span className="font-mono font-semibold">₹{Number(e.amount).toLocaleString()}</span>,
    },
    {
      key: "description",
      header: t("expenses.expenseColumns.description"),
      render: (e) => <span className="truncate max-w-[200px] block">{e.description || "—"}</span>,
    },
    {
      key: "date",
      header: t("expenses.expenseColumns.date"),
      render: (e) => new Date(e.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("expenses.title")}</h1>
            <p className={`text-sm ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
              {t("expenses.subtitle")}
            </p>
          </div>
        </div>
        {canMutate && (
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("expenses.addRecord")}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: t("expenses.summary.fuelLogs"), value: fuelLogs.length, sub: t("expenses.summary.total", { amount: "₹" + totalFuelCost.toLocaleString() }), color: "bg-amber-600" },
          { label: t("expenses.summary.expenses"), value: expenses.length, sub: t("expenses.summary.total", { amount: "₹" + totalExpAmount.toLocaleString() }), color: "bg-violet-600" },
          { label: t("expenses.summary.combined"), value: fuelLogs.length + expenses.length, sub: `₹${(totalFuelCost + totalExpAmount).toLocaleString()}`, color: "bg-emerald-600" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${isDark ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"}`}
          >
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{s.value}</p>
            <p className={`text-xs ${isDark ? "text-neutral-400" : "text-slate-500"}`}>{s.label}</p>
            <p className={`text-xs font-mono mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex">
          <button className={tabCls(tab === "fuel")} onClick={() => { setTab("fuel"); setSearch(""); }}>
            <Fuel className="w-4 h-4" /> {t("expenses.tabs.fuel", { count: fuelLogs.length })}
          </button>
          <button className={tabCls(tab === "expenses")} onClick={() => { setTab("expenses"); setSearch(""); }}>
            <Receipt className="w-4 h-4" /> {t("expenses.tabs.expenses", { count: expenses.length })}
          </button>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-full sm:w-64 ${
          isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}>
          <Search className={`w-4 h-4 ${isDark ? "text-neutral-400" : "text-slate-400"}`} />
          <input
            className="bg-transparent outline-none w-full placeholder-current opacity-60"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); tab === "fuel" ? setFuelPage(1) : setExpPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {tab === "fuel" ? (
        <>
          <DataTable
            columns={fuelCols}
            rows={paginatedFuel}
            rowKey={(l) => l.id}
            loading={loadingFuel}
            emptyTitle={t("expenses.empty.fuel")}
            emptyMessage={t("expenses.empty.fuelDesc")}
          />
          {fuelTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                {t("expenses.pagination", { page: fuelPage, totalPages: fuelTotalPages, count: filteredFuel.length })}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={fuelPage <= 1} onClick={() => setFuelPage((p) => p - 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={fuelPage >= fuelTotalPages} onClick={() => setFuelPage((p) => p + 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <DataTable
            columns={expCols}
            rows={paginatedExp}
            rowKey={(e) => e.id}
            loading={loadingExp}
            emptyTitle={t("expenses.empty.expenses")}
            emptyMessage={t("expenses.empty.expensesDesc")}
          />
          {expTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
                {t("expenses.pagination", { page: expPage, totalPages: expTotalPages, count: filteredExp.length })}
              </p>
              <div className="flex items-center gap-1">
                <button disabled={expPage <= 1} onClick={() => setExpPage((p) => p - 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={expPage >= expTotalPages} onClick={() => setExpPage((p) => p + 1)} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-neutral-700 text-neutral-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form */}
      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { fetchFuel(); fetchExp(); }}
        defaultTab={tab === "fuel" ? "fuel" : "expense"}
      />
    </div>
  );
}
