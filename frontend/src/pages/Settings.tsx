/**
 * Settings page — multi-tab settings with real API integration.
 * - Account: Pre-filled from auth context
 * - Security: Wired to authApi.changePassword()
 * - Appearance: Connected to ThemeContext
 * - Notifications: Decorative with dark mode
 */
import { useState } from "react";
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
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { SettingsLayout, type SettingsTab } from "../layouts/SettingsLayout";
import { SectionCard } from "../components/ui/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authApi } from "../api/client";

/* ────────────────────────────────────────────────────────
   Toggle switch (dark mode aware)
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
  const { isDark } = useTheme();
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
        ${checked ? "bg-indigo-600" : isDark ? "bg-neutral-600" : "bg-slate-200"}
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
   Common input styling (dark mode aware)
   ──────────────────────────────────────────────────────── */

function useInputStyles() {
  const { isDark } = useTheme();
  return {
    inputCls: `w-full px-3.5 py-2.5 rounded-lg border text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-150 ${
      isDark
        ? "border-neutral-600 bg-neutral-700 text-neutral-200 placeholder:text-neutral-500"
        : "border-slate-200 bg-white text-slate-800"
    }`,
    labelCls: `block text-sm font-medium mb-1.5 ${isDark ? "text-neutral-300" : "text-slate-700"}`,
    btnPrimaryCls:
      "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
  };
}

/* ────────────────────────────────────────────────────────
   Account Tab
   ──────────────────────────────────────────────────────── */

function AccountTab() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { inputCls, labelCls, btnPrimaryCls } = useInputStyles();

  const nameParts = (user?.fullName ?? "").split(" ");
  const [form, setForm] = useState({
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: user?.email ?? "",
    role: user?.role ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const roleLabel: Record<string, string> = {
    MANAGER: "Fleet Manager",
    DISPATCHER: "Dispatcher",
    SAFETY_OFFICER: "Safety Officer",
    FINANCE_ANALYST: "Finance Analyst",
    SUPER_ADMIN: "Super Administrator",
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Profile Information"
        description="Your account details"
        action={
          <button className={btnPrimaryCls} disabled>
            <Save className="w-4 h-4" />
            Save
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className={labelCls}>
              First Name
            </label>
            <input
              id="firstName"
              className={inputCls}
              value={form.firstName}
              onChange={set("firstName")}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>
              Last Name
            </label>
            <input
              id="lastName"
              className={inputCls}
              value={form.lastName}
              onChange={set("lastName")}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={inputCls}
              value={form.email}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="role" className={labelCls}>
              Role
            </label>
            <input
              id="role"
              className={inputCls}
              value={roleLabel[form.role] ?? form.role}
              readOnly
            />
          </div>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" description="Irreversible actions">
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            isDark
              ? "border-red-800 bg-red-900/20"
              : "border-red-200 bg-red-50/50"
          }`}
        >
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-700"}`}>
              Delete Account
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? "text-red-500" : "text-red-500"}`}>
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isDark
                ? "border-red-700 bg-neutral-800 text-red-400 hover:bg-red-900/30"
                : "border-red-300 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            Delete
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Security Tab — wired to authApi.changePassword()
   ──────────────────────────────────────────────────────── */

function SecurityTab() {
  const { isDark } = useTheme();
  const { inputCls, labelCls, btnPrimaryCls } = useInputStyles();
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(true);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleShow = (k: keyof typeof show) => () => setShow((p) => ({ ...p, [k]: !p[k] }));
  const setPwd = (k: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords((p) => ({ ...p, [k]: e.target.value }));

  const handleChangePassword = async () => {
    setStatus(null);

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setStatus({ type: "error", msg: "All password fields are required." });
      return;
    }
    if (passwords.new.length < 6) {
      setStatus({ type: "error", msg: "New password must be at least 6 characters." });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setStatus({ type: "success", msg: "Password changed successfully!" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to change password. Check your current password.";
      setStatus({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Change Password"
        description="Update your password regularly for better security"
        action={
          <button className={btnPrimaryCls} onClick={handleChangePassword} disabled={loading}>
            <Save className="w-4 h-4" />
            {loading ? "Updating..." : "Update"}
          </button>
        }
      >
        {status && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${
              status.type === "success"
                ? isDark
                  ? "bg-emerald-900/30 text-emerald-400"
                  : "bg-emerald-50 text-emerald-700"
                : isDark
                ? "bg-red-900/30 text-red-400"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {status.msg}
          </div>
        )}
        <div className="space-y-4 max-w-md">
          {(
            [
              ["current", "Current Password"],
              ["new", "New Password"],
              ["confirm", "Confirm New Password"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`pwd-${key}`} className={labelCls}>
                {label}
              </label>
              <div className="relative">
                <input
                  id={`pwd-${key}`}
                  type={show[key] ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                  value={passwords[key]}
                  onChange={setPwd(key)}
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? "text-neutral-400 hover:text-neutral-200" : "text-slate-400 hover:text-slate-600"
                  }`}
                  onClick={toggleShow(key)}
                  aria-label={show[key] ? "Hide password" : "Show password"}
                >
                  {show[key] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security"
      >
        <div className="space-y-4">
          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              isDark ? "bg-neutral-700/50" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDark ? "bg-indigo-900/40" : "bg-indigo-100"
                }`}
              >
                <Smartphone className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-neutral-200" : "text-slate-800"}`}>
                  Authenticator App
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  Use an authenticator app to generate codes
                </p>
              </div>
            </div>
            <Toggle id="toggle-2fa" checked={twoFA} onChange={setTwoFA} />
          </div>

          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              isDark ? "bg-neutral-700/50" : "bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDark ? "bg-emerald-900/40" : "bg-emerald-100"
                }`}
              >
                <Monitor className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-neutral-200" : "text-slate-800"}`}>
                  Active Sessions
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  Get alerts for new sign-ins
                </p>
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
   Notifications Tab (dark mode)
   ──────────────────────────────────────────────────────── */

