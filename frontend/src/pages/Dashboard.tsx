/**
 * Dashboard page — clean, professional landing overview.
 * Follows UI/UX agent spec: no emojis, semantic colors, rounded-2xl, and framer-motion animations.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Zap,
  Database,
  ArrowRight,
  ExternalLink,
  Activity,
  Code2,
  Boxes,
} from "lucide-react";
import { useItems } from "../hooks/useItems";

/* ── Animation Variants ────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } 
  },
};

export default function Dashboard() {
  const { items, loading } = useItems();

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* ── Hero Section ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Zap className="w-64 h-64 text-indigo-600 transform rotate-12" />
          </div>
          
          <div className="relative p-8 sm:p-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-semibold text-indigo-700 tracking-wide uppercase">
                System Online
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Welcome back to <span className="text-indigo-600">HackStack</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed mb-8">
              Your production-grade full-stack environment is running smoothly. 
              Start building features, monitoring activity, and shipping faster.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/items/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create New Item
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/items"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
              >
                View Inventory
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Overview ────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Items"
            value={loading ? "..." : items.length.toString()}
            icon={Package}
            trend="+12% this week"
            trendUp={true}
            colorClass="text-indigo-600"
            bgClass="bg-indigo-50"
          />
          <StatCard
            title="Active Sessions"
            value="1,284"
            icon={Activity}
            trend="+5.4% today"
            trendUp={true}
            colorClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />
          <StatCard
            title="API Requests"
            value="45.2k"
            icon={Code2}
            trend="-2.1% this hour"
            trendUp={false}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
          />
          <StatCard
            title="Database Size"
            value="1.2 GB"
            icon={Database}
            trend="Stable"
            trendUp={true}
            colorClass="text-violet-600"
            bgClass="bg-violet-50"
          />
        </motion.div>

        {/* ── Quick Links & Recent Activity ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-500" />
                Quick Links & Resources
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickLink 
                title="Swagger UI" 
                desc="Interactive API documentation"
                href="http://localhost:8000/docs" 
                external 
              />
              <QuickLink 
                title="ReDoc" 
                desc="Alternative API reference"
                href="http://localhost:8000/redoc" 
                external 
              />
              <QuickLink 
                title="Inventory System" 
                desc="Manage your items database"
                to="/items" 
              />
              <QuickLink 
                title="User Settings" 
                desc="Configure your account preferences"
                to="/settings" 
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                System Status
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <StatusItem label="API Gateway" status="Operational" dot="bg-emerald-500" />
                <StatusItem label="PostgreSQL DB" status="Operational" dot="bg-emerald-500" />
                <StatusItem label="Auth Service" status="Operational" dot="bg-emerald-500" />
                <StatusItem label="Background Workers" status="Idle" dot="bg-amber-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Components ────────────────────────────────────────── */

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  colorClass,
  bgClass,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={1.5} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trendUp ? '↑' : '↓'}
        </span>
        <span className="text-xs font-medium text-slate-500">{trend}</span>
      </div>
    </div>
  );
}

function QuickLink({
  title,
  desc,
  to,
  href,
  external,
}: {
  title: string;
  desc: string;
  to?: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group cursor-pointer h-full">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1 group-hover:text-indigo-600 transition-colors">
          {title}
          {external && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-colors">
         <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
      </div>
    </div>
  );

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl">
        {content}
      </a>
    );
  }

  return (
    <Link to={to || '/'} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-xl">
      {content}
    </Link>
  );
}

function StatusItem({ label, status, dot }: { label: string; status: string; dot: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {status}
        <span className={`w-2 h-2 rounded-full ${dot} shadow-sm border border-white`} />
      </div>
    </div>
  );
}
