"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  // true after hydration, false during SSR — avoids a theme-icon mismatch flash
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isDark = mounted ? resolvedTheme === "dark" : false;
  return { isDark, toggle: () => setTheme(isDark ? "light" : "dark") };
}
