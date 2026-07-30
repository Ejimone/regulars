"use client";

import { Fragment } from "react";

/** Render draft text with [n] citation markers as focusable chips that drive
 * the citations panel highlight (hover or keyboard focus). */
export function DraftText({
  text,
  onActivate,
}: {
  text: string;
  onActivate: (n: number | null) => void;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const n = Number(match[1]);
        return (
          <button
            key={i}
            type="button"
            aria-label={`Source ${n}`}
            aria-describedby={`citation-${n}`}
            onMouseEnter={() => onActivate(n)}
            onMouseLeave={() => onActivate(null)}
            onFocus={() => onActivate(n)}
            onBlur={() => onActivate(null)}
            className="mx-0.5 inline-flex size-4 -translate-y-1 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {n}
          </button>
        );
      })}
    </p>
  );
}
