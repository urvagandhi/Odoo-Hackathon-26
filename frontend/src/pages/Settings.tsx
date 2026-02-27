/**
 * Settings page — multi-tab settings using SettingsLayout.
 * Account wired to updateProfile API. Security wired to change-password API.
 * Appearance persists compact mode + language to localStorage.
 */
import { useState, useEffect, useCallback } from "react";
import {
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { SettingsLayout, type SettingsTab } from "../layouts/SettingsLayout";
import { SectionCard } from "../components/ui/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../hooks/useToast";
import { authApi } from "../api/client";

/* ────────────────────────────────────────────────────────
   Toggle switch (dark-mode aware)
   ──────────────────────────────────────────────────────── */

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
        border-2 border-transparent transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        ${checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-neutral-600"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

/* ────────────────────────────────────────────────────────
   Common dark-mode-aware styling
   ──────────────────────────────────────────────────────── */

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-150 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-400";

const btnPrimaryCls =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

const labelCls = "block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5";

/* ────────────────────────────────────────────────────────
   Account Tab — wired to PATCH /api/v1/auth/me
   ──────────────────────────────────────────────────────── */

function AccountTab() {
  const { user } = useAuth();
  const toast = useToast();
  const nameParts = (user?.fullName ?? "").split(" ");
  const [form, setForm] = useState({
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    bio: "",
    phone: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!fullName || fullName.length < 2) {
      toast.error("Full name must be at least 2 characters.", { title: "Validation Error" });
      return;
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Please enter a valid email address.", { title: "Validation Error" });
      return;
    }
    setSaving(true);
    try {
      await authApi.updateProfile({ fullName, email: form.email.trim() });
      toast.success("Profile updated successfully.", { title: "Profile Saved" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update profile.";
      toast.error(msg, { title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Profile Information"
        description="Update your personal information"
        action={
          <button className={btnPrimaryCls} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className={labelCls}>First Name</label>
            <input id="firstName" className={inputCls} value={form.firstName} onChange={set("firstName")} />
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>Last Name</label>
            <input id="lastName" className={inputCls} value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelCls}>Email Address</label>
            <input id="email" type="email" className={inputCls} value={form.email} onChange={set("email")} />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>Phone</label>
            <input id="phone" className={inputCls} value={form.phone} onChange={set("phone")} />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>Location</label>
            <input id="location" className={inputCls} value={form.location} onChange={set("location")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className={labelCls}>Bio</label>
            <textarea id="bio" rows={3} className={`${inputCls} resize-none`} value={form.bio} onChange={set("bio")} />
          </div>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" description="Irreversible actions">
        <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-red-500 dark:text-red-500/80 mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            onClick={() => toast.warning("Account deletion is restricted. Contact your fleet manager.", { title: "Action Restricted" })}
            className="px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:bg-transparent dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Security Tab — password validation matches backend rules
   ──────────────────────────────────────────────────────── */

function SecurityTab() {
  const toast = useToast();
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(true);

  const toggle = (k: keyof typeof show) => () => setShow((p) => ({ ...p, [k]: !p[k] }));

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      toast.error("Please fill in both password fields.", { title: "Validation Error" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match.", { title: "Validation Error" });
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("New password must be at least 8 characters.", { title: "Validation Error" });
      return;
    }
    if (!/[A-Z]/.test(passwords.new)) {
      toast.error("Must contain at least one uppercase letter.", { title: "Validation Error" });
      return;
    }
    if (!/[0-9]/.test(passwords.new)) {
      toast.error("Must contain at least one number.", { title: "Validation Error" });
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      toast.success("Password changed successfully.", { title: "Password Updated" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to change password.";
      toast.error(msg, { title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Change Password"
        description="Update your password regularly for better security"
        action={
          <button className={btnPrimaryCls} onClick={handleChangePassword} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Updating..." : "Update"}
          </button>
        }
      >
        <div className="space-y-4 max-w-md">
          {(
            [
              ["current", "Current Password"],
              ["new", "New Password"],
              ["confirm", "Confirm New Password"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`pwd-${key}`} className={labelCls}>{label}</label>
              <div className="relative">
                <input
                  id={`pwd-${key}`}
                  type={show[key] ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                  onClick={toggle(key)}
                  aria-label={show[key] ? "Hide password" : "Show password"}
                >
                  {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {/* Password requirements hint */}
          {passwords.new.length > 0 && (
            <div className="text-xs space-y-1 text-slate-500 dark:text-neutral-400">
              <p className={passwords.new.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : ""}>
                {passwords.new.length >= 8 ? "\u2713" : "\u2022"} At least 8 characters
              </p>
              <p className={/[A-Z]/.test(passwords.new) ? "text-emerald-600 dark:text-emerald-400" : ""}>
                {/[A-Z]/.test(passwords.new) ? "\u2713" : "\u2022"} One uppercase letter
              </p>
              <p className={/[0-9]/.test(passwords.new) ? "text-emerald-600 dark:text-emerald-400" : ""}>
                {/[0-9]/.test(passwords.new) ? "\u2713" : "\u2022"} One number
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-neutral-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Authenticator App</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Use an authenticator app to generate codes</p>
              </div>
            </div>
            <Toggle id="toggle-2fa" checked={twoFA} onChange={setTwoFA} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-neutral-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Active Sessions</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Get alerts for new sign-ins</p>
              </div>
            </div>
            <Toggle id="toggle-sessions" checked={sessions} onChange={setSessions} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Notifications Tab — persisted to localStorage
   ──────────────────────────────────────────────────────── */

const NOTIF_STORAGE_KEY = "fleetflow_notification_prefs";

function NotificationsTab() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return {
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: false,
      marketingEmails: false,
      securityAlerts: true,
      teamUpdates: true,
    };
  });

  const toggle = (k: keyof typeof prefs) => () =>
    setPrefs((p: typeof prefs) => ({ ...p, [k]: !p[k] }));

  const handleSave = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Notification preferences saved.", { title: "Preferences Saved" });
  };

  const ITEMS: { key: keyof typeof prefs; title: string; desc: string }[] = [
    { key: "emailNotifications", title: "Email Notifications", desc: "Receive email updates about your activity" },
    { key: "pushNotifications", title: "Push Notifications", desc: "Get push notifications on your devices" },
    { key: "weeklyDigest", title: "Weekly Digest", desc: "Get a summary of activity every week" },
    { key: "marketingEmails", title: "Marketing Emails", desc: "Receive news, updates, and promotions" },
    { key: "securityAlerts", title: "Security Alerts", desc: "Important alerts about your account security" },
    { key: "teamUpdates", title: "Team Updates", desc: "Updates from your team members and projects" },
  ];

  return (
    <SectionCard
      title="Notification Preferences"
      description="Choose what notifications you want to receive"
      action={
        <button className={btnPrimaryCls} onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save
        </button>
      }
    >
      <div className="divide-y divide-slate-100 dark:divide-neutral-700">
        {ITEMS.map((item) => (
          <div key={String(item.key)} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{item.desc}</p>
            </div>
            <Toggle id={`toggle-${String(item.key)}`} checked={prefs[item.key]} onChange={toggle(item.key)} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────
   Appearance Tab — theme, compact mode, language (all persisted)
   ──────────────────────────────────────────────────────── */

function AppearanceTab() {
  const toast = useToast();
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();
  const [selection, setSelection] = useState<"light" | "dark" | "system">(() => {
    const stored = localStorage.getItem("fleetflow_theme_mode");
    if (stored === "system" || stored === "light" || stored === "dark") return stored;
    const osPref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return currentTheme === osPref ? "system" : currentTheme;
  });
  const [language, setLanguage] = useState(() => localStorage.getItem("fleetflow_language") ?? "en");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("fleetflow_compact") === "true");

  const handleThemeChange = (id: "light" | "dark" | "system") => {
    setSelection(id);
    localStorage.setItem("fleetflow_theme_mode", id);
    if (id === "system") {
      const osPref = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(osPref);
    } else {
      applyTheme(id);
    }
  };

  // Apply compact mode to document
  const applyCompact = useCallback((enabled: boolean) => {
    document.documentElement.classList.toggle("compact", enabled);
    localStorage.setItem("fleetflow_compact", String(enabled));
  }, []);

  useEffect(() => {
    applyCompact(compactMode);
  }, [compactMode, applyCompact]);

  const handleCompactChange = (v: boolean) => {
    setCompactMode(v);
    applyCompact(v);
  };

  const handleSave = () => {
    localStorage.setItem("fleetflow_language", language);
    localStorage.setItem("fleetflow_compact", String(compactMode));
    localStorage.setItem("fleetflow_theme_mode", selection);
    toast.success("Appearance preferences saved.", { title: "Preferences Saved" });
  };

  const themes: { id: "light" | "dark" | "system"; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    { id: "light", label: "Light", icon: Sun, desc: "Default light theme" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, desc: "Follow OS preference" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Select your preferred theme">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const active = selection === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                  ${active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                    : "border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 hover:border-slate-300 dark:hover:border-neutral-500 hover:bg-slate-50 dark:hover:bg-neutral-700"}
                `}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? "bg-indigo-100 dark:bg-indigo-900/50" : "bg-slate-100 dark:bg-neutral-600"}`}>
                  <t.icon className={`w-5 h-5 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-neutral-400"}`} />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-semibold ${active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-white"}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{t.desc}</p>
                </div>
                {active && <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Active</span>}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Language & Display"
        description="Locale and display preferences"
        action={
          <button className={btnPrimaryCls} onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save
          </button>
        }
      >
        <div className="space-y-5 max-w-md">
          <div>
            <label htmlFor="language" className={labelCls}>Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputCls}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="gu">Gujarati (ગુજરાતી)</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="ja">Japanese (日本語)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-neutral-700/50">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Compact Mode</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Reduce spacing and padding for denser layouts
              </p>
            </div>
            <Toggle id="toggle-compact" checked={compactMode} onChange={handleCompactChange} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Settings page (root)
   ──────────────────────────────────────────────────────── */

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");

  const tabs: SettingsTab[] = [
    { id: "account", label: "Account", icon: User, content: <AccountTab /> },
    { id: "security", label: "Security", icon: Shield, content: <SecurityTab /> },
    { id: "notifications", label: "Notifications", icon: Bell, content: <NotificationsTab /> },
    { id: "appearance", label: "Appearance", icon: Palette, content: <AppearanceTab /> },
  ];

  return (
    <SettingsLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
