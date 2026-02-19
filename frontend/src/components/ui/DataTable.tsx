/**
 * DataTable — generic table primitive for CRUD pages.
 * Accepts column definitions and rows. Handles empty + loading states.
 */
import { motion } from "framer-motion";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  skeletonRows?: number;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="relative h-4 rounded bg-slate-100 overflow-hidden" style={{ width: `${60 + (i % 3) * 20}%` }}>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
          </div>
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyTitle = "No data yet",
  emptyMessage = "Create your first record to get started.",
  skeletonRows = 5,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors duration-100"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-slate-700 ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
