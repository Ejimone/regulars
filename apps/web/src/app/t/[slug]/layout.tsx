"use client";

import { SmileyXEyes } from "@phosphor-icons/react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTenants } from "@/lib/api/queries";
import { useHotkey } from "@/hooks/use-hotkeys";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: tenants, isError } = useTenants();
  const [commandOpen, setCommandOpen] = useState(false);

  useHotkey("k+meta", (e) => {
    e.preventDefault();
    setCommandOpen((open) => !open);
  });

  useEffect(() => {
    if (tenants?.some((t) => t.slug === slug)) {
      window.localStorage.setItem("regulars:last-workspace", slug);
    }
  }, [tenants, slug]);

  if (tenants && !tenants.some((t) => t.slug === slug)) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <SmileyXEyes className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Workspace not found</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            There&apos;s no workspace named &ldquo;{slug}&rdquo;.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/" />}>
          Go to your inbox
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Can&apos;t reach the server</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The Regulars API isn&apos;t responding. Check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar slug={slug} onOpenCommandMenu={() => setCommandOpen(true)} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-medium">Regulars</span>
        </div>
        {children}
      </SidebarInset>
      <CommandMenu slug={slug} open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
