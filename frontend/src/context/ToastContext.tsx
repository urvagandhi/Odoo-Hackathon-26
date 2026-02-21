/**
 * ToastContext — React context object only.
 * Fast-refresh safe: this file exports only a single non-component value.
 */
import { createContext } from "react";
import type { ToastContextValue } from "./toastTypes";

export const ToastContext = createContext<ToastContextValue | null>(null);
