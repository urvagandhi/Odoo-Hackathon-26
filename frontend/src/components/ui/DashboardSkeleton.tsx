import { useTheme } from "../../context/ThemeContext";

export function DashboardSkeleton() {
  const { isDark } = useTheme();
  
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className={`h-8 w-64 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
          <div className={`h-4 w-48 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`w-10 h-10 rounded-xl mb-3 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
            <div className={`h-8 w-16 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
            <div className={`h-3 w-24 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 h-[350px] rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} animate-pulse`} />
        <div className={`h-[350px] rounded-2xl border ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} animate-pulse`} />
      </div>
    </div>
  );
}
