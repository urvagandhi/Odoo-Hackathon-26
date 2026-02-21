import { motion } from "framer-motion";
import { Wrench, Search, AlertTriangle, Settings, CloudOff } from "lucide-react";

export function NotFoundIllustration() {
  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
      {/* Background blobs for depth */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-indigo-50/50 rounded-full blur-3xl"
      />
      
      {/* Main Laptop Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-64 h-48 bg-white border-4 border-slate-200 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden"
      >
        {/* Screen Content */}
        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
          >
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </motion.div>
          <div className="w-3/4 h-2 bg-slate-200 rounded animate-pulse" />
          <div className="w-1/2 h-2 bg-slate-200 rounded animate-pulse delay-75" />
        </div>
        
        {/* Laptop Base */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-80 h-4 bg-slate-300 rounded-b-xl shadow-lg" />
      </motion.div>

      {/* Floating Elements */}
      <FloatingIcon icon={Wrench} className="absolute top-1/4 left-0 text-indigo-400" delay={0.2} />
      <FloatingIcon icon={Search} className="absolute bottom-1/4 right-0 text-violet-400" delay={0.4} />
      <FloatingIcon icon={Settings} className="absolute top-10 right-10 text-slate-300" delay={0.6} size={24} />
      <FloatingIcon icon={CloudOff} className="absolute bottom-10 left-10 text-slate-300" delay={0.8} size={24} />

      {/* 404 Text Overlay Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -top-12 right-12 text-9xl font-black text-slate-100 -z-10 select-none"
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
  size = 32 
}: { 
  icon: React.ElementType, 
  className?: string, 
  delay?: number,
  size?: number 
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-3 bg-white rounded-xl shadow-lg border border-slate-100 ${className}`}
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
