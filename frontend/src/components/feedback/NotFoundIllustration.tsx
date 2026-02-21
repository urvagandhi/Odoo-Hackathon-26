import { motion } from "framer-motion";
import { Wrench, Search, AlertTriangle, Settings, CloudOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function NotFoundIllustration() {
  const { isDark } = useTheme();

  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
      {/* Background blobs for depth */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute inset-0 rounded-full blur-3xl ${isDark ? 'bg-violet-950/30' : 'bg-indigo-50/50'}`}
      />
      
      {/* Main Laptop Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative z-10 w-64 h-48 border-4 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-200'}`}
      >
        {/* Screen Content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-neutral-900' : 'bg-slate-50'}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/40' : 'bg-red-100'}`}
          >
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </motion.div>
          <div className={`w-3/4 h-2 rounded animate-pulse ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`} />
          <div className={`w-1/2 h-2 rounded animate-pulse delay-75 ${isDark ? 'bg-neutral-700' : 'bg-slate-200'}`} />
        </div>
        
        {/* Laptop Base */}
        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-80 h-4 rounded-b-xl shadow-lg ${isDark ? 'bg-neutral-600' : 'bg-slate-300'}`} />
      </motion.div>

      {/* Floating Elements */}
      <FloatingIcon icon={Wrench} className="absolute top-1/4 left-0 text-indigo-400" delay={0.2} isDark={isDark} />
      <FloatingIcon icon={Search} className="absolute bottom-1/4 right-0 text-violet-400" delay={0.4} isDark={isDark} />
      <FloatingIcon icon={Settings} className={`absolute top-10 right-10 ${isDark ? 'text-neutral-600' : 'text-slate-300'}`} delay={0.6} size={24} isDark={isDark} />
      <FloatingIcon icon={CloudOff} className={`absolute bottom-10 left-10 ${isDark ? 'text-neutral-600' : 'text-slate-300'}`} delay={0.8} size={24} isDark={isDark} />

      {/* 404 Text Overlay Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className={`absolute -top-12 right-12 text-9xl font-black -z-10 select-none ${isDark ? 'text-neutral-800' : 'text-slate-100'}`}
      >
        404
      </motion.div>
    </div>
  );
}

function FloatingIcon({ 
  icon: Icon, 
  className = "", 
  delay = 0,
  size = 32,
  isDark = false,
}: { 
  icon: React.ElementType, 
  className?: string, 
  delay?: number,
  size?: number,
  isDark?: boolean,
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-3 rounded-xl shadow-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-slate-100'} ${className}`}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay * 2 }}
      >
        <Icon size={size} />
      </motion.div>
    </motion.div>
  );
}
