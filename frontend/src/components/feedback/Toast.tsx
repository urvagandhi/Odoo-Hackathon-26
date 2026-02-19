/**
 * Toast — individual notification card.
 *
 * Features:
 * - Slide in from right, fade out on dismiss (Framer Motion)
 * - Lucide icon per variant (no emojis)
 * - Animated countdown progress bar
 * - Manual close button
 * - Focus-visible ring on close button (accessibility)
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import type { ToastItem } from "../../context/toastTypes";

// ── Variant Config ─────────────────────────────────────────────

interface VariantStyle {
  icon: React.FC<{ className?: string }>;
  containerClass: string;
  iconClass: string;
  titleClass: string;
  messageClass: string;
  progressClass: string;
  closeClass: string;
}

const VARIANTS: Record<ToastItem["variant"], VariantStyle> = {
  success: {
    icon: CheckCircle,
    containerClass:
      "bg-white border border-emerald-200 shadow-lg shadow-emerald-500/10",
    iconClass: "text-emerald-500",
    titleClass: "text-slate-900",
    messageClass: "text-slate-600",
    progressClass: "bg-emerald-500",
    closeClass:
      "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
  },
  error: {
    icon: XCircle,
    containerClass:
      "bg-white border border-red-200 shadow-lg shadow-red-500/10",
    iconClass: "text-red-500",
    titleClass: "text-slate-900",
    messageClass: "text-slate-600",
    progressClass: "bg-red-500",
    closeClass:
      "text-slate-400 hover:text-red-600 hover:bg-red-50",
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      "bg-white border border-amber-200 shadow-lg shadow-amber-500/10",
    iconClass: "text-amber-500",
    titleClass: "text-slate-900",
    messageClass: "text-slate-600",
    progressClass: "bg-amber-500",
    closeClass:
      "text-slate-400 hover:text-amber-600 hover:bg-amber-50",
  },
  info: {
    icon: Info,
    containerClass:
      "bg-white border border-indigo-200 shadow-lg shadow-indigo-500/10",
    iconClass: "text-indigo-500",
    titleClass: "text-slate-900",
    messageClass: "text-slate-600",
    progressClass: "bg-indigo-500",
    closeClass:
      "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50",
  },
};

// ── Animation Variants ─────────────────────────────────────────

const toastVariants = {
  initial: { opacity: 0, x: 64, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    x: 64,
    scale: 0.96,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

// ── Component ──────────────────────────────────────────────────

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const style = VARIANTS[toast.variant];
  const Icon = style.icon;

  // Progress bar state
  const [progress, setProgress] = useState(100);
  const startTime = useRef(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    if (toast.duration === 0) return; // sticky toast — no progress bar

    startTime.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [toast.duration]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`relative w-full max-w-sm rounded-xl overflow-hidden ${style.containerClass}`}
    >
      {/* Main content */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          <Icon className={`w-5 h-5 ${style.iconClass}`} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`text-sm font-semibold leading-snug ${style.titleClass}`}>
              {toast.title}
            </p>
          )}
          <p
            className={`text-sm leading-snug ${
              toast.title ? "mt-0.5 text-slate-500" : style.messageClass
            }`}
          >
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className={`
            shrink-0 -mt-0.5 -mr-1 p-1.5 rounded-lg
            transition-colors duration-150
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-indigo-500 focus-visible:ring-offset-2
            ${style.closeClass}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="h-0.5 w-full bg-slate-100">
          <div
            className={`h-full transition-none ${style.progressClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
