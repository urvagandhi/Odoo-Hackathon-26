/**
 * PageHeader — shared header primitive.
 * Displays an icon badge, title, subtitle, and optional action slot.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  /** Lucide icon component */
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Right-side slot: CTA buttons, badges, etc. */
  actions?: ReactNode;
  /** Optional gradient accent on the icon badge */
  iconColor?: string; // Tailwind bg class e.g. "bg-indigo-600"
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  iconColor = "bg-indigo-600",
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
