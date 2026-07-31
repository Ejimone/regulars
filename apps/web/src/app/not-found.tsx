import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[46rem] flex-col justify-center px-4 sm:px-6 py-20">
      <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
        Page not found
      </p>
      <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-normal tracking-h1">
        That page doesn&apos;t exist.
      </h1>
      <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.6] text-muted-foreground">
        The link may be mistyped, or the page may have moved.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Button asChild className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/t">Open the app</Link>
        </Button>
      </div>
    </div>
  );
}
