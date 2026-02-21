/**
 * UIDemo — unified, fully-detailed showcase for all UI components.
 *
 * Tabs: Toast | AlertDialog | Breadcrumb | DropdownMenu | Layouts
 * Route: /demo
 *
 * Each tab preserves the full level of detail from the original
 * individual demo pages: rich cards, code examples, interaction logs,
 * stagger animations, and live feedback.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, Home, ChevronDown, LayoutDashboard,
  CheckCircle, XCircle, Info, Trash2,
  User, Settings, LogOut, CreditCard, Shield,
  Edit, Copy, Archive, Star, Share2, Download, MoreHorizontal,
  Moon, Sun, Flag, HelpCircle, Package, Layers,
  LayoutGrid, RefreshCw, ShieldOff, Save,
} from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "../components/ui/AlertDialog";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
} from "../components/ui/Breadcrumb";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "../components/ui/DropdownMenu";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CrudLayout } from "../layouts/CrudLayout";
import { ProfileLayout } from "../layouts/ProfileLayout";
import { SettingsLayout } from "../layouts/SettingsLayout";
import { ServerErrorLayout } from "../layouts/ServerErrorLayout";
import { StatCard } from "../components/ui/StatCard";
import { DataTable } from "../components/ui/DataTable";
import { SectionCard } from "../components/ui/SectionCard";

// ── Shared animation variants ─────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const } },
};

// ── Shared primitives ─────────────────────────────────────────

function SectionTitle({ label, icon: Icon, color = "bg-indigo-600" }: {
  label: string;
  icon: React.FC<{ className?: string }>;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      className="flex items-center gap-3 mb-2"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{label}</h2>
    </motion.div>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="text-sm text-slate-500 max-w-xl mb-8"
    >
      {children}
    </motion.p>
  );
}

function DemoCard({ title, description, icon: Icon, iconBg, iconColor, footerNote, children }: {
  title: string;
  description: string;
  icon?: React.FC<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  footerNote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={itemVariants}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl ${iconBg ?? "bg-slate-100"} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${iconColor ?? "text-slate-600"}`} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 flex items-center justify-center min-h-24">
        {children}
      </div>
      {footerNote && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
          {footerNote}
        </div>
      )}
    </motion.div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35 }}
      className="mt-10 bg-slate-900 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-slate-500 font-mono ml-2">Usage</span>
      </div>
      <pre className="p-5 text-xs text-slate-200 leading-relaxed overflow-x-auto whitespace-pre">{code}</pre>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — TOAST
// ═══════════════════════════════════════════════════════════════

function ToastPanel() {
  const toast = useToast();

  const actions = [
    {
      label: "Success",
      description: "Confirm a completed mutation or server-side action",
      icon: CheckCircle,
      colorClasses: "bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
      iconClass: "text-emerald-500",
      action: () => toast.success("Item created successfully!", { title: "Success" }),
    },
    {
      label: "Error",
      description: "Signal a failed request or validation rejection",
      icon: XCircle,
      colorClasses: "bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300",
      iconClass: "text-red-500",
      action: () => toast.error("Failed to connect to the server. Please try again.", { title: "Connection Error" }),
    },
    {
      label: "Warning",
      description: "Non-blocking caution — session, quota, or risk",
      icon: AlertTriangle,
      colorClasses: "bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300",
      iconClass: "text-amber-500",
      action: () => toast.warning("Your session will expire in 5 minutes.", { title: "Session Expiring" }),
    },
    {
      label: "Info",
      description: "Neutral system or update notification",
      icon: Info,
      colorClasses: "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
      iconClass: "text-indigo-500",
      action: () => toast.info("New updates are available. Refresh to apply.", { title: "Update Available" }),
    },
    {
      label: "No Title",
      description: "Single-line message without a heading",
      icon: Bell,
      colorClasses: "bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300",
      iconClass: "text-slate-500",
      action: () => toast.success("Your profile has been updated."),
    },
    {
      label: "Sticky",
      description: "Stays until manually dismissed (duration: 0)",
      icon: Info,
      colorClasses: "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
      iconClass: "text-indigo-500",
      action: () => toast.info("This toast requires manual dismissal.", { title: "Sticky Toast", duration: 0 }),
    },
    {
      label: "Stack All",
      description: "Fire success + error + warning + info simultaneously",
      icon: Bell,
      colorClasses: "bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100",
      iconClass: "text-indigo-600",
      action: () => {
        toast.success("Record saved to database.");
        setTimeout(() => toast.error("Authentication token expired.", { title: "Auth Error" }), 150);
        setTimeout(() => toast.warning("Disk usage above 80%.", { title: "Storage Warning" }), 300);
        setTimeout(() => toast.info("Backup completed at 03:00 AM.", { title: "System Info" }), 450);
      },
    },
  ];

  return (
    <div>
      <SectionTitle label="Toast Notifications" icon={Bell} />
      <SectionDesc>
        Interactive demo of all toast variants. On hackathon day, these fire from real API responses.
        Click any card to trigger — toasts stack top-right and auto-dismiss after 4 seconds.
      </SectionDesc>

      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <motion.button key={a.label} variants={itemVariants}
              onClick={a.action}
              className={`group text-left p-5 rounded-xl transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.97] ${a.colorClasses}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${a.iconClass}`} />
                <div>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800">{a.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.3 }} className="flex justify-end mb-2">
        <button onClick={toast.dismissAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
          <Trash2 className="w-4 h-4" /> Dismiss All
        </button>
      </motion.div>

      <CodeBlock code={`import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await api.saveItem(data);
      toast.success("Item saved!", { title: "Saved" });
    } catch {
      toast.error("Failed to save. Try again.", { title: "Error" });
    }
  };

  // Variants: success | error | warning | info
  toast.success("Done!");
  toast.error("Something failed.");
  toast.warning("Session expiring soon.", { duration: 0 }); // sticky
  toast.info("Update available.");
  toast.dismissAll(); // clear all visible toasts
}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — ALERT DIALOG
// ═══════════════════════════════════════════════════════════════

function DialogPanel() {
  const [result, setResult] = useState<string | null>(null);
  const confirm = (msg: string) => { setResult(msg); setTimeout(() => setResult(null), 3000); };

  const demos = [
    {
      title: "Default Action",
      description: "Standard indigo confirm button — use for non-destructive confirmations",
      icon: Info, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
      trigger: <button className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25 active:scale-[0.97]">Show Dialog</button>,
      dialogTitle: "Are you absolutely sure?",
      dialogDesc: "This action cannot be undone. This will permanently delete your account and remove all associated data from our servers.",
      actionLabel: "Continue", variant: "default" as const,
      onAction: () => confirm("Action confirmed!"),
      footerNote: 'variant="default" — indigo Action button',
    },
    {
      title: "Destructive",
      description: "Red action button for irreversible, high-risk operations",
      icon: Trash2, iconBg: "bg-red-50", iconColor: "text-red-600",
      trigger: <button className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-500/25 active:scale-[0.97]">Delete Account</button>,
      dialogTitle: "Delete Account?",
      dialogDesc: "This action is permanent. Your profile, data, and all associated records will be wiped immediately and cannot be recovered.",
      actionLabel: "Yes, delete my account", variant: "destructive" as const,
      onAction: () => confirm("Account deleted!"),
      footerNote: 'variant="destructive" — red Action button',
    },
    {
      title: "Sign Out",
      description: "Session-ending guard to prevent accidental logout",
      icon: LogOut, iconBg: "bg-amber-50", iconColor: "text-amber-600",
      trigger: <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.97]">Sign Out</button>,
      dialogTitle: "Sign out of your account?",
      dialogDesc: "You'll need to log back in to access your dashboard. Any unsaved changes will be lost.",
      actionLabel: "Sign Out", variant: "default" as const,
      onAction: () => confirm("Signed out!"),
      footerNote: "Ghost trigger + default action",
    },
    {
      title: "Revoke Access",
      description: "Removes API key or OAuth permissions immediately",
      icon: ShieldOff, iconBg: "bg-violet-50", iconColor: "text-violet-600",
      trigger: <button className="px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/25 active:scale-[0.97]">Revoke Access</button>,
      dialogTitle: "Revoke API Access?",
      dialogDesc: "The integration will immediately lose access. Any running workflows using this key will fail until a new key is issued.",
      actionLabel: "Revoke Now", variant: "destructive" as const,
      onAction: () => confirm("Access revoked!"),
      footerNote: "Violet trigger + destructive action",
    },
    {
      title: "Reset to Defaults",
      description: "Wipe all customisations and restart from factory state",
      icon: RefreshCw, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      trigger: <button className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/25 active:scale-[0.97]">Reset to Defaults</button>,
      dialogTitle: "Reset all settings?",
      dialogDesc: "All customisations, preferences, and saved configurations will be reset to factory defaults. This cannot be reversed.",
      actionLabel: "Reset Settings", variant: "default" as const,
      onAction: () => confirm("Settings reset!"),
      footerNote: "Emerald trigger + default action",
    },
    {
      title: "Unsaved Changes",
      description: "Navigate-away guard — blocks accidental data loss",
      icon: Save, iconBg: "bg-slate-100", iconColor: "text-slate-600",
      trigger: <button className="px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-md active:scale-[0.97]">Leave Page</button>,
      dialogTitle: "You have unsaved changes",
      dialogDesc: "If you leave now, your edits will be discarded. Do you want to save before leaving?",
      actionLabel: "Discard & Leave", variant: "destructive" as const,
      onAction: () => confirm("Left without saving!"),
      footerNote: "Common router-guard pattern",
    },
  ];

  return (
    <div>
      <SectionTitle label="Alert Dialog" icon={AlertTriangle} color="bg-red-600" />
      <SectionDesc>
        Drop-in equivalent of shadcn/ui AlertDialog — no Radix, no extra deps. Portal-rendered with Framer Motion
        scale animation, Escape-to-close, and body scroll lock. Two action variants: default (indigo) and destructive (red).
      </SectionDesc>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-6">
            <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />{result}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {demos.map((d) => (
          <DemoCard key={d.title} title={d.title} description={d.description}
            icon={d.icon} iconBg={d.iconBg} iconColor={d.iconColor}
            footerNote={<code className="font-mono">{d.footerNote}</code>}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>{d.trigger}</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{d.dialogTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{d.dialogDesc}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant={d.variant} onClick={d.onAction}>{d.actionLabel}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DemoCard>
        ))}
      </motion.div>

      <CodeBlock code={`import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/AlertDialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <button>Delete</button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      {/* variant: "default" (indigo) | "destructive" (red) */}
      <AlertDialogAction variant="destructive" onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — BREADCRUMB
