"use client";

import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  Library,
  ChartColumn,
  Moon,
  Settings,
  Store,
  Sun,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTenants } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  label: string;
  hint?: string;
  Icon: LucideIcon;
  run: () => void;
};

export function CommandMenu({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: tenants } = useTenants();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const actions = useMemo<Action[]>(() => {
    const go = (path: string) => () => {
      onOpenChange(false);
      router.push(path);
    };
    const items: Action[] = [
      { id: "inbox", label: "Go to Inbox", Icon: Inbox, run: go(`/t/${slug}/inbox`) },
      { id: "knowledge", label: "Go to Knowledge", Icon: Library, run: go(`/t/${slug}/knowledge`) },
      { id: "overview", label: "Go to Overview", Icon: ChartColumn, run: go(`/t/${slug}/overview`) },
      { id: "settings", label: "Go to Settings", Icon: Settings, run: go(`/t/${slug}/settings`) },
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        Icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          onOpenChange(false);
        },
      },
    ];
    for (const t of tenants ?? []) {
      if (t.slug !== slug) {
        items.push({
          id: `switch-${t.slug}`,
          label: `Switch to ${t.name}`,
          hint: "Workspace",
          Icon: Store,
          run: go(`/t/${t.slug}/inbox`),
        });
      }
    }
    items.push({
      id: "contact",
      label: "Open your contact page",
      hint: "New tab",
      Icon: ExternalLink,
      run: () => {
        window.open(`/contact/${slug}`, "_blank", "noopener");
        onOpenChange(false);
      },
    });
    return items;
  }, [slug, tenants, resolvedTheme, setTheme, router, onOpenChange]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(needle));
  }, [actions, query]);

  // Clamp instead of resetting in an effect; query/open changes reset via handlers.
  const clampedIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("");
      setActiveIndex(0);
    }
    onOpenChange(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(clampedIndex + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(clampedIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[clampedIndex]?.run();
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${clampedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [clampedIndex]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <div className="border-b p-2">
          <Input
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={listboxId}
            aria-activedescendant={
              filtered[clampedIndex] ? `${listboxId}-${filtered[clampedIndex].id}` : undefined
            }
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Commands"
          className="max-h-72 overflow-y-auto p-1"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No commands match &ldquo;{query}&rdquo;
            </li>
          )}
          {filtered.map((action, index) => (
            <li
              key={action.id}
              id={`${listboxId}-${action.id}`}
              data-index={index}
              role="option"
              aria-selected={index === clampedIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => action.run()}
              className={cn(
                "flex cursor-default items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                index === clampedIndex && "bg-accent text-accent-foreground"
              )}
            >
              <action.Icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{action.label}</span>
              {action.hint && (
                <span className="text-xs text-muted-foreground">{action.hint}</span>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
