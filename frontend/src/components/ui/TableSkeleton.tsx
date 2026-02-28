import { useTheme } from "../../context/ThemeContext";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 6, rows = 5 }: TableSkeletonProps) {
  const { isDark } = useTheme();
  
  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${isDark ? "border-neutral-700 bg-neutral-800/50" : "border-slate-200 bg-slate-50"}`}>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className={`h-3 w-16 rounded animate-pulse ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className={`border-b last:border-0 ${isDark ? "border-neutral-700" : "border-slate-100"}`}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div 
                    className={`h-4 rounded animate-pulse ${isDark ? "bg-neutral-700" : "bg-slate-100"}`}
                    style={{ width: `${50 + (j % 3) * 20}%` }} 
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
