"use client";

import type { Icon } from "@phosphor-icons/react";
import { Books, ChartBar, MagnifyingGlass, Tray } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useStats } from "@/lib/api/queries";

const NAV: { title: string; segment: string; Icon: Icon }[] = [
  { title: "Inbox", segment: "inbox", Icon: Tray },
  { title: "Knowledge", segment: "knowledge", Icon: Books },
  { title: "Overview", segment: "overview", Icon: ChartBar },
];

export function AppSidebar({
  slug,
  onOpenCommandMenu,
}: {
  slug: string;
  onOpenCommandMenu: () => void;
}) {
  const pathname = usePathname();
  const { data: stats } = useStats(slug);
  const attention = stats ? stats.by_status.new + stats.by_status.flagged : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceSwitcher slug={slug} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ title, segment, Icon: NavIcon }) => {
                const href = `/t/${slug}/${segment}`;
                const active = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={segment}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={title}
                      render={<Link href={href} />}
                    >
                      <NavIcon weight={active ? "fill" : "regular"} aria-hidden />
                      <span>{title}</span>
                    </SidebarMenuButton>
                    {segment === "inbox" && attention > 0 && (
                      <SidebarMenuBadge className="tabular-nums">
                        {attention}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onOpenCommandMenu} tooltip="Command menu">
              <MagnifyingGlass aria-hidden />
              <span className="flex-1">Search</span>
              <KbdGroup className="group-data-[collapsible=icon]:hidden">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center justify-between px-1 group-data-[collapsible=icon]:justify-center">
            <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              Theme
            </span>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
