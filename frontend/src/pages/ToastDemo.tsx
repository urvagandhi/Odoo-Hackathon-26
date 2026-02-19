/**
 * ToastDemo — Interactive showcase of all 4 toast variants.
 *
 * UI-only for now. Will be replaced by real API-triggered toasts
 * on the day of the hackathon.
 *
 * Route: /toast-demo
 */
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  Trash2,
} from "lucide-react";
import { useToast } from "../hooks/useToast";

// ── Animation ──────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// ── Demo Button Config ─────────────────────────────────────────

interface DemoAction {
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
  colorClasses: string;
  iconClass: string;
}

// ── Page ───────────────────────────────────────────────────────

export default function ToastDemo() {
  const toast = useToast();

  const actions: DemoAction[] = [
    {
      label: "Success",
      description: "Operation completed successfully",
      icon: CheckCircle,
      action: () =>
        toast.success("Item created successfully!", {
          title: "Success",
        }),
      colorClasses:
        "bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
      iconClass: "text-emerald-500",
    },
    {
      label: "Error",
      description: "Something went wrong",
      icon: XCircle,
      action: () =>
        toast.error("Failed to connect to the server. Please try again.", {
          title: "Connection Error",
        }),
      colorClasses:
        "bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300",
      iconClass: "text-red-500",
    },
    {
      label: "Warning",
      description: "Attention required",
      icon: AlertTriangle,
      action: () =>
        toast.warning("Your session will expire in 5 minutes.", {
          title: "Session Expiring",
        }),
      colorClasses:
        "bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300",
      iconClass: "text-amber-500",
    },
    {
      label: "Info",
      description: "Informational message",
      icon: Info,
      action: () =>
        toast.info("New updates are available. Refresh to apply.", {
          title: "Update Available",
        }),
      colorClasses:
        "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
      iconClass: "text-indigo-500",
    },
    {
      label: "No Title",
      description: "Simple message without a title",
      icon: Bell,
      action: () => toast.success("Your profile has been updated."),
      colorClasses:
        "bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300",
      iconClass: "text-slate-500",
    },
    {
      label: "Sticky",
      description: "Stays until manually dismissed (duration: 0)",
      icon: Info,
      action: () =>
        toast.info("This toast requires manual dismissal.", {
          title: "Sticky Toast",
          duration: 0,
        }),
      colorClasses:
        "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
      iconClass: "text-indigo-500",
    },
    {
      label: "Stack All",
      description: "Fire all 4 variants at once",
      icon: Bell,
      action: () => {
        toast.success("Record saved to database.");
        setTimeout(() => toast.error("Authentication token expired.", { title: "Auth Error" }), 150);
        setTimeout(() => toast.warning("Disk usage above 80%.", { title: "Storage Warning" }), 300);
        setTimeout(() => toast.info("Backup completed at 03:00 AM.", { title: "System Info" }), 450);
      },
      colorClasses:
        "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100",
      iconClass: "text-indigo-600",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Toast Notification System
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-xl">
            Interactive demo of all toast notification variants. On the day of the hackathon,
            these will be triggered by real API responses. Click any card to fire a toast.
          </p>
        </motion.div>

        {/* Demo Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                variants={itemVariants}
                onClick={action.action}
                className={`
                  group text-left p-5 rounded-xl transition-all duration-150
                  cursor-pointer focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                  active:scale-[0.97]
                  ${action.colorClasses}
                `}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${action.iconClass}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Dismiss All */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex justify-end"
        >
          <button
            onClick={toast.dismissAll}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium text-red-600
              border border-red-200 bg-white
              hover:bg-red-50 hover:border-red-300
              transition-colors duration-150
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-red-500 focus-visible:ring-offset-2
              active:scale-[0.97]
            "
          >
            <Trash2 className="w-4 h-4" />
            Dismiss All
          </button>
        </motion.div>

        {/* Usage Reference Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="mt-12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Usage — How to integrate in any component
          </h2>
          <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto text-xs leading-relaxed">
            <code className="text-slate-200">{`import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await api.saveItem(data);
      toast.success("Item saved!", { title: "Saved" });
    } catch (err) {
      toast.error("Failed to save. Try again.", { title: "Error" });
    }
  };

  const notify = () => {
    // Variants: success | error | warning | info
    toast.success("Done!");
    toast.error("Something failed.");
    toast.warning("Session expiring soon.", { duration: 0 }); // sticky
    toast.info("Update available.");
  };
}`}</code>
          </pre>
        </motion.div>

      </div>
    </main>
  );
}
