/**
 * ToastProvider — global toast state provider component.
 * Fast-refresh safe: this file exports only a single component.
 */
import {
  useCallback,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { ToastContext } from "./ToastContext";
import {
  DEFAULT_DURATIONS,
  type ToastItem,
  type ToastOptions,
  type ToastVariant,
} from "./toastTypes";

// ── Reducer ────────────────────────────────────────────────────

type Action =
  | { type: "ADD"; toast: ToastItem }
  | { type: "DISMISS"; id: string }
  | { type: "DISMISS_ALL" };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD":
      return [...state.slice(-4), action.toast]; // max 5 visible
    case "DISMISS":
      return state.filter((t) => t.id !== action.id);
    case "DISMISS_ALL":
      return [];
    default:
      return state;
  }
}

// ── Provider ───────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    dispatch({ type: "DISMISS", id });
  }, []);

  const dismissAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    dispatch({ type: "DISMISS_ALL" });
  }, []);

  const addToast = useCallback(
    (variant: ToastVariant, message: string, options: ToastOptions = {}): string => {
      const id = `toast-${crypto.randomUUID()}`;
      const duration = options.duration ?? DEFAULT_DURATIONS[variant];
      const toast: ToastItem = { id, variant, message, title: options.title, duration };
      dispatch({ type: "ADD", toast });
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (m: string, o?: ToastOptions) => addToast("success", m, o),
    [addToast]
  );
  const error = useCallback(
    (m: string, o?: ToastOptions) => addToast("error", m, o),
    [addToast]
  );
  const warning = useCallback(
    (m: string, o?: ToastOptions) => addToast("warning", m, o),
    [addToast]
  );
  const info = useCallback(
    (m: string, o?: ToastOptions) => addToast("info", m, o),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, success, error, warning, info, dismiss, dismissAll }}
    >
      {children}
    </ToastContext.Provider>
  );
}
