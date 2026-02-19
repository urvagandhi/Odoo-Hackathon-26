/**
 * DropdownMenu — lightweight shadcn/ui-compatible dropdown component.
 *
 * No Radix, no external UI library. Portal-rendered.
 *
 * Sub-components:
 *   <DropdownMenu>            — context + state provider
 *   <DropdownMenuTrigger asChild> — wraps any element to toggle menu
 *   <DropdownMenuContent align="start|end|center"> — floating panel
 *   <DropdownMenuGroup>       — semantic grouping (optional)
 *   <DropdownMenuItem>        — clickable row, auto-closes menu
 *   <DropdownMenuSeparator>   — horizontal divider
 *   <DropdownMenuLabel>       — non-interactive section heading
 *
 * Usage:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild>
 *       <button>Options</button>
 *     </DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuGroup>
 *         <DropdownMenuItem onSelect={() => navigate("/profile")}>Profile</DropdownMenuItem>
 *         <DropdownMenuItem onSelect={() => navigate("/settings")}>Settings</DropdownMenuItem>
 *       </DropdownMenuGroup>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// ── Context ────────────────────────────────────────────────────

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenu sub-components must be inside <DropdownMenu>");
  return ctx;
}

// ── Root ───────────────────────────────────────────────────────

interface DropdownMenuProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlled, onOpenChange }: DropdownMenuProps) {
  const [internal, setInternal] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = controlled !== undefined ? controlled : internal;
  const setOpen = (v: boolean) => {
    setInternal(v);
    onOpenChange?.(v);
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// ── Trigger ────────────────────────────────────────────────────

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild = false }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{
      onClick?: (e: React.MouseEvent) => void;
      ref?: React.Ref<HTMLElement>;
      "aria-expanded"?: boolean;
      "aria-haspopup"?: boolean;
    }>, {
      ref: (el: HTMLElement | null) => { (triggerRef as React.MutableRefObject<HTMLElement | null>).current = el; },
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": true,
    });
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup
      ref={(el) => { (triggerRef as React.MutableRefObject<HTMLElement | null>).current = el; }}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

// ── Content ────────────────────────────────────────────────────

type Align = "start" | "center" | "end";

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: Align;
  sideOffset?: number;
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = "end",
  sideOffset = 6,
  className = "",
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu();
  const contentRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onMousedown = (e: MouseEvent) => {
      if (
        contentRef.current && !contentRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMousedown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMousedown);
    };
  }, [open, setOpen, triggerRef]);

  // Position relative to trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const top = rect.bottom + sideOffset + window.scrollY;
    let left: number;
    if (align === "start") left = rect.left + window.scrollX;
    else if (align === "center") left = rect.left + rect.width / 2 + window.scrollX;
    else left = rect.right + window.scrollX; // end — adjusted in CSS with translateX
    setPos({ top, left });
  }, [open, align, sideOffset, triggerRef]);

  const transformOrigin = align === "start" ? "top left" : align === "end" ? "top right" : "top center";
  const translateX = align === "end" ? "-100%" : align === "center" ? "-50%" : "0%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          key="dm-content"
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: `translateX(${translateX})`,
            transformOrigin,
            zIndex: 9950,
          }}
          className={`
            min-w-36 bg-white rounded-lg border border-slate-200
            shadow-lg shadow-black/10 p-1
            ${className}
          `}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Group ──────────────────────────────────────────────────────

export function DropdownMenuGroup({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={`${className}`} {...props}>{children}</div>;
}

// ── Item ───────────────────────────────────────────────────────

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void;
  inset?: boolean;
  /** Red destructive variant */
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  className = "",
  onSelect,
  onClick,
  inset = false,
  destructive = false,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
        setOpen(false);
      }}
      className={`
        w-full flex items-center gap-2
        px-2 py-1.5 rounded-md text-sm
        cursor-pointer select-none outline-none
        transition-colors duration-100
        focus-visible:bg-slate-100
        ${destructive
          ? "text-red-600 hover:bg-red-50 focus-visible:bg-red-50"
          : "text-slate-700 hover:bg-slate-100"
        }
        ${inset ? "pl-8" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Separator ─────────────────────────────────────────────────

export function DropdownMenuSeparator({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={`my-1 h-px bg-slate-100 ${className}`}
      {...props}
    />
  );
}

// ── Label ─────────────────────────────────────────────────────

export function DropdownMenuLabel({
  children,
  className = "",
  inset = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={`
        px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide select-none
        ${inset ? "pl-8" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
