import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-dvh">
      <div className="hidden w-56 shrink-0 flex-col gap-3 border-r p-4 md:flex">
        <Skeleton className="h-8 w-full" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      </div>
      <div className="flex w-full max-w-sm shrink-0 flex-col gap-2 border-r p-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="hidden min-w-0 flex-1 flex-col gap-4 p-8 lg:flex">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
