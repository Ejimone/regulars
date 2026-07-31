import { cn } from "@/lib/utils";

/**
 * Inline SVG marks against the --chart-* tokens. No chart library: the Overview
 * needs three shapes, and StatsOut carries no time series to plot.
 */

/** A two-segment share bar. `value` is the leading share, 0–1. */
export function ShareBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <svg
      viewBox="0 0 100 3"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${pct}%`}
      className={cn("h-2.5 w-full overflow-hidden rounded-full", className)}
    >
      <rect x="0" y="0" width="100" height="3" fill="var(--chart-4)" />
      <rect
        x="0"
        y="0"
        width={Math.max(value * 100, 1)}
        height="3"
        fill="var(--chart-1)"
      />
    </svg>
  );
}

/** A horizontal category bar, drawn to a shared max so rows compare. */
export function BarRow({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const ratio = max > 0 ? value / max : 0;
  return (
    <svg
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${value}`}
      className="h-3.5 w-full"
      shapeRendering="crispEdges"
    >
      <rect
        x="0"
        y="0"
        width={value === 0 ? 0 : Math.max(ratio * 100, 0.8)}
        height="6"
        fill="var(--chart-1)"
        rx="0.6"
      />
    </svg>
  );
}
