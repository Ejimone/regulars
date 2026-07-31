"use client";

import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenants } from "@/lib/api/queries";

const LAST_WORKSPACE_KEY = "regulars:last-workspace";

// Read once on the client; localStorage doesn't exist during SSR, so the server
// snapshot is null and the value arrives with hydration.
const emptySubscribe = () => () => {};

export default function WorkspacePickerPage() {
  const { data: tenants, isPending, isError, refetch } = useTenants();
  const lastSlug = useSyncExternalStore(
    emptySubscribe,
    () => window.localStorage.getItem(LAST_WORKSPACE_KEY),
    () => null
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[46rem] flex-col justify-center px-4 sm:px-6 py-20">
      <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
        Regulars
      </p>
      <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-normal tracking-h1">
        Choose a workspace.
      </h1>

      {isPending && (
        <div className="mt-10 space-y-3" aria-label="Loading workspaces">
          <Skeleton className="h-[4.5rem] w-full rounded-xl" />
          <Skeleton className="h-[4.5rem] w-full rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="mt-8 max-w-[46ch]">
          <p className="text-[15px] leading-[1.6] text-muted-foreground">
            The Regulars API isn&apos;t responding. Start it with{" "}
            <code className="font-mono text-[13px] text-foreground">make dev-api</code>{" "}
            and try again.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* The old redirect shim spun forever here; an empty list is a real state. */}
      {!isPending && !isError && tenants?.length === 0 && (
        <div className="mt-8 max-w-[46ch]">
          <p className="text-[15px] leading-[1.6] text-muted-foreground">
            There are no workspaces in this database yet. Run{" "}
            <code className="font-mono text-[13px] text-foreground">make seed</code> to
            load the two sample businesses.
          </p>
        </div>
      )}

      {!isPending && !isError && tenants && tenants.length > 0 && (
        <ul className="mt-10 space-y-3">
          {tenants.map((tenant) => (
            <li key={tenant.slug}>
              <Link
                href={`/t/${tenant.slug}/inbox`}
                className="group flex items-center gap-4 rounded-xl border border-hairline bg-card p-5 transition-colors duration-150 ease-ui hover:bg-surface-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
                  <Store className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-medium">
                      {tenant.name}
                    </span>
                    {tenant.slug === lastSlug && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Last opened
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground capitalize">
                    {tenant.vertical.replace("_", " ")}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-ui group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        <Link
          href="/"
          className="underline-offset-4 transition-colors duration-150 ease-ui hover:text-foreground hover:underline"
        >
          Back to the site
        </Link>
      </p>
    </div>
  );
}
