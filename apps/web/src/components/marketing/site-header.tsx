"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useThemeSwitch } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [{ href: "/how-it-works", label: "How it works" }];

export function SiteHeader() {
  const pathname = usePathname();
  const { isDark, toggle } = useThemeSwitch();

  return (
    // Solid, with a hairline rule. No backdrop blur.
    <header className="sticky top-0 z-40 border-b border-hairline bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="font-display text-[1.375rem] leading-none tracking-h3 transition-opacity hover:opacity-70"
        >
          Regulars
        </Link>

        <nav aria-label="Main" className="ml-auto flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Hidden on the narrowest screens so the wordmark, theme
                  // toggle and CTA still fit at 320px; the footer carries it.
                  "hidden rounded-md px-3 py-2 text-sm transition-colors duration-150 ease-ui sm:block",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="ml-1 rounded-md p-2 text-muted-foreground transition-colors duration-150 ease-ui hover:text-foreground"
          >
            {isDark ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </button>

          <Button asChild size="sm" className="ml-1 rounded-full sm:ml-2">
            <Link href="/t">Open the app</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
