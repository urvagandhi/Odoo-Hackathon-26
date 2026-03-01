import { motion } from "framer-motion";
import { ArrowLeft, Home, Search, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { NotFoundIllustration } from "../components/feedback/NotFoundIllustration";
import { useTheme } from "../context/ThemeContext";

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic or redirect to search page
      console.log("Searching for:", searchQuery);
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 lg:p-8 overflow-hidden relative ${isDark ? "bg-[#090D0B]" : "bg-slate-50"}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Column: Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-center lg:text-left order-2 lg:order-1"
        >
          {/* Brand/Logo (Optional context) */}
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-6 opacity-60">
             <span className={`text-sm font-semibold tracking-wider uppercase ${isDark ? "text-[#4A5C4A]" : "text-slate-500"}`}>{t("notFound.errorLabel")}</span>
          </div>

          <div className="space-y-4">
            <h1 className={`text-5xl lg:text-7xl font-bold tracking-tight leading-tight ${isDark ? "text-[#E4E6DE]" : "text-slate-900"}`}>
              {t("notFound.title")} <span className="text-indigo-600 inline-block transform hover:rotate-12 transition-transform duration-300 cursor-default">{t("notFound.titleHighlight")}</span> {t("notFound.titleEnd")}
            </h1>
            <p className={`text-lg max-w-md mx-auto lg:mx-0 leading-relaxed ${isDark ? "text-[#6B7C6B]" : "text-slate-600"}`}>
              {t("notFound.description")}
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto lg:mx-0 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("notFound.searchPlaceholder")}
              className={`block w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isDark ? "bg-[#111A15] border border-[#1E2B22] text-[#E4E6DE] placeholder-[#4A5C4A] shadow-none" : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm group-hover:shadow-md"}`}
            />
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link 
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-indigo-200 hover:shadow-indigo-300 shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Home className="w-4 h-4" />
              {t("notFound.goHome")}
            </Link>
            
            <button 
              onClick={() => navigate(-1)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium rounded-xl transition-all ${isDark ? "bg-[#111A15] hover:bg-[#182420] border border-[#1E2B22] text-[#B0B8A8] shadow-none" : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm hover:shadow-md active:bg-slate-100"}`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("notFound.goBack")}
            </button>
            
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); /* Support link logic */ }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium transition-colors ${isDark ? "text-[#6B7C6B] hover:text-indigo-400" : "text-slate-600 hover:text-indigo-600"}`}
            >
              <AlertCircle className="w-4 h-4" />
              {t("notFound.helpCenter")}
            </a>
          </div>
          
          {/* Footer / Copyright */}
          <div className={`pt-12 text-sm ${isDark ? "text-neutral-600" : "text-slate-400"}`}>
            {t("notFound.copyright")}
          </div>
        </motion.div>

        {/* Right Column: Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex items-center justify-center order-1 lg:order-2"
        >
          <NotFoundIllustration />
        </motion.div>

      </div>
    </div>
  );
}
