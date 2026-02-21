/**
 * Reusable loading spinner.
 */
import { useTheme } from "../context/ThemeContext";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={`w-10 h-10 border-4 rounded-full animate-spin ${isDark ? 'border-neutral-700 border-t-violet-500' : 'border-indigo-200 border-t-indigo-600'}`} />
      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{message}</p>
    </div>
  );
}
