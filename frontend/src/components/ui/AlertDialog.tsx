/**
 * AlertDialog — custom confirmation dialog component.
 *
 * Matches shadcn/ui AlertDialog API and visual style exactly:
 * - No X close button
 * - Ghost "Cancel" button (plain text, no background)
 * - Dark/pill "Action" button (near-black, rounded-md)
 * - No footer divider
 * - Compact, minimal layout
 * - Blurred/darkened backdrop
 * - Framer Motion scale + fade entrance animation
 *
 * Sub-components (drop-in shadcn/ui equivalents):
 *   <AlertDialog>
 *   <AlertDialogTrigger asChild>
 *   <AlertDialogContent>
 *   <AlertDialogHeader>
 *   <AlertDialogTitle>
 *   <AlertDialogDescription>
 *   <AlertDialogFooter>
 *   <AlertDialogCancel>
 *   <AlertDialogAction variant="default | destructive">
 *
 * Usage:
 *   <AlertDialog>
 *     <AlertDialogTrigger asChild>
 *       <button>Show Dialog</button>
 *     </AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
 *         <AlertDialogDescription>
 *           This action cannot be undone.
 *         </AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Cancel</AlertDialogCancel>
 *         <AlertDialogAction>Continue</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Context ────────────────────────────────────────────────────

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog sub-components must be used inside <AlertDialog>");
  return ctx;
}

// ── Root ───────────────────────────────────────────────────────

interface AlertDialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AlertDialog({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// ── Trigger ────────────────────────────────────────────────────

interface AlertDialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function AlertDialogTrigger({ children, asChild = false }: AlertDialogTriggerProps) {
  const { setOpen } = useAlertDialog();

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

// ── Content ────────────────────────────────────────────────────

interface AlertDialogContentProps {
  children: ReactNode;
  className?: string;
}

export function AlertDialogContent({ children, className = "" }: AlertDialogContentProps) {
  const { open, setOpen } = useAlertDialog();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Auto-focus panel
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ad-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9990] bg-black/50"
            aria-hidden="true"
          />

          {/* Panel — matches shadcn sizing & rounding */}
          <motion.div
            key="ad-panel"
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`
              fixed z-[9991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-md
              bg-white rounded-lg shadow-xl
              outline-none p-6
              ${className}
            `}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Header ─────────────────────────────────────────────────────

export function AlertDialogHeader({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col gap-2 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── Title ──────────────────────────────────────────────────────

export function AlertDialogTitle({ children, className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-lg font-semibold text-slate-900 leading-tight ${className}`} {...props}>
      {children}
    </h2>
  );
}

// ── Description — blue/muted, matching shadcn ─────────────────

export function AlertDialogDescription({ children, className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-slate-500 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

// ── Footer — right-aligned, no border ─────────────────────────

export function AlertDialogFooter({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Cancel — ghost button (plain text) ────────────────────────

export function AlertDialogCancel({
  children,
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useAlertDialog();
  return (
    <button
      type="button"
      onClick={(e) => { setOpen(false); onClick?.(e); }}
      className={`
        inline-flex items-center justify-center
        px-4 py-2 rounded-md
        text-sm font-medium text-slate-700
        hover:bg-slate-100
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children ?? "Cancel"}
    </button>
  );
}

// ── Action — dark pill (default) or red pill (destructive) ────

export function AlertDialogAction({
  children,
  className = "",
  variant = "default",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "destructive" }) {
  const { setOpen } = useAlertDialog();

  const colourClass =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
      : "bg-slate-900 hover:bg-slate-700 focus-visible:ring-slate-700";

  return (
    <button
      type="button"
      onClick={(e) => { setOpen(false); onClick?.(e); }}
      className={`
        inline-flex items-center justify-center
        px-4 py-2 rounded-md
        text-sm font-medium text-white
        ${colourClass}
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${className}
      `}
      {...props}
    >
      {children ?? "Continue"}
    </button>
  );
}
