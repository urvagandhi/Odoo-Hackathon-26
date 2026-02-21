/**
 * Breadcrumb — shadcn/ui-compatible breadcrumb component.
 *
 * Drop-in equivalent for React Router (uses react-router-dom Link, not next/link).
 *
 * Sub-components:
 *   <Breadcrumb>          — <nav> wrapper with aria-label
 *   <BreadcrumbList>      — <ol> ordered list
 *   <BreadcrumbItem>      — <li> item  
 *   <BreadcrumbLink>      — clickable breadcrumb link (asChild supported)
 *   <BreadcrumbPage>      — current page (non-link, aria-current="page")
 *   <BreadcrumbSeparator> — › chevron separator
 *   <BreadcrumbEllipsis>  — … icon for collapsed middle crumbs
 *
 * Usage:
 *   import { Link } from "react-router-dom"; // instead of next/link
 *
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem>
 *         <BreadcrumbLink asChild>
 *           <Link to="/">Home</Link>
 *         </BreadcrumbLink>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem>
 *         <DropdownMenu>
 *           <DropdownMenuTrigger asChild>
 *             <button><BreadcrumbEllipsis /></button>
 *           </DropdownMenuTrigger>
 *           <DropdownMenuContent>
 *             <DropdownMenuItem>Docs</DropdownMenuItem>
 *           </DropdownMenuContent>
 *         </DropdownMenu>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem>
 *         <BreadcrumbPage>Current</BreadcrumbPage>
 *       </BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 */

import {
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type HTMLAttributes,
  type AnchorHTMLAttributes,
  type ComponentProps,
} from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ── Breadcrumb (nav wrapper) ───────────────────────────────────

export function Breadcrumb({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <nav aria-label="breadcrumb" className={className} {...props}>
      {children}
    </nav>
  );
}

// ── BreadcrumbList ────────────────────────────────────────────

export function BreadcrumbList({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLOListElement>) {
  const { isDark } = useTheme();
  return (
    <ol
      className={`flex flex-wrap items-center gap-1.5 text-sm sm:gap-2.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'} ${className}`}
      {...props}
    >
      {children}
    </ol>
  );
}

// ── BreadcrumbItem ────────────────────────────────────────────

export function BreadcrumbItem({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={`inline-flex items-center gap-1.5 ${className}`} {...props}>
      {children}
    </li>
  );
}

// ── BreadcrumbLink ────────────────────────────────────────────

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  children: ReactNode;
}

export function BreadcrumbLink({
  asChild = false,
  children,
  className = "",
  ...props
}: BreadcrumbLinkProps) {
  const { isDark: isDarkLink } = useTheme();
  const cls = `
    transition-colors duration-150 ${isDarkLink ? 'hover:text-white' : 'hover:text-slate-900'}
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded
    ${className}
  `;

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: `${(children.props as { className?: string }).className ?? ""} ${cls}`.trim(),
    });
  }

  return (
    <a className={cls} {...props}>
      {children}
    </a>
  );
}

// ── BreadcrumbPage (current, non-link) ────────────────────────

export function BreadcrumbPage({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const { isDark: isDarkPage } = useTheme();
  return (
    <span
      role="link"
      aria-current="page"
      aria-disabled="true"
      className={`font-semibold ${isDarkPage ? 'text-white' : 'text-slate-900'} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// ── BreadcrumbSeparator ───────────────────────────────────────

export function BreadcrumbSeparator({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  const { isDark: isDarkSepBc } = useTheme();
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={`flex items-center ${isDarkSepBc ? 'text-neutral-600' : 'text-slate-400'} ${className}`}
      {...props}
    >
      {children ?? <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />}
    </li>
  );
}

// ── BreadcrumbEllipsis ────────────────────────────────────────

export function BreadcrumbEllipsis({ className = "", ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 items-center justify-center ${className}`}
      {...props}
    >
      <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
      <span className="sr-only">More pages</span>
    </span>
  );
}
