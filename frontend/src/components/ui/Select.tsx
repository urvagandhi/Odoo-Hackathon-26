/**
 * Select — consistent cross-browser dropdown.
 * Replaces native <select> with appearance-none + custom chevron so it
 * looks identical on every OS / browser (including older laptops).
 */
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Highlight border red */
  error?: boolean;
  /** Leading icon (renders absolute-left inside the wrapper) */
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, icon, children, ...props }, ref) => {
    const { isDark } = useTheme();
    const muted = isDark ? "text-neutral-500" : "text-slate-400";

    return (
      <div className="relative">
        {icon && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`}>
            {icon}
          </span>
        )}
        <select
          ref={ref}
          className={`appearance-none cursor-pointer pr-9 ${icon ? "pl-9 " : ""}${error ? "!border-red-400 " : ""}${className ?? ""}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${muted}`}
        />
      </div>
    );
  }
);

Select.displayName = "Select";
