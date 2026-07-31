"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useRef } from "react";

import type { Citation } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function CitationsPanel({
  citations,
  refused,
  active,
}: {
  citations: Citation[];
  refused: boolean;
  /** Citation number currently hovered/focused in the draft text. */
  active: number | null;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (active == null) return;
    ref.current
      ?.querySelector(`#citation-${active}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <aside
      ref={ref}
      aria-label="Retrieved facts"
      className="w-full shrink-0 space-y-2 xl:w-[280px]"
    >
      <h3 className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
        Retrieved facts
      </h3>
      {refused ? (
        <div className="rounded-lg border border-status-flagged/30 bg-status-flagged/10 p-3 text-xs leading-relaxed text-status-flagged">
          <ShieldAlert className="mb-1.5 size-4" aria-hidden />
          The knowledge base doesn&apos;t cover this confidently, so no facts were
          used. The draft asks for time instead of guessing.
        </div>
      ) : citations.length === 0 ? (
        <p className="text-xs text-muted-foreground">No facts retrieved.</p>
      ) : (
        citations.map((c) => (
          <div
            key={c.n}
            id={`citation-${c.n}`}
            className={cn(
              "rounded-lg border p-2.5 text-xs leading-snug transition-all",
              c.cited ? "border-primary/25 bg-primary/5" : "opacity-55",
              active === c.n && "ring-2 ring-ring"
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono font-semibold text-primary">[{c.n}]</span>
              {!c.cited && (
                <span className="text-[10px] text-muted-foreground">
                  retrieved, unused
                </span>
              )}
            </div>
            <p className="line-clamp-6 whitespace-pre-wrap">{c.text}</p>
          </div>
        ))
      )}
    </aside>
  );
}
