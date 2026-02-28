/**
 * LicenseExpiryBadge — color-coded license expiry indicator.
 * > 90 days → green, 30-90 → amber, < 30 → red, expired → red bg EXPIRED
 */
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

interface LicenseExpiryBadgeProps {
  expiryDate: string;
  className?: string;
}

export function LicenseExpiryBadge({ expiryDate, className = "" }: LicenseExpiryBadgeProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
        isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"
      } ${className}`}>
        {t("ui.licenseExpiry.expired")}
      </span>
    );
  }

  if (daysLeft < 30) {
    return (
      <span className={`text-xs font-semibold ${isDark ? "text-red-400" : "text-red-600"} ${className}`}>
        {t("ui.licenseExpiry.expiresIn", { days: daysLeft })}
      </span>
    );
  }

  if (daysLeft <= 90) {
    return (
      <span className={`text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"} ${className}`}>
        {t("ui.licenseExpiry.expiringIn", { days: daysLeft })}
      </span>
    );
  }

  // > 90 days — show formatted date in green
  const formatted = expiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <span className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"} ${className}`}>
      {formatted}
    </span>
  );
}
