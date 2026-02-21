import { motion } from "framer-motion";
import { ArrowLeft, Home, Search, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotFoundIllustration } from "../components/feedback/NotFoundIllustration";
import { useTheme } from "../context/ThemeContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 lg:p-8 overflow-hidden relative ${isDark ? 'bg-neutral-900' : 'bg-slate-50'}`}>
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
             <span className={`text-sm font-semibold tracking-wider uppercase ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>404 Error</span>
          </div>

          <div className="space-y-4">
            <h1 className={`text-5xl lg:text-7xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Page <span className="text-indigo-600 inline-block transform hover:rotate-12 transition-transform duration-300 cursor-default">+</span> not found
            </h1>
            <p className={`text-lg max-w-md mx-auto lg:mx-0 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Oops! The page you're looking for seems to have wandered off. It might have been removed, renamed, or didn't exist in the first place.
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
              placeholder="Search for pages..."
              className={`block w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
          </form>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link 
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-indigo-200 hover:shadow-indigo-300 shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            
            <button 
              onClick={() => navigate(-1)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium rounded-xl transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300 hover:border-neutral-600' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 active:bg-slate-100'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); /* Support link logic */ }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <AlertCircle className="w-4 h-4" />
              Help Center
            </a>
          </div>
          
          {/* Footer / Copyright */}
          <div className={`pt-12 text-sm ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>
            © 2026 FleetFlow. All rights reserved.
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
