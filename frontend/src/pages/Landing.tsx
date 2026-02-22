
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  ShieldAlert,
  Wrench,
  BarChart3,
  Map,
  Users,
  ArrowRight,
  Zap,
  CheckCircle2,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: <Map className="w-8 h-8 text-blue-500" />,
      title: "Real-time Dispatch",
      description:
        "AI-powered routing and live tracking for optimal fleet efficiency.",
    },
    {
      icon: <Wrench className="w-8 h-8 text-orange-500" />,
      title: "Predictive Maintenance",
      description:
        "Reduce downtime with intelligent maintenance scheduling and alerts.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-green-500" />,
      title: "Advanced Analytics",
      description:
        "Comprehensive insights into fuel consumption, driver performance, and costs.",
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
      title: "Safety & Compliance",
      description:
        "Monitor driver behavior and ensure continuous regulatory compliance.",
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Driver Management",
      description:
        "Complete driver profiles, shift tracking, and performance scoring.",
    },
    {
      icon: <Globe className="w-8 h-8 text-teal-500" />,
      title: "Odoo Integration",
      description:
        "Seamless synchronization with Odoo ERP for unified logistics operations.",
    },
  ];

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300 ${isDark ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"}`}>
      {/* Navbar */}
      <nav className={`fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-md border-b ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 sm:block hidden">
                FleetFlow
              </span>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="hidden md:flex space-x-8 mr-4">
                <a
                  href="#features"
                  className={`font-medium transition-colors ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className={`font-medium transition-colors ${isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                >
                  How it Works
                </a>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-full transition-colors ${
                  isDark
                    ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                }`}
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className={`absolute top-1/4 -left-64 w-96 h-96 rounded-full blur-[100px] pointer-events-none ${isDark ? "bg-blue-600/20" : "bg-blue-400/20"}`} />
        <div className={`absolute top-1/3 -right-64 w-[30rem] h-[30rem] rounded-full blur-[100px] pointer-events-none ${isDark ? "bg-teal-500/10" : "bg-teal-400/20"}`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeIn}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border mb-8 backdrop-blur-sm shadow-sm ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-white/80 border-slate-200"
              }`}
            >
              <Zap className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Next-Gen Logistics Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8"
            >
              Smarter Fleet Management. <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-500 to-blue-600 dark:from-blue-400 dark:via-teal-400 dark:to-blue-500">
                Maximum Efficiency.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className={`text-xl mb-12 max-w-2xl mx-auto leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Transform your logistics operations with AI-driven routing,
              predictive maintenance, and real-time analytics. Built for modern
              fleets.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <button
                onClick={() => navigate("/login")}
                className="group w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className={`w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-lg transition-all border flex items-center justify-center shadow-sm ${
                  isDark
                    ? "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Explore Features
              </a>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className={`absolute inset-0 rounded-2xl blur-xl ${isDark ? "bg-gradient-to-b from-blue-500/20 to-transparent" : "bg-gradient-to-b from-blue-500/10 to-transparent"}`} />
            <div className={`relative rounded-2xl border p-2 shadow-2xl overflow-hidden glass ${isDark ? "border-slate-700/50 bg-slate-900 shadow-black/50" : "border-slate-200/80 bg-white shadow-slate-300/50"}`}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
              {/* Fake UI */}
              <div className={`rounded-xl border h-[300px] sm:h-[400px] lg:h-[500px] w-full flex flex-col p-4 relative overflow-hidden ${isDark ? "bg-slate-950/50 border-slate-800" : "bg-slate-50/50 border-slate-200"}`}>
                {/* Sidebar mock */}
                <div className={`absolute left-4 top-4 bottom-4 w-48 border rounded-lg hidden md:block opacity-70 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className={`h-8 w-24 rounded m-4 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  <div className="space-y-3 mt-8 px-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-6 rounded w-full ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Main area mock */}
                <div className="md:ml-56 flex-1 flex flex-col">
                  <div className={`flex justify-between items-center mb-6 border-b pb-4 ${isDark ? "border-slate-800/50" : "border-slate-200"}`}>
                    <div className="flex space-x-4">
                      <div className={`w-24 h-6 rounded opacity-70 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                      <div className={`w-24 h-6 rounded opacity-70 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                    </div>
                    <div className={`w-10 h-10 rounded-full opacity-70 ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-28 border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden shadow-sm ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full" />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div className={`w-5 h-5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
                        </div>
                        <div className={`w-20 h-5 rounded ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
                      </div>
                    ))}
                  </div>
                  <div className={`flex-1 border rounded-lg flex items-center justify-center overflow-hidden relative shadow-sm ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
                    {/* Mock chart */}
                    <svg
                      className={`absolute w-full h-full opacity-30 ${isDark ? "text-slate-800" : "text-slate-200"}`}
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <path
                         d="M0,100 L0,50 Q25,30 50,60 T100,40 L100,100 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-24 relative border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-50 border-slate-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`inline-block px-4 py-1.5 rounded-full font-medium text-sm border mb-6 ${
                isDark ? "bg-blue-900/30 text-blue-400 border-blue-900" : "bg-blue-100 text-blue-700 border-blue-200"
              }`}
            >
              Features
            </motion.div>
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Everything you need to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500 dark:from-blue-400 dark:to-teal-400">
                run your fleet
              </span>
            </h2>
            <p className={`max-w-2xl mx-auto text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Integrated tools designed for dispatchers, managers, and safety
              officers to work together seamlessly in real time.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className={`p-8 rounded-2xl border transition-all group cursor-default relative overflow-hidden shadow-sm ${
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform duration-500">
                  {feature.icon}
                </div>
                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] ${
                  isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-100"
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust/Integration Section */}
      <section
        id="how-it-works"
        className={`py-24 relative overflow-hidden border-t ${isDark ? "bg-slate-900 border-slate-800/50" : "bg-white border-slate-200"}`}
      >
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl rounded-full blur-[120px] pointer-events-none ${isDark ? "bg-blue-600/10" : "bg-blue-400/10"}`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                Designed for scale.
                <br />
                <span className="text-blue-500 dark:text-blue-400">Built for performance.</span>
              </h2>
              <p className={`text-lg mb-8 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Whether you're managing 10 vehicles or 10,000, FleetFlow adapts
                to your needs. Connect instantly with your existing Odoo setup
                and start optimizing from day one.
              </p>
              <ul className="space-y-5">
                {[
                  {
                    title: "Zero-downtime deployment",
                    desc: "SaaS architecture that scales instantly.",
                  },
                  {
                    title: "Enterprise-grade security",
                    desc: "Secure data pipelines and SOC2 compliance.",
                  },
                  {
                    title: "Real-time tracking",
                    desc: "WebSockets for live map updates with zero lag.",
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex flex-col space-y-1 pl-12 relative"
                  >
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-teal-500 dark:text-teal-400 flex-shrink-0" />
                    </div>
                    <span className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {item.title}
                    </span>
                    <span className={`${isDark ? "text-slate-400" : "text-slate-600"}`}>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-teal-500 rounded-[2.5rem] blur opacity-20" />
              <div className={`aspect-square md:aspect-video lg:aspect-square rounded-3xl border p-8 flex items-center justify-center relative overflow-hidden z-10 shadow-lg ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                {/* Decorative grids */}
                <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${isDark ? "opacity-[0.03]" : "opacity-[0.05]"}`} />
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm relative z-20">
                  {[
                    { color: "bg-blue-500", icon: <Map className="w-8 h-8 text-white" /> },
                    { color: "bg-teal-500", icon: <BarChart3 className="w-8 h-8 text-white" /> },
                    { color: "bg-indigo-500", icon: <Wrench className="w-8 h-8 text-white" /> },
                    { color: "bg-purple-500", icon: <Zap className="w-8 h-8 text-white" /> },
                  ].map((block, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-2xl ${block.color} opacity-90 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform cursor-default relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                      <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                        {block.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-24 relative overflow-hidden border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <div className={`absolute inset-0 ${isDark ? "bg-blue-900" : "bg-blue-600"}`} />
        <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? "from-blue-900 via-slate-900 to-slate-950" : "from-blue-600 via-blue-700 to-indigo-900"}`} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />

        {/* Glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-blue-500/20 rounded-full blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 text-center relative z-10"
        >
          <div className="w-20 h-20 mx-auto bg-blue-500 rounded-2xl mb-8 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] transform -rotate-6">
            <Truck className="w-10 h-10 text-white transform rotate-6" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Ready to transform your fleet?
          </h2>
          <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Join forward-thinking companies optimizing their logistics and
            reducing costs with FleetFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-blue-900 font-bold text-lg hover:bg-slate-50 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center"
            >
              Go to Dashboard
            </button>
            <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-blue-800/50 text-white font-bold text-lg hover:bg-blue-800/80 transition-all border border-blue-700/50 backdrop-blur-sm">
              Contact Sales
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 relative z-10 ${isDark ? "bg-slate-950 border-slate-900" : "bg-slate-100 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row justify-between items-center mb-8 pb-8 border-b ${isDark ? "border-slate-900" : "border-slate-300"}`}>
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isDark ? "from-slate-100 to-slate-400" : "from-slate-900 to-slate-600"}`}>
                FleetFlow
              </span>
            </div>
            <div className="flex space-x-6">
              {["Product", "Features", "Pricing", "Company"].map((link) => (
                <span
                  key={link}
                  className={`cursor-pointer transition-colors text-sm font-medium ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-blue-600"}`}
                >
                  {link}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className={`text-sm mb-4 md:mb-0 font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              &copy; {new Date().getFullYear()} FleetFlow. Odoo Hackathon 2026.
              Data visualization by Recharts.
            </p>
            <div className={`flex space-x-4 text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-500"}`}>
              <span className={`cursor-pointer transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>
                Privacy Policy
              </span>
              <span className={`cursor-pointer transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
