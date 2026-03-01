/**
 * DataTable — generic table primitive for CRUD pages.
 * Accepts column definitions and rows. Handles empty + loading states.
 */
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string | null;
  emptyMessage?: string | null;
  skeletonRows?: number;
}

function SkeletonRow({ cols, isDark }: { cols: number; isDark: boolean }) {
  return (
    <tr className={`border-b last:border-0 ${isDark ? 'border-[#1E2B22]' : 'border-slate-100'}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`relative h-4 rounded overflow-hidden ${isDark ? 'bg-[#1E2B22]' : 'bg-slate-100'}`} style={{ width: `${60 + (i % 3) * 20}%` }}>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  rows = [],
  rowKey,
  loading = false,
  emptyTitle,
  emptyMessage,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const resolvedEmptyTitle = emptyTitle ?? t("common.noDataYet");
  const resolvedEmptyMessage = emptyMessage ?? t("common.createFirstRecord");

  return (
    <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'bg-[#111A15] border-[#1E2B22] shadow-[0_6px_20px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className={`border-b ${isDark ? 'border-[#1E2B22] bg-[#111A15]/80' : 'border-slate-200 bg-slate-50'}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-[#6B7C6B]' : 'text-slate-500'} ${col.className ?? ""}`}
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
                  <p className={`text-sm font-medium ${isDark ? 'text-[#E4E6DE]' : 'text-slate-700'}`}>{resolvedEmptyTitle}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[#6B7C6B]' : 'text-slate-400'}`}>{resolvedEmptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b last:border-0 transition-colors duration-150 ${isDark ? 'border-[#1E2B22] hover:bg-[#182420]' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${isDark ? 'text-[#B0B8A8]' : 'text-slate-700'} ${col.className ?? ""}`}>
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
