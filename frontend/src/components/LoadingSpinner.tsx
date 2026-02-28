/**
 * Reusable loading spinner.
 */
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

export default function LoadingSpinner({ message }: { message?: string }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const displayMessage = message ?? t("common.loading");
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className={`w-10 h-10 border-4 rounded-full animate-spin ${isDark ? 'border-neutral-700 border-t-violet-500' : 'border-indigo-200 border-t-indigo-600'}`} />
      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>{displayMessage}</p>
    </div>
  );
}
