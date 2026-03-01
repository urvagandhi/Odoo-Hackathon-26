/**
 * Login — single unified login page for ALL roles.
 * Clean design with light/dark theme support.
 * Role is determined from the database, not from the login portal.
 */
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
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
} from "lucide-react";
import { loginSchema } from "../validators/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("auth.login.pageTitle");
  }, []);

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
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(result.data.email, result.data.password);
      // Role-based redirect — each role opens their primary page
      const roleRedirect: Record<string, string> = {
        MANAGER: "/dashboard",
        DISPATCHER: "/dispatch",
        SAFETY_OFFICER: "/drivers",
        FINANCE_ANALYST: "/analytics",
      };
      const destination = from !== "/" ? from : (roleRedirect[loggedInUser.role] ?? "/dashboard");
      navigate(destination, { replace: true });
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
      className={`min-h-screen flex transition-colors duration-300 ${isDark ? "bg-[#090D0B]" : "bg-[#f5f5f0]"
        }`}
    >
      {/* ═══ LEFT — Brand panel ══════════════════════════════════════ */}
      <div
        className={`hidden lg:flex lg:w-[45%] relative overflow-hidden ${isDark
            ? "bg-gradient-to-b from-[#111A15] via-[#111A15] to-[#111A15]"
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
            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-lg">
              <img src="/logo-premium.png" alt="FleetFlow Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FleetFlow</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              {t("auth.login.heroTitle")}
              <br />
              <span className="text-[#6B7C6B]">{t("auth.login.heroSubtitle")}</span>
            </h1>
            <p className="text-[#4A5C4A] text-base max-w-sm leading-relaxed">
              {t("auth.login.heroDescription")}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BarChart3, label: t("auth.login.featureAnalytics") },
                { icon: Shield, label: t("auth.login.featureSecure") },
                { icon: Zap, label: t("auth.login.featureRealtime") },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#B0B8A8] text-xs font-medium"
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
              { label: t("auth.login.statVehicles"), value: "2,400+" },
              { label: t("auth.login.statCountries"), value: "18" },
              { label: t("auth.login.statUptime"), value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-[#4A5C4A] mt-1">{stat.label}</p>
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
          className={`absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark
              ? "bg-[#111A15] text-[#B0B8A8] hover:bg-[#182420]"
              : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          title={isDark ? t("auth.login.switchToLight") : t("auth.login.switchToDark")}
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
            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-lg">
              <img src="/logo-premium.png" alt="FleetFlow Logo" className="w-full h-full object-cover" />
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"
                }`}
            >
              FleetFlow
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2 mb-8">
            <h2
              className={`text-2xl font-bold ${isDark ? "text-[#E4E6DE]" : "text-neutral-900"
                }`}
            >
              {t("auth.login.welcomeBack")}
            </h2>
            <p className={isDark ? "text-[#4A5C4A] text-sm" : "text-[#4A5C4A] text-sm"}>
              {t("auth.login.signInSubtitle")}
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 flex items-start gap-3 p-4 rounded-xl ${isDark
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-red-50 border border-red-200"
                }`}
            >
              <AlertCircle
                className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-red-400" : "text-red-500"
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDark ? "text-[#6B7C6B]" : "text-neutral-700"
                  }`}
              >
                {t("auth.login.emailLabel")}
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"
                    }`}
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  placeholder={t("auth.login.emailPlaceholder")}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${isDark
                      ? `bg-[#111A15] border text-[#E4E6DE] placeholder:text-[#4A5C4A] ${errors.email
                        ? "border-red-500/50 focus:ring-red-500/40"
                        : "border-[#1E2B22] focus:ring-[#4ADE80]/40 focus:border-transparent"
                      }`
                      : `bg-white border text-neutral-900 placeholder:text-[#6B7C6B] ${errors.email
                        ? "border-red-300 focus:ring-red-500/30"
                        : "border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
                      }`
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className={`block text-sm font-medium ${isDark ? "text-[#6B7C6B]" : "text-neutral-700"
                    }`}
                >
                  {t("auth.login.passwordLabel")}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"
                    }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  className={`w-full pl-11 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${isDark
                      ? `bg-[#111A15] border text-[#E4E6DE] placeholder:text-[#4A5C4A] ${errors.password
                        ? "border-red-500/50 focus:ring-red-500/40"
                        : "border-[#1E2B22] focus:ring-[#4ADE80]/40 focus:border-transparent"
                      }`
                      : `bg-white border text-neutral-900 placeholder:text-[#6B7C6B] ${errors.password
                        ? "border-red-300 focus:ring-red-500/30"
                        : "border-neutral-300 focus:ring-emerald-500/30 focus:border-transparent"
                      }`
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark
                      ? "text-[#4A5C4A] hover:text-[#B0B8A8]"
                      : "text-[#6B7C6B] hover:text-neutral-600"
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
                <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? "bg-gradient-to-r from-[#22C55E] to-[#16A34A] shadow-lg shadow-emerald-500/20 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t("auth.login.signIn")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access for Testing */}
          <div className={`mt-8 pt-8 border-t ${isDark ? "border-[#1E2B22]" : "border-neutral-200"}`}>
            <p className={`text-center text-xs font-bold mb-4 uppercase tracking-widest ${isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"}`}>
              {t("auth.login.quickAccess")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: "Manager", email: "manager@fleetflow.io" },
                { role: "Dispatcher", email: "dispatcher@fleetflow.io" },
                { role: "Safety", email: "safety@fleetflow.io" },
                { role: "Finance", email: "finance@fleetflow.io" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={async () => {
                    const credentials = { email: item.email, password: "FleetFlow@2026" };
                    setForm(credentials);
                    setLoading(true);
                    try {
                      await login(credentials.email, credentials.password);
                      const roleRedirect: Record<string, string> = {
                        MANAGER: "/dashboard",
                        DISPATCHER: "/dispatch",
                        SAFETY_OFFICER: "/drivers",
                        FINANCE_ANALYST: "/analytics",
                      };
                      // Mocking basic role to path mapping for common name
                      const mappedRole = item.role === "Safety" ? "SAFETY_OFFICER" : 
                                       item.role === "Finance" ? "FINANCE_ANALYST" : 
                                       item.role.toUpperCase();
                      navigate(roleRedirect[mappedRole] || "/dashboard", { replace: true });
                    } catch (err: unknown) {
                      setServerError(t("auth.login.quickLoginFailed"));
                      setLoading(false);
                    }
                  }}
                  className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                    isDark
                      ? "bg-[#111A15] border-[#1E2B22] hover:border-[#4ADE80]/50 hover:bg-[#111A15]/50"
                      : "bg-white border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/30 shadow-sm"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"}`}>
                    {item.role}
                  </span>
                  <span className={`text-xs font-medium mt-0.5 ${isDark ? "text-[#B0B8A8]" : "text-neutral-600"}`}>
                    {item.email.split('@')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p
            className={`mt-6 text-center text-xs ${isDark ? "text-[#4A5C4A]" : "text-[#6B7C6B]"
              }`}
          >
            {t("auth.login.noAccount")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
