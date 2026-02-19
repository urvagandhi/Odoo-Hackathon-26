/**
 * ToastContainer — renders all active toast notifications.
 *
 * Mounted once at the app root (inside <ToastProvider>).
 * Positioned bottom-right, stacked vertically with gap.
 * Uses AnimatePresence for smooth enter/exit animations.
 */
import { AnimatePresence } from "framer-motion";
import { useToast } from "../../hooks/useToast";
import { Toast } from "./Toast";

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3 items-end pointer-events-none"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
