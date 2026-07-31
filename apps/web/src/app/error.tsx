"use client";

import { RotateCcw, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <CircleAlert className="size-8 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.digest
            ? `An unexpected error occurred (ref ${error.digest}).`
            : "An unexpected error occurred."}{" "}
          Your data is safe.
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        <RotateCcw />
        Try again
      </Button>
    </div>
  );
}
