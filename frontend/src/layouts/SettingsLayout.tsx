/**
 * SettingsLayout — generic settings page template.
 *
 * Structure:
 *   ┌────────────────────────────────┐
 *   │ Header                         │
 *   ├──────────────┬─────────────────┤
 *   │ Tab sidebar  │  Tab content    │
 *   └──────────────┴─────────────────┘
 *
 * On mobile, the sidebar collapses into a horizontal scrollable tab bar.
 *
 * Slots:
 *   - tabs[]: { id, label, icon, content }
 *   - activeTab / onTabChange: controlled externally
 *
 * Usage:
 *   const [tab, setTab] = useState("account");
 *   <SettingsLayout
 *     tabs={[
 *       { id: "account", label: "Account", icon: User, content: <AccountSection /> },
 *       { id: "security", label: "Security", icon: Shield, content: <SecuritySection /> },
 *     ]}
 *     activeTab={tab}
 *     onTabChange={setTab}
 *   />
 */
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { useTheme } from "../context/ThemeContext";

export interface SettingsTab {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  content: ReactNode;
  /** Optional badge (e.g. "New", "2") */
  badge?: string;
}

interface SettingsLayoutProps {
  title?: string;
  subtitle?: string;
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Header right-side actions */
  actions?: ReactNode;
}

export function SettingsLayout({
  title = "Settings",
  subtitle = "Manage your preferences and account",
  tabs,
  activeTab,
  onTabChange,
  actions,
}: SettingsLayoutProps) {
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;
  const { isDark } = useTheme();

  return (
    <section className="space-y-6">
      <PageHeader icon={Settings} title={title} subtitle={subtitle} actions={actions} />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* ── Sidebar tabs ──────────────────────────────── */}
        <nav
          aria-label="Settings navigation"
          className={`
            flex lg:flex-col gap-1
            overflow-x-auto lg:overflow-visible
            rounded-xl border shadow-sm
            p-2 lg:p-3
            shrink-0
            ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-200'}
          `}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium
                  whitespace-nowrap transition-all duration-150 w-full text-left
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
                  ${isActive
                    ? isDark ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                    : isDark ? "text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isDark ? "text-indigo-400" : "text-indigo-600") : (isDark ? "text-neutral-500" : "text-slate-400")}`} />
                <span className="flex-1">{tab.label}</span>
                {tab.badge && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full font-medium
                    ${isActive ? (isDark ? "bg-indigo-800/50 text-indigo-300" : "bg-indigo-100 text-indigo-700") : (isDark ? "bg-neutral-700 text-neutral-400" : "bg-slate-100 text-slate-500")}
                  `}>
                    {tab.badge}
                  </span>
                )}
                {/* Active indicator bar (desktop only) */}
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className={`absolute inset-0 rounded-lg -z-10 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Tab content ───────────────────────────────── */}
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
            >
              {activeContent}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
