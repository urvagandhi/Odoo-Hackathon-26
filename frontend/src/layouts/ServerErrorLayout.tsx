/**
 * ServerErrorLayout — generic 500 Internal Server Error page template.
 *
 * Features:
 * - Animated SVG illustration (server icon with spark/warning)
 * - Error code, title, message slots
 * - Retry button + Home button
 * - Optional technical detail disclosure (for dev environments)
 * - Framer Motion entrance animation
 *
 * Usage:
 *   <ServerErrorLayout
 *     onRetry={() => window.location.reload()}
 *     technicalDetail={error.message}
 *   />
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, RefreshCw, Home, ChevronDown, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

interface ServerErrorLayoutProps {
  /** Override default error title */
  title?: string;
  /** Override default message */
  message?: string;
  /** Retry/refresh callback — if omitted, retry button is hidden */
  onRetry?: () => void;
  /** Technical error string — shown in a collapsible details block */
  technicalDetail?: string;
  /** Override home link path */
  homePath?: string;
}

/**
 * Render a themed full-screen Server Error page with an animated illustration, actions, and optional technical details.
 *
 * Renders a centered error layout that adapts to dark/light theme, shows an error title and message, and provides a "Go Home" link. If `onRetry` is provided a "Try Again" button is shown; if `technicalDetail` is provided a collapsible technical details panel is available.
 *
 * @param title - Optional override for the displayed error title (defaults to "Internal Server Error")
 * @param message - Optional override for the user-facing error message shown beneath the title
 * @param onRetry - Optional callback invoked when the user clicks the "Try Again" button; when omitted the retry button is not rendered
 * @param technicalDetail - Optional technical error string shown in a collapsible, scrollable block when expanded
 * @param homePath - Optional path used by the "Go Home" link (defaults to "/")
 * @returns A React element containing the server error layout
 */
export function ServerErrorLayout({
  title = "Internal Server Error",
  message = "Something went wrong on our end. Our team has been notified and is working on a fix.",
  onRetry,
  technicalDetail,
  homePath = "/",
}: ServerErrorLayoutProps) {
  const { isDark } = useTheme();
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? "bg-neutral-900" : "bg-slate-50"}`}>
      <div className="max-w-lg w-full text-center">

        {/* Animated illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="mx-auto mb-8 w-32 h-32 relative"
        >
          {/* Outer ring pulse */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full ${isDark ? "bg-red-900/30" : "bg-red-100"}`}
          />

          {/* Icon container */}
          <div className={`absolute inset-3 rounded-full border-2 flex items-center justify-center ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
            <Server className="w-12 h-12 text-red-400" />
          </div>

          {/* Warning badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 14 }}
            className={`absolute -top-1 -right-1 w-9 h-9 bg-amber-400 rounded-full border-2 flex items-center justify-center shadow-md ${isDark ? "border-neutral-900" : "border-white"}`}
          >
            <AlertTriangle className="w-4 h-4 text-white" />
          </motion.div>

          {/* Spark dots */}
          {[
            { top: "8%", left: "-8%" },
            { top: "60%", right: "-10%" },
            { bottom: "0%", left: "15%" },
          ].map((pos, i) => (
            <motion.div
              key={i}
              style={pos}
              className="absolute w-2 h-2 rounded-full bg-red-300"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0.2, 0.6],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
          className="space-y-4"
        >
          {/* Error code */}
          <p className="text-sm font-semibold text-red-500 tracking-widest uppercase">
            Error 500
          </p>

          <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed max-w-sm mx-auto ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
            {message}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {onRetry && (
            <button
              onClick={onRetry}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-indigo-600 text-white text-sm font-semibold
                shadow-md shadow-indigo-500/25
                hover:bg-indigo-700 active:scale-[0.97]
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
              "
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <Link
            to={homePath}
            className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-semibold shadow-sm active:scale-[0.97]
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${isDark
                ? "bg-neutral-800 text-neutral-200 border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-500 focus-visible:ring-neutral-500 focus-visible:ring-offset-neutral-900"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400"}
            `}
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </motion.div>

        {/* Technical detail disclosure */}
        {technicalDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-left"
          >
            <button
              onClick={() => setDetailOpen((o) => !o)}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-150 mx-auto ${isDark ? "text-neutral-500 hover:text-neutral-300" : "text-slate-400 hover:text-slate-600"}`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${detailOpen ? "rotate-180" : ""}`}
              />
              {detailOpen ? "Hide" : "Show"} technical details
            </button>

            <AnimatePresence>
              {detailOpen && (
                <motion.pre
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 bg-slate-900 text-slate-300 rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed"
                >
                  {technicalDetail}
                </motion.pre>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </div>
  );
}
