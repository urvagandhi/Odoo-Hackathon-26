/**
 * useToast — hook to access the toast notification system.
 * Fast-refresh safe: this file exports only a single hook function.
 *
 * Usage:
 *   import { useToast } from "@/hooks/useToast";
 *   const toast = useToast();
 *   toast.success("Saved!");
 *   toast.error("Failed.", { title: "Error" });
 */
import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";
import type { ToastContextValue } from "../context/toastTypes";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used inside <ToastProvider>");
  return ctx;
}
