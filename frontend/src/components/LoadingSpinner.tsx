/**
 * LoadingSpinner (App Shell Skeleton)
 * High-fidelity wireframe to replace the generic spinner during initial auth/app load.
 */
import { useTheme } from "../context/ThemeContext";

export default function LoadingSpinner({ message }: { message?: string }) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex w-full transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* ── Sidebar Skeleton ── */}
      <aside className={`max-w-[260px] w-[260px] hidden md:flex flex-col shrink-0 border-r ${
        isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
      }`}>
        <div className="px-5 pt-6 pb-6 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
          <div className={`h-6 w-28 rounded-md animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        </div>
        
        <div className="px-4 py-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? "bg-slate-900/50" : "bg-slate-50/50"}`}>
              <div className={`w-5 h-5 rounded-md animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <div className={`h-4 w-32 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Content Skeleton ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header Skeleton */}
        <header className={`h-16 shrink-0 border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 ${
          isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 md:hidden rounded-lg animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-green-500/50" : "bg-green-400/50"}`} />
              <div className={`h-3 w-16 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`w-8 h-8 rounded-full animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`w-9 h-9 rounded-full animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
          </div>
        </header>

        {/* Page Content Skeleton */}
        <div className="flex-1 overflow-auto p-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {message && (
            <div className="flex items-center justify-center mb-6">
              <p className={`text-sm animate-pulse ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{message}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`h-8 w-48 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
              <div className={`h-4 w-64 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-xl mb-3 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
                <div className={`h-8 w-16 rounded-lg mb-2 animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
                <div className={`h-3 w-24 rounded animate-pulse ${isDark ? "bg-slate-800" : "bg-slate-100"}`} />
              </div>
            ))}
          </div>

          <div className={`h-[400px] rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} animate-pulse`} />
        </div>
      </main>
    </div>
  );
}
