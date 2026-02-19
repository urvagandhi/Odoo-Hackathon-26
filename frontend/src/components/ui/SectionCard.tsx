/**
 * SectionCard — a framed card block used by Settings / Profile sections.
 * Accepts a title, optional description, and children content.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Right-side slot for a save button at the top level */
  action?: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, action, className = "" }: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Card header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Card body */}
      <div className="px-6 py-5">{children}</div>
    </motion.section>
  );
}
