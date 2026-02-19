/**
 * ProfileLayout — generic user profile page template.
 *
 * Structure:
 *   ┌────────────────────────────────────────────────┐
 *   │  Cover banner + Avatar + Name + Role + Actions │
 *   ├─────────────────────┬──────────────────────────┤
 *   │  Info sections      │  Side panel (stats/bio)  │
 *   └─────────────────────┴──────────────────────────┘
 *
 * Slots:
 *   - avatarUrl, name, role, email
 *   - coverGradient: Tailwind gradient class (default indigo→violet)
 *   - headerActions: Follow, Edit Profile, Message buttons
 *   - infoSections: SectionCards (Details, Address, etc.)
 *   - sidePanel: stat grid, bio, skills tags
 *
 * Usage:
 *   <ProfileLayout
 *     name="Urva Gandhi"
 *     role="Full Stack Developer"
 *     email="urva@example.com"
 *     headerActions={<EditButton />}
 *     infoSections={<>...</>}
 *     sidePanel={<>...</>}
 *   />
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface ProfileLayoutProps {
  name: string;
  role?: string;
  email?: string;
  avatarUrl?: string;
  /** Tailwind gradient applied to the cover banner */
  coverGradient?: string;
  /** Edit Profile, Follow, Message buttons */
  headerActions?: ReactNode;
  /** SectionCards or other fully-spanned info blocks */
  infoSections?: ReactNode;
  /** Right-side panel: stats, bio, tags */
  sidePanel?: ReactNode;
}

export function ProfileLayout({
  name,
  role,
  email,
  avatarUrl,
  coverGradient = "from-indigo-600 via-violet-600 to-purple-700",
  headerActions,
  infoSections,
  sidePanel,
}: ProfileLayoutProps) {
  return (
    <section className="space-y-6">
      {/* ── Hero card ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Cover banner */}
        <div
          className={`h-32 sm:h-40 bg-gradient-to-br ${coverGradient} relative`}
          aria-hidden="true"
        >
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Avatar + name row */}
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 sm:-mt-12">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-lg bg-indigo-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-400" />
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Actions */}
            {headerActions && (
              <div className="flex items-center gap-2 self-start sm:self-auto mt-3 sm:mt-0">
                {headerActions}
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="mt-3">
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            {role && <p className="text-sm font-medium text-indigo-600 mt-0.5">{role}</p>}
            {email && <p className="text-sm text-slate-500 mt-0.5">{email}</p>}
          </div>
        </div>
      </motion.div>

      {/* ── Body: info + side panel ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Info sections */}
        <div className="space-y-5 min-w-0">{infoSections}</div>

        {/* Side panel */}
        {sidePanel && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
            className="space-y-4"
          >
            {sidePanel}
          </motion.div>
        )}
      </div>
    </section>
  );
}
