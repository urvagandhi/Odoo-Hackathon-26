/**
 * DataTable — generic table primitive for CRUD pages.
 * Accepts column definitions and rows. Handles empty + loading states.
 */
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

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

function SkeletonRow({ cols, isDark }: { cols: number; isDark: boolean }) {
  return (
    <tr className={`border-b last:border-0 ${isDark ? 'border-neutral-700' : 'border-slate-100'}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`relative h-4 rounded overflow-hidden ${isDark ? 'bg-neutral-700' : 'bg-slate-100'}`} style={{ width: `${60 + (i % 3) * 20}%` }}>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
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
  const { isDark } = useTheme();

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-200'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className={`border-b ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-slate-200 bg-slate-50'}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-neutral-400' : 'text-slate-500'} ${col.className ?? ""}`}
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
                <SkeletonRow key={i} cols={columns.length} isDark={isDark} />
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{emptyTitle}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b last:border-0 transition-colors duration-100 ${isDark ? 'border-neutral-700 hover:bg-neutral-700/50' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${isDark ? 'text-neutral-300' : 'text-slate-700'} ${col.className ?? ""}`}>
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
