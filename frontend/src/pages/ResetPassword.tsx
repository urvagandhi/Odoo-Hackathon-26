/**
 * ResetPassword — user enters new password using reset token from URL.
 */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { LogoIcon } from "../components/Branding/Logo";
import { useTheme } from "../context/ThemeContext";
import { authApi } from "../api/client";

/**
 * Render a password reset page that lets a user set a new password using a token from the URL.
 *
 * The component:
 * - Extracts a `token` from the URL search params and displays a form to enter and confirm a new password.
 * - Validates the new password for at least 8 characters, at least one uppercase letter, and at least one number, and verifies the confirmation matches.
 * - Submits the new password to the API using the extracted token, surfaces server-provided errors, and on success shows a confirmation and navigates to the login page after a short delay.
 *
 * @returns The React element for the reset-password UI.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (form.newPassword.length < 8)
      errs.newPassword = t("auth.validation.minChars");
    else if (!/[A-Z]/.test(form.newPassword))
      errs.newPassword = t("auth.validation.uppercase");
    else if (!/[0-9]/.test(form.newPassword))
      errs.newPassword = t("auth.validation.number");

    if (form.confirmPassword !== form.newPassword)
      errs.confirmPassword = t("auth.validation.mismatch");

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    if (!token) {
      setServerError(t("auth.resetPassword.missingToken"));
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, form.newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : "Something went wrong. Try again.");
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full pl-11 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
      isDark
        ? `bg-neutral-900 border text-white placeholder:text-neutral-600 ${
            errors[field]
              ? "border-red-500/50 focus:ring-red-500/40"
              : "border-neutral-800 focus:ring-emerald-500/40 focus:border-transparent"
          }`
        : `bg-white border text-neutral-900 placeholder:text-neutral-400 ${
            errors[field]
              ? "border-red-300 focus:ring-red-500/30"
              : "border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
          }`
    }`;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-8 transition-colors duration-300 ${
        isDark ? "bg-neutral-950" : "bg-[#f5f5f0]"
      }`}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          isDark
            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        }`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <LogoIcon className="w-6 h-6" />
          </div>
          <span
            className={`text-xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            FleetFlow
          </span>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.resetPassword.backToLogin")}
        </Link>

        {!success ? (
          <>
            <div className="space-y-2 mb-8">
              <h2
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-neutral-900"
                }`}
              >
                {t("auth.resetPassword.title")}
              </h2>
              <p className="text-sm text-neutral-500">
                {t("auth.resetPassword.description")}
              </p>
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 flex items-start gap-3 p-4 rounded-xl ${
                  isDark
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isDark ? "text-red-400" : "text-red-500"
                  }`}
                />
                <p
                  className={`text-sm ${
                    isDark ? "text-red-400" : "text-red-600"
                  }`}
                >
                  {serverError}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  {t("auth.resetPassword.newPasswordLabel")}
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-neutral-500" : "text-neutral-400"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                    className={inputClass("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark
                        ? "text-neutral-500 hover:text-neutral-300"
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  {t("auth.resetPassword.confirmPasswordLabel")}
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-neutral-500" : "text-neutral-400"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                    className={inputClass("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("auth.resetPassword.submit")
                )}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl text-center ${
              isDark
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-emerald-50 border border-emerald-200"
            }`}
          >
            <CheckCircle2
              className={`w-12 h-12 mx-auto mb-3 ${
                isDark ? "text-emerald-400" : "text-emerald-600"
              }`}
            />
            <h3
              className={`text-lg font-bold mb-1 ${
                isDark ? "text-white" : "text-neutral-900"
              }`}
            >
              {t("auth.resetPassword.successTitle")}
            </h3>
            <p
              className={`text-sm ${
                isDark ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              {t("auth.resetPassword.successMessage")}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
