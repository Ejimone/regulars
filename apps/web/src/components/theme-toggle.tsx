"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const emptySubscribe = () => () => {};

export function useThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  // true after hydration, false during SSR — avoids a theme-icon mismatch flash
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isDark = mounted ? resolvedTheme === "dark" : true;
  return { isDark, toggle: () => setTheme(isDark ? "light" : "dark") };
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // true after hydration, false during SSR — avoids a theme-icon mismatch flash
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted ? resolvedTheme === "dark" : true;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light theme" : "Dark theme"}</TooltipContent>
    </Tooltip>
  );
}
