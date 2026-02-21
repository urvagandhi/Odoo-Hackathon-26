/**
 * CrudLayout — generic CRUD list page template.
 *
 * Slots:
 *   - toolbar: search input + filter dropdowns + primary CTA button
 *   - table: DataTable or custom list component
 *   - pagination: pagination controls
 *   - modal: create/edit drawer or dialog (optional)
 *
 * Usage:
 *   <CrudLayout
 *     icon={Package}
 *     title="Products"
 *     subtitle="Manage product catalogue"
 *     actions={<Button onClick={openCreate}>+ New</Button>}
 *     toolbar={<SearchBar ... />}
 *     table={<DataTable ... />}
 *     pagination={<Pagination ... />}
 *   />
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "../components/ui/PageHeader";

interface CrudLayoutProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Right header: "+ New" button, export button, etc. */
  actions?: ReactNode;
  /** Search bar, filters, view-toggle */
  toolbar?: ReactNode;
  /** DataTable or custom list component */
  table: ReactNode;
  /** Pagination controls */
  pagination?: ReactNode;
  /** Drawer / dialog portal (rendered outside normal flow) */
  modal?: ReactNode;
}

export function CrudLayout({
  icon,
  title,
  subtitle,
  actions,
  toolbar,
  table,
  pagination,
  modal,
}: CrudLayoutProps) {
  return (
    <section className="space-y-5">
      {/* Header */}
      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />

      {/* Toolbar row */}
      {toolbar && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: [0.4, 0, 0.2, 1] as const }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          {toolbar}
        </motion.div>
      )}

      {/* Table / list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
      >
        {table}
      </motion.div>

      {/* Pagination */}
      {pagination && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="flex justify-center"
        >
          {pagination}
        </motion.div>
      )}

      {/* Modal / drawer portal */}
      {modal}
    </section>
  );
}
