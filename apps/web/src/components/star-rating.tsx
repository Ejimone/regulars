import { Star } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  className,
}: {
  /** 1–5 */
  rating: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cn("inline-flex items-center gap-px align-text-bottom", className)}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          weight={i < rating ? "fill" : "regular"}
          className={cn(
            "size-3",
            i < rating ? "text-status-flagged" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}
