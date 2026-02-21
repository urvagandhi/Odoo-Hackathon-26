/**
 * Login — single unified login page for ALL roles.
 * Clean design with light/dark theme support.
 * Role is determined from the database, not from the login portal.
 */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Truck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  BarChart3,
  Shield,
  Zap,
  KeyRound,
} from "lucide-react";
import { loginSchema } from "../validators/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const validateField = (field: "email" | "password", value: string) => {
    const result = loginSchema.shape[field].safeParse(value);
    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: result.error.issues[0].message }));
    } else {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handleChange =
    (field: "email" | "password") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) validateField(field, value);
    };

  const handleBlur = (field: "email" | "password") => () => {
    if (form[field]) validateField(field, form[field]);
  };

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
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    try {
      await login(result.data.email, result.data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Login failed. Please try again.");
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isDark ? "bg-neutral-950" : "bg-[#f5f5f0]"
      }`}
    >
      {/* ═══ LEFT — Brand panel ══════════════════════════════════════ */}
      <div
        className={`hidden lg:flex lg:w-[45%] relative overflow-hidden ${
          isDark
            ? "bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900"
            : "bg-gradient-to-b from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]"
        }`}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500 opacity-[0.06] blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FleetFlow</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Fleet Management
              <br />
              <span className="text-neutral-400">Made Intelligent</span>
            </h1>
            <p className="text-neutral-500 text-base max-w-sm leading-relaxed">
              Real-time tracking, dispatch optimization, and comprehensive fleet
              analytics — all in one platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BarChart3, label: "Analytics" },
                { icon: Shield, label: "Secure" },
                { icon: Zap, label: "Real-time" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Vehicles", value: "2,400+" },
              { label: "Countries", value: "18" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Login form ══════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Theme toggle — top right */}
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
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
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

          {/* Heading */}
          <div className="space-y-2 mb-8">
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-neutral-900"
              }`}
            >
              Welcome back
            </h2>
            <p className={isDark ? "text-neutral-500 text-sm" : "text-neutral-500 text-sm"}>
              Sign in to your FleetFlow account
            </p>
          </div>

          {/* Server error */}
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
                className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}
              >
                {serverError}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            animate={shake ? { x: [0, -8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-neutral-400" : "text-neutral-700"
                }`}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-neutral-500" : "text-neutral-400"
                  }`}
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  placeholder="your@email.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? `border text-white placeholder:text-neutral-600 ${
                          errors.email
                            ? "bg-red-500/10 border-red-500/50 focus:ring-red-500/40"
                            : "bg-neutral-900 border-neutral-800 focus:ring-emerald-500/40 focus:border-transparent"
                        }`
                      : `border text-neutral-900 placeholder:text-neutral-400 ${
                          errors.email
                            ? "bg-red-50 border-red-300 focus:ring-red-500/30"
                            : "bg-white border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
                        }`
                  }`}
                />
              </div>
              {errors.email && (
                <p className={`mt-1.5 text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-neutral-500" : "text-neutral-400"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  placeholder="Enter password"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? `border text-white placeholder:text-neutral-600 ${
                          errors.password
                            ? "bg-red-500/10 border-red-500/50 focus:ring-red-500/40"
                            : "bg-neutral-900 border-neutral-800 focus:ring-emerald-500/40 focus:border-transparent"
                        }`
                      : `border text-neutral-900 placeholder:text-neutral-400 ${
                          errors.password
                            ? "bg-red-50 border-red-300 focus:ring-red-500/30"
                            : "bg-white border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
                        }`
                  }`}
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
              {errors.password && (
                <p className={`mt-1.5 text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>

          <p
            className={`mt-8 text-center text-xs ${
              isDark ? "text-neutral-600" : "text-neutral-400"
            }`}
          >
            Don't have an account? Contact your administrator.
          </p>

          {/* Demo credentials hint */}
          <div className={`mt-6 rounded-xl p-4 border text-xs ${
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
          }`}>
            <p className={`flex items-center gap-1.5 font-semibold mb-2 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              <KeyRound className="w-3.5 h-3.5" />
              Demo Credentials
            </p>
            <div className="space-y-1">
              {[
                { role: "Manager",        email: "manager@fleetflow.io",    pw: "FleetFlow@2025" },
                { role: "Dispatcher",     email: "dispatcher@fleetflow.io", pw: "FleetFlow@2025" },
                { role: "Safety Officer", email: "safety@fleetflow.io",     pw: "FleetFlow@2025" },
                { role: "Finance",        email: "finance@fleetflow.io",    pw: "FleetFlow@2025" },
              ].map(({ role, email, pw }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm({ email, password: pw })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-neutral-800 text-neutral-400"
                      : "hover:bg-neutral-100 text-neutral-500"
                  }`}
                >
                  <span className={`font-medium ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{role}</span>
                  {" — "}{email}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
