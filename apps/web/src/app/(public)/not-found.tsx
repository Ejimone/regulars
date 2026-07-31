/**
 * Scoped 404 for public pages. The root not-found points into the operator
 * dashboard, which is the wrong destination for a customer who mistyped a
 * contact-page URL.
 */
export default function PublicNotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-[46rem] flex-col justify-center px-4 sm:px-6 py-20">
      <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
        Page not found
      </p>
      <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-normal tracking-h1">
        This contact page doesn&apos;t exist.
      </h1>
      <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.6] text-muted-foreground">
        The link may be mistyped, or the business may no longer use Regulars. If you were
        trying to reach a business, try their website or social profile directly.
      </p>
    </div>
  );
}
