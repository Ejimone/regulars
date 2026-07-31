"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll reveal. The animation itself lives in globals.css on [data-reveal];
 * this only flips the `data-revealed` attribute once, so reduced-motion users
 * get the final state even before hydration.
 */
export function Reveal({
  index = 0,
  as = "div",
  className,
  children,
}: {
  /** Stagger position within its group; each step adds 70ms. */
  index?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
  children: React.ReactNode;
}) {
  // Widened to ElementType so the ref isn't typed as the intersection of every
  // allowed tag's element.
  const Tag = as as React.ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-revealed", "");
        observer.disconnect(); // fire once
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={cn(className)}
      style={{ "--reveal-index": index } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
