import { Star } from "lucide-react";

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
          // lucide stars are stroked outlines; filling with currentColor is what
          // distinguishes earned from unearned. The aria-label above carries the
          // value for anyone who can't see the difference.
          fill={i < rating ? "currentColor" : "none"}
          strokeWidth={1.75}
          className={cn("size-3", i < rating ? "text-rating" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}
