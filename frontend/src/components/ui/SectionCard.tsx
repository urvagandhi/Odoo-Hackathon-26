/**
 * SectionCard — a framed card block used by Settings / Profile sections.
 * Accepts a title, optional description, and children content.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Right-side slot for a save button at the top level */
  action?: ReactNode;
  className?: string;
}

export function SectionCard({ title, description, children, action, className = "" }: SectionCardProps) {
  const { isDark } = useTheme();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className={`rounded-[14px] border overflow-hidden ${isDark ? 'bg-[#111A15] border-[#1E2B22] shadow-[0_6px_20px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-sm'} ${className}`}
    >
      {/* Card header */}
      <div className={`px-6 py-4 border-b flex items-start justify-between gap-4 ${isDark ? 'border-[#1E2B22]' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-base font-semibold ${isDark ? 'text-[#E4E6DE]' : 'text-slate-900'}`}>{title}</h2>
          {description && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-[#6B7C6B]' : 'text-slate-500'}`}>{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Card body */}
      <div className="px-6 py-5">{children}</div>
    </motion.section>
  );
}
