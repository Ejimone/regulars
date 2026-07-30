"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useTenants } from "@/lib/api/queries";

export default function Home() {
  const router = useRouter();
  const { data: tenants, isError } = useTenants();

  useEffect(() => {
    if (!tenants || tenants.length === 0) return;
    const last = window.localStorage.getItem("regulars:last-workspace");
    const target = tenants.find((t) => t.slug === last) ?? tenants[0];
    router.replace(`/t/${target.slug}/inbox`);
  }, [tenants, router]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3">
      {isError ? (
        <>
          <h1 className="text-lg font-semibold tracking-tight">Can&apos;t reach the server</h1>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            The Regulars API isn&apos;t responding. Start it and reload this page.
          </p>
        </>
      ) : (
        <Spinner className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}
