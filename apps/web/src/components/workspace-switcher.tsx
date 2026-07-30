"use client";

import { ArrowCounterClockwise, ArrowSquareOut, CaretUpDown, Check, Storefront } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { api, type Tenant } from "@/lib/api/client";
import { useTenants } from "@/lib/api/queries";

export function WorkspaceSwitcher({ slug }: { slug: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: tenants } = useTenants();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const current: Tenant | undefined = tenants?.find((t) => t.slug === slug);

  const restore = async () => {
    setResetting(true);
    try {
      const { data } = await api.POST("/api/tenants/{slug}/reset", {
        params: { path: { slug } },
      });
      if (!data?.ok) throw new Error("reset failed");
      // Every message and draft UUID changed — drop the whole cache.
      queryClient.clear();
      router.replace(`/t/${slug}/inbox`);
      toast.add({
        title: "Sample data restored",
        description: `${data.messages} messages and ${data.documents} documents rebuilt.`,
        type: "success",
      });
      setResetOpen(false);
    } catch {
      toast.add({
        title: "Couldn't restore sample data",
        description: "The workspace was left untouched. Try again.",
        type: "error",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              size="lg"
              className="data-[popup-open]:bg-sidebar-accent"
              aria-label="Switch workspace"
            />
          }
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Storefront weight="fill" className="size-4" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">
              {current?.name ?? "Loading…"}
            </span>
            <span className="truncate text-xs text-muted-foreground capitalize">
              {current?.vertical.replace("_", " ") ?? ""}
            </span>
          </span>
          <CaretUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {tenants?.map((t) => (
            <DropdownMenuItem
              key={t.slug}
              onClick={() => router.push(`/t/${t.slug}/inbox`)}
            >
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              {t.slug === slug && <Check className="size-4 text-primary" aria-hidden />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.open(`/contact/${slug}`, "_blank", "noopener")}
          >
            <ArrowSquareOut aria-hidden />
            Public contact page
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <ArrowCounterClockwise aria-hidden />
            Restore sample data…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              This rebuilds {current?.name ?? "this workspace"} from its source
              snapshot. Replies you&apos;ve sent and edits you&apos;ve made here will be
              cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={(event) => {
                event.preventDefault();
                void restore();
              }}
            >
              {resetting ? "Restoring…" : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
