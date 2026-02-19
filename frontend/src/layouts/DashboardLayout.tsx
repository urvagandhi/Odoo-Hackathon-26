/**
 * DashboardLayout — generic dashboard page template.
 *
 * Slots:
 *   - stats: row of StatCards (metrics)
 *   - primaryPanel: main content area (charts, activity feed, etc.)
 *   - secondaryPanel: side panel (quick actions, recent items, etc.)
 *   - header props: icon, title, subtitle, actions
 *
 * Usage:
 *   <DashboardLayout
 *     icon={LayoutDashboard}
 *     title="Dashboard"
 *     subtitle="Overview of key metrics"
 *     stats={<>...</>}
 *     primaryPanel={<ActivityFeed />}
 *     secondaryPanel={<QuickActions />}
 *   />
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "../components/ui/PageHeader";

interface DashboardLayoutProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Row of StatCards */
  stats?: ReactNode;
  /** Left/main column (chart, feed, table) */
  primaryPanel?: ReactNode;
  /** Right/secondary column (quick actions, summary) */
  secondaryPanel?: ReactNode;
  /** Full-width bottom section (e.g. recent activity table) */
  bottomSection?: ReactNode;
}

export function DashboardLayout({
  icon,
  title,
  subtitle,
  actions,
  stats,
  primaryPanel,
  secondaryPanel,
  bottomSection,
}: DashboardLayoutProps) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />

      {/* Stats row */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.4, 0, 0.2, 1] as const }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats}
        </motion.div>
      )}

      {/* Two-column body */}
      {(primaryPanel || secondaryPanel) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
        >
          {/* Primary */}
          <div className="space-y-6 min-w-0">{primaryPanel}</div>

          {/* Secondary sidebar */}
          {secondaryPanel && (
            <div className="space-y-4">{secondaryPanel}</div>
          )}
        </motion.div>
      )}

      {/* Bottom full-width section */}
      {bottomSection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {bottomSection}
        </motion.div>
      )}
    </section>
  );
}
