import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { loginSchema } from "../validators/auth";
import { authApi } from "../api/client";

// ── Stagger container for feature list ────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

const FEATURES = [
  "React 19 + TypeScript frontend",
  "FastAPI + PostgreSQL backend",
  "Production-grade UX patterns",
  "Docker-ready deployment",
];

export default function Login() {
  const navigate = useNavigate();

  // Theme
  const [isDark, setIsDark] = useState(false);

  // Form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shake, setShake] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Validation helpers ───────────────────────────────────────────────────
  const validateField = (field: "email" | "password", value: string) => {
    const result = loginSchema.shape[field].safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error.issues[0].message }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleChange =
    (field: "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) validateField(field, value);
    };

  const handleBlur = (field: "email" | "password") => () => {
    if (form[field]) validateField(field, form[field]);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      triggerShake();
      return;
    }

    setLoading(true);
    setProgress(60);
    const t1 = setTimeout(() => setProgress(85), 400);
    const t2 = setTimeout(() => setProgress(90), 2000);

    try {
      await authApi.login(result.data);
      if (rememberMe) localStorage.setItem("remember_me", "true");
      setProgress(100);
      await new Promise((r) => setTimeout(r, 180));
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      setServerError(message);
      triggerShake();
      setProgress(0);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Animated gradient hero
      ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden animated-gradient bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        {/* Floating blob 1 */}
        <div className="animate-blob absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-white/10 blur-3xl" />
        {/* Floating blob 2 */}
        <div className="animate-blob animation-delay-2000 absolute top-1/2 -right-16 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl" />
        {/* Floating blob 3 */}
        <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-indigo-300/15 blur-3xl" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              HackStack
            </span>
          </motion.div>

          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 ring-1 ring-white/25 mb-5">
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span className="text-xs font-medium text-indigo-100">
                Odoo Hackathon 2026
              </span>
            </div>

            <h1 className="text-[2.75rem] font-extrabold text-white leading-[1.15] tracking-tight">
              Build faster.
              <br />
              Ship smarter.
              <br />
              <span className="text-indigo-200">Win the hackathon.</span>
            </h1>

            <p className="mt-5 text-indigo-200 text-base max-w-sm leading-relaxed">
              Your production-grade full-stack boilerplate is ready. Sign in
              and start shipping features that matter.
            </p>

            {/* Feature list */}
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="mt-8 space-y-3"
            >
              {FEATURES.map((feature) => (
                <motion.li
                  key={feature}
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span className="text-sm text-indigo-100">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Bottom caption */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-indigo-300/70 text-xs"
          >
            © 2026 HackStack · Built with ♥ for the hackathon
          </motion.p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Form
      ════════════════════════════════════════════════════════ */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto relative transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        {/* ── Theme toggle ──────────────────────────────────────── */}
        <motion.button
          type="button"
          onClick={() => setIsDark((v) => !v)}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          aria-label="Toggle theme"
          className={`
            absolute top-5 right-5 w-9 h-9 rounded-xl
            flex items-center justify-center
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            ${
              isDark
                ? "bg-slate-800 text-amber-400 hover:bg-slate-700 focus:ring-offset-slate-900"
                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
            }
          `}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? "sun" : "moon"}
              initial={{ rotate: -40, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 40, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="flex"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 mb-10 lg:hidden"
        >
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
            HackStack
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Welcome back
            </h2>
            <p className={`mt-1.5 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Server error banner */}
          <AnimatePresence>
            {serverError && (
              <motion.div
                key="server-error"
                initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={`flex items-start gap-3 px-4 py-3 border rounded-xl text-sm overflow-hidden ${
                  isDark
                    ? "bg-red-950/50 border-red-800/60 text-red-300"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isDark ? "text-red-400" : "text-red-500"
                  }`}
                />
                {serverError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ──────────────────────────────────────────────── */}
          <motion.form
            onSubmit={handleSubmit}
            animate={shake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-1.5 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-150 ${
                    errors.email
                      ? "text-red-400"
                      : isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    ${
                      isDark
                        ? `text-slate-100 placeholder:text-slate-600 ${
                            errors.email
                              ? "border-red-700 bg-red-950/40"
                              : "border-slate-600 bg-slate-800 hover:border-slate-500"
                          }`
                        : `placeholder:text-slate-400 ${
                            errors.email
                              ? "border-red-400 bg-red-50/60"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`
                    }
                  `}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    key="email-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-1.5 text-xs text-red-500 flex items-center gap-1 overflow-hidden"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className={`block text-sm font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium transition-colors duration-150 focus:outline-none focus:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-150 ${
                    errors.password
                      ? "text-red-400"
                      : isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  className={`
                    w-full pl-10 pr-11 py-2.5 border rounded-xl text-sm
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    ${
                      isDark
                        ? `text-slate-100 placeholder:text-slate-600 ${
                            errors.password
                              ? "border-red-700 bg-red-950/40"
                              : "border-slate-600 bg-slate-800 hover:border-slate-500"
                          }`
                        : `placeholder:text-slate-400 ${
                            errors.password
                              ? "border-red-400 bg-red-50/60"
                              : "border-slate-300 bg-white hover:border-slate-400"
                          }`
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 focus:outline-none ${
                    isDark
                      ? "text-slate-500 hover:text-slate-300 focus:text-indigo-400"
                      : "text-slate-400 hover:text-slate-600 focus:text-indigo-600"
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    key="password-error"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="mt-1.5 text-xs text-red-500 flex items-center gap-1 overflow-hidden"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5 pt-0.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className={`text-sm cursor-pointer select-none ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={loading ? undefined : { scale: 0.97 }}
              whileHover={loading ? undefined : { y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="
                w-full flex items-center justify-center gap-2
                px-6 py-3 rounded-xl text-sm font-semibold text-white
                bg-indigo-600 hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-150
                shadow-sm hover:shadow-md
                cursor-pointer
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Progress bar — sits right below the Sign in button */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, scaleX: 0.96 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className={`h-1 w-full rounded-full overflow-hidden ${
                    isDark ? "bg-slate-700" : "bg-slate-200"
                  }`}
                >
                  <motion.div
                    className="h-full rounded-full bg-indigo-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: progress === 100 ? 0.15 : 0.8,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div
                className={`w-full border-t ${
                  isDark ? "border-slate-700" : "border-slate-200"
                }`}
              />
            </div>
            <div className="relative flex justify-center">
              <span
                className={`px-3 text-xs font-medium ${
                  isDark
                    ? "bg-slate-900 text-slate-500"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                or continue with
              </span>
            </div>
          </div>

          {/* Google SSO placeholder */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`
              w-full flex items-center justify-center gap-3
              px-6 py-3 rounded-xl text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer
              ${
                isDark
                  ? "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600 focus:ring-slate-600 focus:ring-offset-slate-900"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50/80 focus:ring-slate-300"
              }
            `}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </motion.button>

          {/* Sign up link */}
          <p
            className={`mt-7 text-center text-sm ${
              isDark ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-indigo-500 font-semibold hover:text-indigo-400 transition-colors duration-150 focus:outline-none focus:underline"
            >
              Create one free
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
