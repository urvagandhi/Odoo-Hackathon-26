/**
 * ForgotPassword — user enters email to receive a password reset link.
 * In dev mode the reset token is returned directly; in prod it would be emailed.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Mail,
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

export default function ForgotPassword() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    if (!email.trim()) {
      setEmailError(t("auth.forgotPassword.emailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t("auth.forgotPassword.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email);
      setSuccess(true);
      // In dev mode, the backend returns the token directly
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : t("common.error"));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-8 transition-colors duration-300 ${
        isDark ? "bg-[#090D0B]" : "bg-[#f5f5f0]"
      }`}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          isDark
            ? "bg-[#111A15] text-[#B0B8A8] hover:bg-[#182420]"
            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        }`}
        title={isDark ? t("common.switchToLight") : t("common.switchToDark")}
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
              isDark ? "text-[#E4E6DE]" : "text-neutral-900"
            }`}
          >
            FleetFlow
          </span>
        </div>

        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.forgotPassword.backToLogin")}
        </Link>

        {!success ? (
          <>
            <div className="space-y-2 mb-8">
              <h2
                className={`text-2xl font-bold ${
                  isDark ? "text-[#E4E6DE]" : "text-neutral-900"
                }`}
              >
                {t("auth.forgotPassword.title")}
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-[#6B7C6B]" : "text-[#4A5C4A]"
                }`}
              >
                {t("auth.forgotPassword.description")}
              </p>
            </div>

            {error && (
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
                  {error}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-[#6B7C6B]" : "text-neutral-700"
                  }`}
                >
                  {t("auth.forgotPassword.emailLabel")}
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder={t("auth.forgotPassword.emailPlaceholder")}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? `bg-[#111A15] border text-[#E4E6DE] placeholder:text-[#4A5C4A] ${
                            emailError
                              ? "border-red-500/50 focus:ring-red-500/40"
                              : "border-[#1E2B22] focus:ring-emerald-500/40 focus:border-transparent"
                          }`
                        : `bg-white border text-neutral-900 placeholder:text-[#6B7C6B] ${
                            emailError
                              ? "border-red-300 focus:ring-red-500/30"
                              : "border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
                          }`
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-400">{emailError}</p>
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
                  t("auth.forgotPassword.submit")
                )}
              </button>
            </form>
          </>
        ) : (
          /* ── Success state ────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div
              className={`flex items-center gap-3 p-4 rounded-xl ${
                isDark
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-emerald-50 border border-emerald-200"
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 ${
                  isDark ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
              <p
                className={`text-sm ${
                  isDark ? "text-emerald-300" : "text-emerald-700"
                }`}
              >
                {t("auth.forgotPassword.successMessage")}
              </p>
            </div>

            {/* DEV-only: show reset link */}
            {resetToken && (
              <div
                className={`p-4 rounded-xl ${
                  isDark
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-2 ${
                    isDark ? "text-amber-400" : "text-amber-700"
                  }`}
                >
                  {t("auth.forgotPassword.devModeLabel")}
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-sm text-emerald-500 hover:text-emerald-400 underline break-all"
                >
                  /reset-password?token={resetToken}
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="block text-center text-sm text-emerald-500 hover:text-emerald-400 transition-colors mt-4"
            >
              ← {t("auth.forgotPassword.backToLogin")}
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