function NotificationsTab() {
  const { isDark } = useTheme();
  const { btnPrimaryCls } = useInputStyles();
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
    securityAlerts: true,
    teamUpdates: true,
  });

  const toggle = (k: keyof typeof prefs) => () =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const ITEMS: { key: keyof typeof prefs; title: string; desc: string }[] = [
    {
      key: "emailNotifications",
      title: "Email Notifications",
      desc: "Receive email updates about fleet activity",
    },
    {
      key: "pushNotifications",
      title: "Push Notifications",
      desc: "Get push notifications on your devices",
    },
    {
      key: "weeklyDigest",
      title: "Weekly Digest",
      desc: "Get a summary of fleet activity every week",
    },
    {
      key: "marketingEmails",
      title: "Marketing Emails",
      desc: "Receive news, updates, and promotions",
    },
    {
      key: "securityAlerts",
      title: "Security Alerts",
      desc: "Important alerts about your account security",
    },
    {
      key: "teamUpdates",
      title: "Team Updates",
      desc: "Updates from your team members and operations",
    },
  ];

  return (
    <SectionCard
      title="Notification Preferences"
      description="Choose what notifications you want to receive"
      action={
        <button className={btnPrimaryCls}>
          <Save className="w-4 h-4" />
          Save
        </button>
      }
    >
      <div className={`divide-y ${isDark ? "divide-neutral-700" : "divide-slate-100"}`}>
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-neutral-200" : "text-slate-800"}`}>
                {item.title}
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                {item.desc}
              </p>
            </div>
            <Toggle
              id={`toggle-${item.key}`}
              checked={prefs[item.key]}
              onChange={toggle(item.key)}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ────────────────────────────────────────────────────────
   Appearance Tab — connected to ThemeContext
   ──────────────────────────────────────────────────────── */

function AppearanceTab() {
  const { theme, setTheme, isDark } = useTheme();
  const { inputCls, labelCls, btnPrimaryCls } = useInputStyles();
  const [language, setLanguage] = useState("en");
  const [compactMode, setCompactMode] = useState(false);

  // Map theme context's "light" | "dark" to our display
  const currentTheme = theme;

  const themes: {
    id: "light" | "dark";
    label: string;
    icon: React.FC<{ className?: string }>;
    desc: string;
  }[] = [
    { id: "light", label: "Light", icon: Sun, desc: "Default light theme" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Select your preferred theme">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map((t) => {
            const active = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                  ${
                    active
                      ? "border-indigo-500 shadow-sm " + (isDark ? "bg-indigo-900/20" : "bg-indigo-50")
                      : isDark
                      ? "border-neutral-600 bg-neutral-700 hover:border-neutral-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    active
                      ? isDark
                        ? "bg-indigo-800/50"
                        : "bg-indigo-100"
                      : isDark
                      ? "bg-neutral-600"
                      : "bg-slate-100"
                  }`}
                >
                  <t.icon
                    className={`w-5 h-5 ${
                      active
                        ? isDark
                          ? "text-indigo-400"
                          : "text-indigo-600"
                        : isDark
                        ? "text-neutral-400"
                        : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${
                      active
                        ? isDark
                          ? "text-indigo-300"
                          : "text-indigo-700"
                        : isDark
                        ? "text-neutral-200"
                        : "text-slate-800"
                    }`}
                  >
                    {t.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                    {t.desc}
                  </p>
                </div>
                {active && (
                  <span className={`text-xs font-medium ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Language & Display"
        description="Local and display preferences"
        action={
          <button className={btnPrimaryCls}>
            <Save className="w-4 h-4" />
            Save
          </button>
        }
      >
        <div className="space-y-5 max-w-md">
          <div>
            <label htmlFor="language" className={labelCls}>
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputCls}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="gu">Gujarati</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              isDark ? "bg-neutral-700/50" : "bg-slate-50"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-neutral-200" : "text-slate-800"}`}>
                Compact Mode
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                Reduce spacing and padding for denser layouts
              </p>
            </div>
            <Toggle
              id="toggle-compact"
              checked={compactMode}
              onChange={setCompactMode}
            />
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
    {
      id: "account",
      label: "Account",
      icon: User,
      content: <AccountTab />,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      content: <SecurityTab />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      content: <NotificationsTab />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      content: <AppearanceTab />,
    },
  ];

  return (
    <SettingsLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
