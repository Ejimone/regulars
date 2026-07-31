"use client";

import { toast as sonnerToast } from "sonner";

export { Toaster } from "./sonner";

type ToastType = "success" | "error" | "info" | "warning" | "loading";

type ToastArgs = {
  title: string;
  description?: string;
  type?: ToastType;
};

/**
 * Compat surface over sonner. Radix has no imperative toast manager, so the
 * `toast.add({ title, description, type })` shape used across the app is kept
 * here rather than rewritten at every call site.
 */
export const toast = {
  add: ({ title, description, type = "info" }: ToastArgs) =>
    sonnerToast[type](title, { description }),
};
