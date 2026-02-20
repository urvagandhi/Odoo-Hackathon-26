/**
 * Settings page — multi-tab settings using SettingsLayout.
 * UI-only with local state, no API calls.
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
} from "lucide-react";
import { SettingsLayout, type SettingsTab } from "../layouts/SettingsLayout";
import { SectionCard } from "../components/ui/SectionCard";

/* ────────────────────────────────────────────────────────
   Toggle switch
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
        ${checked ? "bg-indigo-600" : "bg-slate-200"}
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
   Common input styling
   ──────────────────────────────────────────────────────── */

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-150";

const btnPrimaryCls =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

const labelCls = "block text-sm font-medium text-slate-700 mb-1.5";

/* ────────────────────────────────────────────────────────
   Account Tab
   ──────────────────────────────────────────────────────── */

function AccountTab() {
  const [form, setForm] = useState({
    firstName: "Urva",
    lastName: "Gandhi",
    email: "urva.gandhi@example.com",
    bio: "Full-stack developer who loves building beautiful UIs and scalable backends.",
    phone: "+91 98765 43210",
    location: "Ahmedabad, India",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionCard
        title="Profile Information"
        description="Update your personal information"
        action={
          <button className={btnPrimaryCls}>
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
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className={labelCls}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={inputCls}
              value={form.email}
              onChange={set("email")}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelCls}>
              Phone
            </label>
            <input
              id="phone"
              className={inputCls}
              value={form.phone}
              onChange={set("phone")}
            />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>
              Location
            </label>
            <input
              id="location"
              className={inputCls}
              value={form.location}
              onChange={set("location")}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className={labelCls}>
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.bio}
              onChange={set("bio")}
            />
          </div>
        </div>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" description="Irreversible actions">
        <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50/50">
          <div>
            <p className="text-sm font-medium text-red-700">Delete Account</p>
            <p className="text-xs text-red-500 mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button className="px-4 py-2 rounded-lg border border-red-300 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Security Tab
   ──────────────────────────────────────────────────────── */

function SecurityTab() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(true);

  const toggle = (k: keyof typeof show) => () => setShow((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <SectionCard
        title="Change Password"
        description="Update your password regularly for better security"
        action={
          <button className={btnPrimaryCls}>
            <Save className="w-4 h-4" />
            Update
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
              <label htmlFor={`pwd-${key}`} className={labelCls}>
                {label}
              </label>
              <div className="relative">
                <input
                  id={`pwd-${key}`}
                  type={show[key] ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={toggle(key)}
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
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Authenticator App
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use an authenticator app to generate codes
                </p>
              </div>
            </div>
            <Toggle id="toggle-2fa" checked={twoFA} onChange={setTwoFA} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Active Sessions
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
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
   Notifications Tab
   ──────────────────────────────────────────────────────── */

function NotificationsTab() {
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
      desc: "Receive email updates about your activity",
    },
    {
      key: "pushNotifications",
      title: "Push Notifications",
      desc: "Get push notifications on your devices",
    },
    {
      key: "weeklyDigest",
      title: "Weekly Digest",
      desc: "Get a summary of activity every week",
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
      desc: "Updates from your team members and projects",
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
      <div className="divide-y divide-slate-100">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
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
   Appearance Tab
   ──────────────────────────────────────────────────────── */

function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("en");
  const [compactMode, setCompactMode] = useState(false);

  const themes: {
    id: "light" | "dark" | "system";
    label: string;
    icon: React.FC<{ className?: string }>;
    desc: string;
  }[] = [
    { id: "light", label: "Light", icon: Sun, desc: "Default light theme" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, desc: "Follow OS preference" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Theme" description="Select your preferred theme">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                  ${
                    active
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    active ? "bg-indigo-100" : "bg-slate-100"
                  }`}
                >
                  <t.icon
                    className={`w-5 h-5 ${
                      active ? "text-indigo-600" : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-indigo-700" : "text-slate-800"
                    }`}
                  >
                    {t.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
                {active && (
                  <span className="text-xs font-medium text-indigo-600">
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

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">Compact Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">
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
      badge: "3",
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
