import { cn } from "@/lib/utils";

/** Marketing container. One max-width and one gutter for the whole site. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}

/** Marketing section rhythm. Deliberately looser than anything in the app. */
export function Section({
  className,
  bleed,
  children,
  ...props
}: React.ComponentProps<"section"> & { bleed?: boolean }) {
  return (
    <section
      className={cn("py-24 md:py-32", bleed && "bg-surface-1", className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Eyebrow. Positive tracking and sentence case — the counter-move against the
 * display type's negative tracking. Never all-caps.
 */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[13px] font-medium tracking-eyebrow text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Section heading: serif, weight 400, size does the work. */
export function SectionTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn(
        "font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.05] font-normal tracking-h1 text-balance",
        className
      )}
    >
      {children}
    </h2>
  );
}

/** Marketing body copy. Measure capped so lines stay readable. */
export function Lede({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "max-w-[62ch] text-[17px] leading-[1.65] tracking-body text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}
