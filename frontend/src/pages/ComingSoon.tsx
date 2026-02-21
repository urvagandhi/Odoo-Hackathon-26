/**
 * ComingSoon — placeholder page for routes not yet built.
 */
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ComingSoon() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive page name from path
  const pageName = location.pathname
    .replace(/^\//, "")
    .split("/")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page";

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
          isDark ? "bg-violet-900/30" : "bg-violet-100"
        }`}
      >
        <Construction className={`w-10 h-10 ${isDark ? "text-violet-400" : "text-violet-600"}`} />
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-center space-y-2"
      >
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          {pageName}
        </h2>
        <p className={`text-sm max-w-md ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
          This section is currently under construction. We're building something great — check back soon!
        </p>
      </motion.div>

      <motion.button
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        onClick={() => navigate("/dashboard")}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isDark
            ? "bg-violet-600 hover:bg-violet-500 text-white"
            : "bg-violet-600 hover:bg-violet-700 text-white"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </motion.button>
    </div>
  );
}
