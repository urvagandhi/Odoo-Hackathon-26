/**
 * Profile page — clean, professional layout matching Login & Dashboard.
 * Follows UI/UX agent spec: no emojis, semantic colors, rounded-2xl/3xl, framer-motion animations.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit3,
  Github,
  Linkedin,
  ExternalLink,
  Award,
  Zap,
  Activity,
  Code2,
  Share2,
  Building2,
} from "lucide-react";

/* ── Mock data ─────────────────────────────────────────── */

const MOCK_USER = {
  name: "Urva Gandhi",
  role: "Lead Full Stack Developer",
  email: "urva.gandhi@example.com",
  phone: "+91 98765 43210",
  location: "Ahmedabad, India",
  joinDate: "January 2025",
  bio: "Passionate full-stack developer specializing in scalable React and FastAPI applications. Dedicated to building clean interfaces and robust backend systems. Active community contributor and hackathon advocate.",
  department: "Engineering",
};

const STATS = [
  { label: "Projects", value: "12", icon: Code2, colorClass: "text-indigo-600", bgClass: "bg-indigo-50" },
  { label: "Contributions", value: "284", icon: Activity, colorClass: "text-emerald-600", bgClass: "bg-emerald-50" },
  { label: "Hackathons", value: "5", icon: Award, colorClass: "text-amber-600", bgClass: "bg-amber-50" },
];

const SKILLS = [
  { name: "React", level: 95 },
  { name: "TypeScript", level: 90 },
  { name: "Python", level: 85 },
  { name: "FastAPI", level: 80 },
  { name: "PostgreSQL", level: 75 },
  { name: "Tailwind CSS", level: 92 },
  { name: "Docker", level: 70 },
  { name: "Git", level: 88 },
];

const SOCIALS = [
  { icon: Github, label: "GitHub", value: "github.com/urva" },
  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/in/urva" },
];

const ACTIVITIES = [
  { action: "Pushed to main branch", time: "2 hours ago", dot: "bg-emerald-500", icon: Zap },
  { action: "Created issue #102", time: "5 hours ago", dot: "bg-indigo-500", icon: Code2 },
  { action: "Merged PR #42", time: "1 day ago", dot: "bg-violet-500", icon: Activity },
  { action: "Won HackStack 2025", time: "2 days ago", dot: "bg-amber-500", icon: Award },
];

const PERSONAL_DETAILS = [
  { icon: User, label: "Full Name", value: MOCK_USER.name },
  { icon: Mail, label: "Email Address", value: MOCK_USER.email },
  { icon: Phone, label: "Phone Number", value: MOCK_USER.phone },
  { icon: MapPin, label: "Location", value: MOCK_USER.location },
];

/* ── Animation variants ────────────────────────────────── */

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

/* ── Profile page ──────────────────────────────────────── */

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 lg:space-y-8"
      >
        {/* ── Hero Profile Card ────────────────────────── */}
        <motion.div variants={itemVariants} className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Top accent line (clean, subtle identity) */}
          <div className="h-2 w-full bg-indigo-600" />
          
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              
              {/* Left Identity Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                {/* Avatar */}
                <div className="relative shrink-0 group">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
                    <User className="w-10 h-10 sm:w-14 sm:h-14 text-slate-400" strokeWidth={1.5} />
                  </div>
                  {/* Status indicator */}
                  <span className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                </div>

                {/* Details */}
                <div className="text-center sm:text-left mt-2 sm:mt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 mb-3 sm:mb-4">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      {MOCK_USER.department}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {MOCK_USER.name}
                  </h1>
                  <p className="text-base sm:text-lg font-medium text-slate-600 mt-1">
                    {MOCK_USER.role}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {MOCK_USER.location}
                  </p>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                <button className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200 w-full sm:w-auto">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full sm:w-auto">
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

            </div>

            {/* Quick Stats Banner inside Hero */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bgClass}`}>
                    <stat.icon className={`w-6 h-6 ${stat.colorClass}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </motion.div>

        {/* ── Main Layout (Left: Content, Right: Sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            
            {/* Tab Navigation */}
            <motion.div variants={itemVariants} className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm inline-flex">
              {(["overview", "activity"] as const).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
                    ${activeTab === tab
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}
                  `}
                >
                  {tab === "overview" ? "Overview" : "Activity Log"}
                </button>
              ))}
            </motion.div>

            {/* Tab Views */}
            {activeTab === "overview" ? (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                
                {/* About Card */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-500" />
                      About Me
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {MOCK_USER.bio}
                    </p>
                  </div>
                </motion.div>

                {/* Info Card */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-emerald-500" />
                      Contact Information
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                     {PERSONAL_DETAILS.map((detail) => (
                      <div key={detail.label} className="min-w-0">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{detail.label}</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <detail.icon className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{detail.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Skills Card */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Technical Expertise
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                     {SKILLS.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">{skill.name}</span>
                          <span className="text-sm font-bold text-indigo-600">{skill.level}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.level}%` }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="h-full rounded-full bg-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </motion.div>
            ) : (
              /* Activity Tab View */
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                       <Activity className="w-5 h-5 text-indigo-500" />
                      Interaction Timeline
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {ACTIVITIES.map((act, i) => (
                        <div key={i} className="flex gap-4 group">
                          {/* Timeline node */}
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 group-hover:border-slate-300 transition-colors shrink-0">
                               <act.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            {i < ACTIVITIES.length - 1 && (
                              <div className="w-px h-full bg-slate-200 mt-2" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="pt-2 pb-6 min-w-0 w-full">
                            <p className="text-sm font-semibold text-slate-900">{act.action}</p>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">{act.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Social Connect */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-slate-500" />
                  Social Links
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {SOCIALS.map((social) => (
                  <div key={social.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                      <social.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{social.label}</p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{social.value}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Details Sidebar Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  Membership
                </h2>
              </div>
               <div className="p-6">
                <p className="text-sm font-medium text-slate-600">
                   Member of HackStack since <span className="font-bold text-slate-900">{MOCK_USER.joinDate}</span>.
                </p>
              </div>
            </motion.div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
