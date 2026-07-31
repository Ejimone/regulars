"use client";

import { Check, ChevronsUpDown, Store } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { type Tenant } from "@/lib/api/client";
import { useTenants } from "@/lib/api/queries";

/**
 * Switches workspaces, and nothing else. Restoring sample data and opening the
 * public contact page both live in Settings — a reset control in the primary
 * navigation makes the whole product read as a sandbox.
 */
export function WorkspaceSwitcher({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: tenants } = useTenants();

  const current: Tenant | undefined = tenants?.find((t) => t.slug === slug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent"
          aria-label="Switch workspace"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
            <Store className="size-4" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">
              {current?.name ?? "Loading…"}
            </span>
            <span className="truncate text-xs text-muted-foreground capitalize">
              {current?.vertical.replace("_", " ") ?? ""}
            </span>
          </span>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {tenants?.map((t) => (
          <DropdownMenuItem key={t.slug} onClick={() => router.push(`/t/${t.slug}/inbox`)}>
            <span className="min-w-0 flex-1 truncate">{t.name}</span>
            {t.is_sample && (
              <Badge variant="outline" className="shrink-0 text-muted-foreground">
                Sample
              </Badge>
            )}
            {t.slug === slug && <Check className="size-4 text-primary" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
