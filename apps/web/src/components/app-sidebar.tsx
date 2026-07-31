"use client";

import type { LucideIcon } from "lucide-react";
import { Library, ChartColumn, Search, Moon, Settings, Sun, Inbox } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useThemeSwitch } from "@/components/theme-toggle";
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

const NAV: { title: string; segment: string; Icon: LucideIcon }[] = [
  { title: "Inbox", segment: "inbox", Icon: Inbox },
  { title: "Knowledge", segment: "knowledge", Icon: Library },
  { title: "Overview", segment: "overview", Icon: ChartColumn },
  { title: "Settings", segment: "settings", Icon: Settings },
];

function ThemeMenuItem() {
  const { isDark, toggle } = useThemeSwitch();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggle} tooltip="Toggle theme">
        {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
        <span>{isDark ? "Light theme" : "Dark theme"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

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
                    <SidebarMenuButton isActive={active} tooltip={title} asChild>
                      <Link href={href}>
                        <NavIcon aria-hidden />
                        <span>{title}</span>
                      </Link>
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
              <Search aria-hidden />
              <span>Search</span>
              <KbdGroup className="ml-auto group-data-[collapsible=icon]:hidden">
                <Kbd>⌘K</Kbd>
              </KbdGroup>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <ThemeMenuItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
