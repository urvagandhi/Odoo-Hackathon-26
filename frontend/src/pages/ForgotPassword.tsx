/**
 * ForgotPassword — user enters email to receive a password reset link.
 * In dev mode the reset token is returned directly; in prod it would be emailed.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Truck,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { authApi } from "../api/client";

export default function ForgotPassword() {
  const { isDark, toggleTheme } = useTheme();
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
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
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
        (err instanceof Error ? err.message : "Something went wrong. Try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span
            className={`text-xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-neutral-900"
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
          Back to login
        </Link>

        {!success ? (
          <>
            <div className="space-y-2 mb-8">
              <h2
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-neutral-900"
                }`}
              >
                Forgot your password?
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-neutral-500" : "text-neutral-500"
                }`}
              >
                Enter your email and we'll send you a link to reset your
                password.
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
                    isDark ? "text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-neutral-500" : "text-neutral-400"
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="your@email.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? `bg-neutral-900 border text-white placeholder:text-neutral-600 ${
                            emailError
                              ? "border-red-500/50 focus:ring-red-500/40"
                              : "border-neutral-800 focus:ring-emerald-500/40 focus:border-transparent"
                          }`
                        : `bg-white border text-neutral-900 placeholder:text-neutral-400 ${
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send reset link"
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
                If an account with that email exists, a password reset link has
                been sent.
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
                  🛠 DEV MODE — Reset link:
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
              ← Back to login
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
