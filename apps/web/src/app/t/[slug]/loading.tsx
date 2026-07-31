import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matched to the real chrome: a 16rem sidebar (SIDEBAR_WIDTH) and a list pane
 * that steps 340px → 380px, not the w-56 / max-w-sm it used to guess at.
 */
export default function Loading() {
  return (
    <div className="flex h-dvh">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-hairline p-4 md:flex">
        <Skeleton className="h-12 w-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      </div>
      <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 border-r border-hairline p-3 lg:w-[340px] xl:w-[380px]">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="hidden min-w-0 flex-1 flex-col gap-4 p-6 lg:flex">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
