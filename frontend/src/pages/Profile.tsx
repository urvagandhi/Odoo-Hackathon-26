/**
 * Profile page — shows the authenticated user's details from auth context.
 * Includes "Edit Profile" button that opens a modal for name/email updates.
 * Follows FleetFlow UI theme: emerald accents, dark-green sidebar palette.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { analyticsApi, authApi, type DashboardKPIs } from "../api/client";
import { useToast } from "../hooks/useToast";

/* ── Animation helpers ────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

// Role labels are now from i18n: t("roles.MANAGER") etc.

const ROLE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  MANAGER: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-600" },
  DISPATCHER: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-600" },
  SAFETY_OFFICER: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", accent: "bg-amber-600" },
  FINANCE_ANALYST: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300", accent: "bg-violet-600" },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  // Edit profile modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (user?.role === "MANAGER" || user?.role === "FINANCE_ANALYST") {
      analyticsApi.getDashboardKPIs().then(setKpis).catch(() => {});
    }
  }, [user?.role]);

  if (!user) return null;

  const openEditModal = () => {
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditError("");
    setShowEdit(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({
        fullName: editName.trim(),
        email: editEmail.trim(),
      });
      await refreshUser();
      toast.success("Profile updated successfully", { title: "Profile" });
      setShowEdit(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile";
      setEditError(msg);
    } finally {
      setSaving(false);
    }
  };

  const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.MANAGER;
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-[1200px] mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* ── Hero Card ────────────────────────────── */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-white dark:bg-[#111A15] rounded-3xl border border-slate-200 dark:border-[#1E2B22] shadow-sm">
          <div className={`h-2 w-full ${roleStyle.accent}`} />
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full ${roleStyle.bg} flex items-center justify-center border-2 border-white dark:border-[#1E2B22] shadow`}>
                  <span className={`text-2xl sm:text-3xl font-bold ${roleStyle.text}`}>{initials}</span>
                </div>
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm" title="Online" />
              </div>

              {/* Name & role */}
              <div className="text-center sm:text-left flex-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${roleStyle.bg} border border-current/10 mb-3`}>
                  <Shield className={`w-3.5 h-3.5 ${roleStyle.text}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${roleStyle.text}`}>
                    {t(`roles.${user.role}`)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {user.fullName}
                </h1>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                <button
                  onClick={openEditModal}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                    bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.97] shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Info Cards Grid ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Contact & Role Details */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#111A15] rounded-2xl border border-slate-200 dark:border-[#1E2B22] shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1E2B22] bg-slate-50/30 dark:bg-[#090D0B]/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" />
                {t("profile.accountDetails")}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {[
                { icon: User, label: t("profile.fullName"), value: user.fullName },
                { icon: Mail, label: t("profile.email"), value: user.email },
                { icon: Shield, label: t("profile.role"), value: t(`roles.${user.role}`) },
                { icon: Calendar, label: t("profile.userId"), value: `#${user.id}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#111A15] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Role Capabilities */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#111A15] rounded-2xl border border-slate-200 dark:border-[#1E2B22] shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-[#1E2B22] bg-slate-50/30 dark:bg-[#090D0B]/30">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                {t("profile.yourCapabilities")}
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {(t(`profile.capabilities.${user.role}`, { returnObjects: true }) as string[]).map((cap) => (
                <div key={cap} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-neutral-300">{cap}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Quick KPI Summary (MANAGER / FINANCE only) ── */}
        {kpis && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("profile.kpi.totalVehicles"), value: kpis.fleet.total, icon: Truck, color: "text-emerald-600" },
              { label: t("profile.kpi.activeTrips"), value: kpis.trips.active, icon: MapPin, color: "text-emerald-600" },
              { label: t("profile.kpi.fleetUtilization"), value: kpis.fleet.utilizationRate, icon: Activity, color: "text-violet-600" },
              { label: t("profile.kpi.alerts"), value: kpis.alerts.maintenanceAlerts + kpis.alerts.expiringLicenses + kpis.alerts.suspendedDrivers, icon: AlertTriangle, color: "text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-[#111A15] rounded-2xl border border-slate-200 dark:border-[#1E2B22] p-5 shadow-sm">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── Edit Profile Modal ─────────────────────────── */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && setShowEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border p-6 shadow-2xl bg-white dark:bg-[#111A15] border-slate-200 dark:border-[#1E2B22]"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-500" />
                  Edit Profile
                </h2>
                <button onClick={() => setShowEdit(false)} className="p-1.5 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-[#1E2B22] text-neutral-400 dark:text-[#6B7C6B]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 text-sm rounded-xl p-3 flex items-center gap-2 text-red-500 dark:text-[#FCA5A5] bg-red-50 dark:bg-[#2D1518]/30 border border-red-100 dark:border-[#2D1518]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{editError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-[#B0B8A8]">
                    Full Name
                  </label>
                  <input
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors bg-white dark:bg-[#1E2B22] border-slate-200 dark:border-[#1E2B22] text-slate-900 dark:text-[#E4E6DE]"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-[#B0B8A8]">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="block w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors bg-white dark:bg-[#1E2B22] border-slate-200 dark:border-[#1E2B22] text-slate-900 dark:text-[#E4E6DE]"
                    placeholder="Enter email"
                  />
                </div>

                {/* Show current role (read-only) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1410] border border-slate-100 dark:border-[#1E2B22]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#6B7C6B] mb-1">Role (read-only)</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-[#B0B8A8]">{t(`roles.${user.role}`)}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors border-slate-200 dark:border-[#1E2B22] text-slate-600 dark:text-[#B0B8A8] hover:bg-slate-50 dark:hover:bg-[#1E2B22]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60
                      bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-gradient-to-r dark:from-[#22C55E] dark:to-[#16A34A] dark:shadow-lg dark:shadow-emerald-500/20
                      flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