// ═══════════════════════════════════════════════════════════════

function BreadcrumbPanel() {
  const crumbs = [
    {
      title: "Basic 3-Level",
      description: "Standard hierarchy — Home → Section → Current page",
      icon: Home, iconBg: "bg-slate-100", iconColor: "text-slate-600",
      footerNote: <code className="font-mono">Home / Section / Current</code>,
      content: (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/demo">Components</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ),
    },
    {
      title: "Collapsed Middle",
      description: "Hidden pages via ellipsis dropdown — for hierarchies ≥ 4 levels deep",
      icon: MoreHorizontal, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
      footerNote: <code className="font-mono">Home / ··· dropdown / Components / Page</code>,
      content: (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-slate-100 transition-colors text-slate-500" aria-label="Show more pages">
                    <BreadcrumbEllipsis />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Documentation</DropdownMenuItem>
                    <DropdownMenuItem>Themes</DropdownMenuItem>
                    <DropdownMenuItem>GitHub</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/demo">Components</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ),
    },
    {
      title: "Settings Depth",
      description: "Typical 3-level app hierarchy — dashboard → settings → sub-page",
      icon: Settings, iconBg: "bg-slate-100", iconColor: "text-slate-600",
      footerNote: <code className="font-mono">Dashboard / Settings / Security</code>,
      content: (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/demo">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Security</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ),
    },
    {
      title: "Custom Separator",
      description: "Swap the default › chevron for a custom element (slash, bullet, etc.)",
      icon: Star, iconBg: "bg-amber-50", iconColor: "text-amber-600",
      footerNote: <><code className="font-mono">{"<BreadcrumbSeparator>"}</code> accepts any child</>,
      content: (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><span className="text-slate-300 font-light select-none">/</span></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/demo">Products</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><span className="text-slate-300 font-light select-none">/</span></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbPage>Analytics</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ),
    },
  ];

  return (
    <div>
      <SectionTitle label="Breadcrumb" icon={Home} color="bg-slate-700" />
      <SectionDesc>
        shadcn/ui-compatible component tree — nav, list, item, link (asChild), page, separator, ellipsis.
        Replace <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs">Link href="#"</code> with React Router's{" "}
        <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs">{"<Link to=''>"}.</code>{" "}
        The ui-ux-agent spec requires breadcrumbs when page depth ≥ 3 levels.
      </SectionDesc>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {crumbs.map((c) => (
          <DemoCard key={c.title} title={c.title} description={c.description}
            icon={c.icon} iconBg={c.iconBg} iconColor={c.iconColor}
            footerNote={c.footerNote}
          >
            {c.content}
          </DemoCard>
        ))}
      </motion.div>

      <CodeBlock code={`import { Link } from "react-router-dom"; // not next/link
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
} from "@/components/ui/Breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/DropdownMenu";

{/* with collapsed middle pages */}
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button><BreadcrumbEllipsis /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Documentation</DropdownMenuItem>
          <DropdownMenuItem>Themes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4 — DROPDOWN MENU
// ═══════════════════════════════════════════════════════════════

function DropdownPanel() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [log, setLog] = useState<string[]>([]);
  const emit = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  const dropdowns = [
    {
      title: "Account Menu",
      description: "User avatar trigger with labelled groups, icons, and destructive sign-out item",
      icon: User, iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
      footerNote: <><code className="font-mono">align="end"</code> — anchored to right edge</>,
      content: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-sm">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              Urva Gandhi
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => emit("→ Profile")} className="gap-2"><User className="w-4 h-4 text-slate-400" /> Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => emit("→ Billing")} className="gap-2"><CreditCard className="w-4 h-4 text-slate-400" /> Billing</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => emit("→ Settings")} className="gap-2"><Settings className="w-4 h-4 text-slate-400" /> Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => emit("→ Sign Out")} destructive className="gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      title: "Row Actions (Kebab)",
      description: "Three-dot menu on table rows — edit, duplicate, archive, delete",
      icon: MoreHorizontal, iconBg: "bg-slate-100", iconColor: "text-slate-600",
      footerNote: <><code className="font-mono">DropdownMenuItem destructive</code> — red hover</>,
      content: (
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Product #42</p>
            <p className="text-xs text-slate-400">Active · 3 variants</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500" aria-label="Row actions">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => emit("Edit row")} className="gap-2"><Edit className="w-4 h-4 text-slate-400" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => emit("Duplicated")} className="gap-2"><Copy className="w-4 h-4 text-slate-400" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => emit("Archived")} className="gap-2"><Archive className="w-4 h-4 text-slate-400" /> Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => emit("Deleted")} destructive className="gap-2"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      title: "Theme Switcher",
      description: "Stateful dropdown — selected item highlights with indigo active state",
      icon: Sun, iconBg: "bg-amber-50", iconColor: "text-amber-600",
      footerNote: "Item can conditionally apply active className",
      content: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-sm">
              {theme === "light" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              {theme === "light" ? "Light" : "Dark"}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { setTheme("light"); emit("Switched to Light"); }} className={`gap-2 ${theme === "light" ? "bg-indigo-50 text-indigo-700" : ""}`}>
              <Sun className="w-4 h-4 text-amber-500" /> Light {theme === "light" && <span className="ml-auto text-xs font-semibold text-indigo-500">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { setTheme("dark"); emit("Switched to Dark"); }} className={`gap-2 ${theme === "dark" ? "bg-indigo-50 text-indigo-700" : ""}`}>
              <Moon className="w-4 h-4 text-indigo-500" /> Dark {theme === "dark" && <span className="ml-auto text-xs font-semibold text-indigo-500">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      title: "Share / Export",
      description: "Multi-group menu with labelled sections — export formats + sharing options",
      icon: Share2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      footerNote: <><code className="font-mono">DropdownMenuLabel</code> + <code className="font-mono">DropdownMenuSeparator</code> for sections</>,
      content: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors shadow-md shadow-indigo-500/25">
              <Share2 className="w-4 h-4" /> Share <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Export As</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => emit("Downloaded PDF")} className="gap-2"><Download className="w-4 h-4 text-slate-400" /> Download PDF</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Downloaded CSV")} className="gap-2"><Download className="w-4 h-4 text-slate-400" /> Download CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Share With</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => emit("Link copied")} className="gap-2"><Copy className="w-4 h-4 text-slate-400" /> Copy Link</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Added to starred")} className="gap-2"><Star className="w-4 h-4 text-slate-400" /> Add to Starred</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      title: "Security Actions",
      description: "Scoped security operations — 2FA, active sessions, audit log, revoke all",
      icon: Shield, iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
      footerNote: "Last item is destructive — separate with Separator",
      content: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors shadow-sm">
              <Shield className="w-4 h-4 text-emerald-600" /> Security
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => emit("2FA enabled")} className="gap-2"><Shield className="w-4 h-4 text-slate-400" /> Enable 2FA</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Sessions opened")} className="gap-2"><User className="w-4 h-4 text-slate-400" /> Active Sessions</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Audit opened")} className="gap-2"><Flag className="w-4 h-4 text-slate-400" /> Audit Log</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Help opened")} className="gap-2"><HelpCircle className="w-4 h-4 text-slate-400" /> Security Help</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => emit("All sessions revoked")} destructive className="gap-2"><LogOut className="w-4 h-4" /> Revoke All Sessions</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      title: "Ghost Icon Trigger",
      description: "Icon-only MoreHorizontal button — smallest possible trigger footprint",
      icon: MoreHorizontal, iconBg: "bg-slate-100", iconColor: "text-slate-500",
      footerNote: "Use aria-label on icon-only buttons (a11y requirement)",
      content: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500" aria-label="More options">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => emit("Edit")} className="gap-2"><Edit className="w-4 h-4 text-slate-400" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => emit("Starred")} className="gap-2"><Star className="w-4 h-4 text-slate-400" /> Star</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => emit("Deleted")} destructive className="gap-2"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <SectionTitle label="Dropdown Menu" icon={ChevronDown} color="bg-violet-600" />
      <SectionDesc>
        Lightweight shadcn/ui-compatible dropdown — no Radix. Portal-rendered with auto-positioning (start / center / end),
        Escape-to-close, outside-click dismiss, and Framer Motion fade-scale entrance. Supports labels, separators,
        groups, destructive items, and icon rows.
      </SectionDesc>

      <motion.div variants={containerVariants} initial="hidden" animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {dropdowns.map((d) => (
          <DemoCard key={d.title} title={d.title} description={d.description}
            icon={d.icon} iconBg={d.iconBg} iconColor={d.iconColor}
            footerNote={typeof d.footerNote === "string" ? d.footerNote : d.footerNote}
          >
            {d.content}
          </DemoCard>
        ))}
      </motion.div>

      {/* Interaction log */}
      <AnimatePresence>
        {log.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-8 bg-slate-900 rounded-2xl p-5"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Interaction Log</p>
            <div className="space-y-1.5">
              {log.map((e, i) => (
                <div key={i} className={`text-sm font-mono ${i === 0 ? "text-emerald-400" : "text-slate-600"}`}>
                  {i === 0 && <span className="text-slate-600 mr-2">›</span>}{e}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CodeBlock code={`import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button>Options</button>
  </DropdownMenuTrigger>

  {/* align: "start" | "center" | "end"  — default: "end" */}
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem onSelect={() => navigate("/profile")}>
        Profile
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => navigate("/settings")}>
        Settings
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    {/* Red hover state */}
    <DropdownMenuItem destructive onSelect={handleSignOut}>
      Sign Out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5 — LAYOUTS
// ═══════════════════════════════════════════════════════════════

// ── Layout sub-previews ───────────────────────────────────────

type LayoutTabId = "dashboard" | "crud" | "profile" | "settings" | "error";

const LAYOUT_TABS: { id: LayoutTabId; label: string; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "crud",      label: "CRUD" },
  { id: "profile",   label: "Profile" },
  { id: "settings",  label: "Settings" },
  { id: "error",     label: "500 Error" },
];

// dummy columns / rows for DataTable preview
const demoColumns = [
  { key: "name",   header: "Name",   render: (r: { name: string; status: string; amount: string }) => <span className="font-medium text-slate-900">{r.name}</span> },
  { key: "status", header: "Status", render: (r: { name: string; status: string; amount: string }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
  )},
  { key: "amount", header: "Amount", render: (r: { name: string; status: string; amount: string }) => <span className="text-slate-600">{r.amount}</span> },
];
const demoRows = [
  { id: "1", name: "Acme Corp",     status: "Active",  amount: "₹1,20,000" },
  { id: "2", name: "Globex Inc",    status: "Pending", amount: "₹85,500"  },
  { id: "3", name: "Initech Ltd",   status: "Active",  amount: "₹2,40,000" },
  { id: "4", name: "Umbrella Co",   status: "Pending", amount: "₹60,750"  },
];

function DashboardPreview() {
  return (
    <DashboardLayout
      icon={LayoutGrid}
      title="Analytics Overview"
      subtitle="Live preview — slot props populate this page automatically"
      stats={
        <>
          <StatCard icon={User}          label="Total Users"  value="4,821" trend="up"   trendLabel="+12%" iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
          <StatCard icon={Package}       label="Products"     value="348"   trend="neutral"                iconBg="bg-slate-100"  iconColor="text-slate-600"  />
          <StatCard icon={CheckCircle}   label="Orders Done"  value="1,930" trend="up"   trendLabel="+6%"  iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard icon={AlertTriangle} label="Pending"      value="22"    trend="down" trendLabel="-3%"  iconBg="bg-amber-50"   iconColor="text-amber-600"  />
        </>
      }
      primaryPanel={
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">primaryPanel — DataTable / Chart</p>
          <p className="text-sm text-slate-500">Full width on lg+. Drop in a DataTable, recharts chart, or any block.</p>
          <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-300 text-xs font-mono">chart area</div>
        </div>
      }
      secondaryPanel={
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-900">secondaryPanel — Sidebar</p>
          <p className="text-sm text-slate-500">Activity feed, quick actions. Fixed 320px on lg+.</p>
          <div className="space-y-2">{[70, 50, 85, 40].map((w, i) => <div key={i} className="h-2.5 rounded bg-slate-100" style={{ width: `${w}%` }} />)}</div>
        </div>
      }
    />
  );
}

function CrudPreview() {
  return (
    <CrudLayout
      icon={Package}
      title="Products"
      subtitle="Manage your product catalogue"
      actions={
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
          + New Product
        </button>
      }
      toolbar={
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search products…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
              readOnly
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
          <button className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">Filter</button>
          <button className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">Sort</button>
        </div>
      }
      table={
        <DataTable<{ id: string; name: string; status: string; amount: string }>
          columns={demoColumns}
          rows={demoRows}
          rowKey={(r) => r.id}
        />
      }
      pagination={
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40" disabled>← Prev</button>
          <span className="text-xs text-slate-500">Page 1 of 5</span>
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Next →</button>
        </div>
      }
    />
  );
}

function ProfilePreview() {
  return (
    <ProfileLayout
      name="Urva Gandhi"
      role="Full Stack Developer"
      email="urva@example.com"
      coverGradient="from-indigo-600 via-violet-600 to-purple-700"
      headerActions={
        <>
          <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">Message</button>
          <button className="px-3 py-1.5 text-xs font-medium bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">Edit Profile</button>
        </>
      }
      infoSections={
        <>
          <SectionCard title="Personal Details" description="Basic identity and contact information">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[["Full Name","Urva Gandhi"],["Email","urva@example.com"],["Phone","+91 98765 43210"],["Location","Ahmedabad, India"]].map(([k,v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Skills" description="Technical stack and tools">
            <div className="flex flex-wrap gap-2">
              {["React","TypeScript","Python","FastAPI","PostgreSQL","Tailwind","Docker","Git"].map(s => (
                <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100">{s}</span>
              ))}
            </div>
          </SectionCard>
        </>
      }
      sidePanel={
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-slate-900">Stats</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[["48", "Projects"],["12", "Repos"],["4.8", "Rating"],["3 yrs", "Exp"]].map(([v, l]) => (
              <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-base font-bold text-indigo-600">{v}</p>
                <p className="text-xs text-slate-500 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">Passionate about building scalable, beautiful products. Currently at Odoo Hackathon 2026.</p>
        </div>
      }
    />
  );
}

function SettingsPreview() {
  const [settingsTab, setSettingsTab] = useState("account");
  return (
    <SettingsLayout
      title="Settings"
      subtitle="Manage your account, security, and notifications"
      activeTab={settingsTab}
      onTabChange={setSettingsTab}
      tabs={[
        {
          id: "account", label: "Account", icon: User,
          content: (
            <SectionCard title="Account Information" description="Update your personal details">
              <div className="space-y-4">
                {[["Full Name","Urva Gandhi"],["Email","urva@example.com"],["Username","@urva"]].map(([l,v]) => (
                  <div key={l}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l}</label>
                    <input defaultValue={v} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800" />
                  </div>
                ))}
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">Save Changes</button>
              </div>
            </SectionCard>
          ),
        },
        {
          id: "security", label: "Security", icon: Shield,
          content: (
            <SectionCard title="Security Settings" description="Control your password and two-factor authentication">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Enable</button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Change Password</p>
                    <p className="text-xs text-slate-500 mt-0.5">Last changed 3 months ago</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">Update</button>
                </div>
              </div>
            </SectionCard>
          ),
        },
        {
          id: "notifications", label: "Notifications", icon: Bell, badge: "3",
          content: (
            <SectionCard title="Notification Preferences" description="Choose what you want to be notified about">
              <div className="space-y-3">
                {[["Email Alerts","Get notified about important account activity",true],["Push Notifications","Real-time alerts in your browser",false],["Weekly Digest","A summary of your activity every week",true]].map(([label,desc,on]) => (
                  <div key={label as string} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{label as string}</p>
                      <p className="text-xs text-slate-500">{desc as string}</p>
                    </div>
                    <div className={`w-10 h-5.5 rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-slate-200"} relative cursor-pointer`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ),
        },
        {
          id: "billing", label: "Billing", icon: CreditCard, badge: "Pro",
          content: (
            <SectionCard title="Billing & Plan" description="Manage your subscription and payment details">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Pro Plan</p>
                    <p className="text-xs text-indigo-600 mt-0.5">₹999 / month — billed monthly</p>
                  </div>
                  <span className="text-xs font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-lg">Active</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">•••• •••• •••• 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/26</p>
                  </div>
                  <button className="text-xs text-indigo-600 font-medium hover:underline">Update</button>
                </div>
              </div>
            </SectionCard>
          ),
        },
      ]}
    />
  );
}

function ErrorPreview() {
  const [retried, setRetried] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-emerald-400"/></div>
        <span className="text-xs text-slate-400 font-mono ml-1">ServerErrorLayout preview</span>
        {retried && <span className="ml-auto text-xs text-indigo-600 font-medium">✓ onRetry fired</span>}
      </div>
      <ServerErrorLayout
        title="Internal Server Error"
        message="Something went wrong on our end. Our team has been notified and is working on a fix."
        onRetry={() => setRetried(true)}
        technicalDetail={`Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1300:16)
SystemError: Failed to reach database cluster.
  at DatabasePool.connect (/app/db/pool.ts:82:13)`}
      />
    </div>
  );
}

function LayoutsPanel() {
  const [layoutTab, setLayoutTab] = useState<LayoutTabId>("dashboard");

  const LAYOUT_PREVIEWS: Record<LayoutTabId, React.FC> = {
    dashboard: DashboardPreview,
    crud:      CrudPreview,
    profile:   ProfilePreview,
    settings:  SettingsPreview,
    error:     ErrorPreview,
  };

  const Preview = LAYOUT_PREVIEWS[layoutTab];

  return (
    <div>
      <SectionTitle label="Layout Templates" icon={LayoutDashboard} color="bg-indigo-600" />
      <SectionDesc>
        Five generic page-level layout templates. Select a template to see a fully-interactive live preview
        with realistic dummy content. Each accepts typed slot props — drop in your own content and go.
      </SectionDesc>

      {/* Sub-tab pill bar */}
      <div className="flex flex-wrap gap-2 mb-7">
        {LAYOUT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setLayoutTab(t.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1
              ${layoutTab === t.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }
            `}
          >
            {t.label}
            {t.badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${layoutTab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Animated preview */}
      <AnimatePresence mode="wait">
        <motion.div
          key={layoutTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          <Preview />
        </motion.div>
      </AnimatePresence>

      <CodeBlock code={`import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CrudLayout }      from "@/layouts/CrudLayout";
import { ProfileLayout }   from "@/layouts/ProfileLayout";
import { SettingsLayout, SettingsTab } from "@/layouts/SettingsLayout";
import { ServerErrorLayout } from "@/layouts/ServerErrorLayout";

{/* Dashboard */}
<DashboardLayout icon={LayoutDashboard} title="Dashboard"
  stats={<><StatCard icon={Users} label="Users" value="4,821" trend="up" /></>}
  primaryPanel={<DataTable columns={cols} data={rows} rowKey="id" />}
  secondaryPanel={<ActivityFeed />}
/>

{/* CRUD list */}
<CrudLayout icon={Package} title="Products" actions={<NewButton />}
  toolbar={<SearchBar />}
  table={<DataTable columns={cols} data={rows} rowKey="id" />}
  pagination={<Pagination />}
/>

{/* Profile */}
<ProfileLayout name="Urva Gandhi" role="Developer" email="urva@example.com"
  coverGradient="from-indigo-600 via-violet-600 to-purple-700"
  headerActions={<EditProfileButton />}
  infoSections={<PersonalDetailsCard />}
  sidePanel={<StatsCard />}
/>

{/* Settings — controlled tab state */}
const [tab, setTab] = useState("account");
<SettingsLayout title="Settings" activeTab={tab} onTabChange={setTab}
  tabs={[
    { id: "account",  label: "Account",  icon: User,       content: <AccountForm /> },
    { id: "security", label: "Security", icon: Shield,     content: <SecurityForm /> },
    { id: "billing",  label: "Billing",  icon: CreditCard, badge: "Pro", content: <BillingForm /> },
  ]}
/>

{/* 500 Error */}
<ServerErrorLayout
  title="Internal Server Error"
  message="Our team has been notified."
  onRetry={() => window.location.reload()}
  technicalDetail={error.stack}
/>`} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT — tab shell
// ═══════════════════════════════════════════════════════════════

type TabId = "toast" | "dialog" | "breadcrumb" | "dropdown" | "layouts";

const TABS: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "toast",      label: "Toast",        icon: Bell },
  { id: "dialog",     label: "AlertDialog",  icon: AlertTriangle },
  { id: "breadcrumb", label: "Breadcrumb",   icon: Home },
  { id: "dropdown",   label: "Dropdown",     icon: ChevronDown },
  { id: "layouts",    label: "Layouts",      icon: LayoutDashboard },
];

const PANELS: Record<TabId, React.FC> = {
  toast: ToastPanel,
  dialog: DialogPanel,
  breadcrumb: BreadcrumbPanel,
  dropdown: DropdownPanel,
  layouts: LayoutsPanel,
};

export default function UIDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("toast");
  const Panel = PANELS[activeTab];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sticky top bar + tab strip */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">UI Component Demo</span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">/demo</span>
          </div>
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-150">
            ← Back to app
          </Link>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2
                    transition-all duration-150 focus-visible:outline-none
                    ${active
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animated panel */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Panel />
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
