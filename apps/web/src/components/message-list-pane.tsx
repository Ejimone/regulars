"use client";

import { ArrowsClockwise, CaretLeft, CaretRight, MagnifyingGlass, Tray } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MessageRow } from "@/components/message-row";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHotkey } from "@/hooks/use-hotkeys";
import { MESSAGE_STATUSES, STATUS_META } from "@/lib/status";
import { PAGE_SIZE, useMessages, useStats } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

export function MessageListPane({
  slug,
  activeMessageId,
  className,
}: {
  slug: string;
  activeMessageId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [searchInput, setSearchInput] = useState(q);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const messagesQuery = useMessages(slug, {
    status: status || undefined,
    q: q || undefined,
    page,
  });
  const { data: stats } = useStats(slug);

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(`/t/${slug}/inbox${activeMessageId ? `/${activeMessageId}` : ""}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  };

  // Debounce the search box into the URL; changing the query resets the page.
  useEffect(() => {
    if (searchInput === q) return;
    const handle = setTimeout(() => {
      setParams({ q: searchInput || null, page: null });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useHotkey("/", (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });

  const focusRow = (direction: 1 | -1) => {
    const rows = Array.from(
      listRef.current?.querySelectorAll<HTMLAnchorElement>("[data-message-row]") ?? []
    );
    if (rows.length === 0) return;
    const current = rows.findIndex((row) => row === document.activeElement);
    const next =
      current === -1
        ? direction === 1
          ? 0
          : rows.length - 1
        : Math.min(Math.max(current + direction, 0), rows.length - 1);
    rows[next]?.focus();
  };
  useHotkey("j", () => focusRow(1));
  useHotkey("k", () => focusRow(-1));

  const { data, isPending, isError, refetch, isFetching } = messagesQuery;
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const hasPrev = page > 1;
  const hasNext = to < total;

  const countFor = (s: string) => stats?.by_status[s];

  const detailPath = (id: string) => {
    const qs = searchParams.toString();
    return `/t/${slug}/inbox/${id}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="shrink-0 space-y-2.5 border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-semibold tracking-tight">Inbox</h1>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Refresh"
            onClick={() => void refetch()}
          >
            <ArrowsClockwise className={cn(isFetching && "animate-spin")} aria-hidden />
          </Button>
        </div>
        <div className="relative">
          <MagnifyingGlass
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search messages"
            placeholder="Search messages"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Tabs
          value={status || "all"}
          onValueChange={(value) =>
            setParams({ status: value === "all" ? null : (value as string), page: null })
          }
        >
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="all">
              All
              {stats && (
                <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                  {stats.messages_total}
                </span>
              )}
            </TabsTrigger>
            {MESSAGE_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {STATUS_META[s].shortLabel}
                {countFor(s) != null && countFor(s)! > 0 && (
                  <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                    {countFor(s)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyTitle>Couldn&apos;t load messages</EmptyTitle>
              <EmptyDescription>
                Something went wrong talking to the server.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </Empty>
        ) : data && data.items.length === 0 ? (
          <Empty className="h-full">
            <EmptyMedia variant="icon">
              <Tray aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{q ? "No matches" : "You're all caught up"}</EmptyTitle>
              <EmptyDescription>
                {q
                  ? `No messages match "${q}".`
                  : status
                    ? `Nothing with the “${STATUS_META[status as keyof typeof STATUS_META]?.label ?? status}” status right now.`
                    : "New reviews, DMs, and messages land here."}
              </EmptyDescription>
            </EmptyHeader>
            {q && (
              <Button variant="outline" size="sm" onClick={() => setSearchInput("")}>
                Clear search
              </Button>
            )}
          </Empty>
        ) : (
          <ul ref={listRef} aria-label="Messages">
            {data?.items.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                href={detailPath(message.id)}
                active={message.id === activeMessageId}
              />
            ))}
          </ul>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex shrink-0 items-center justify-between border-t px-3 py-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {from}–{to} of {total}
          </span>
          <span className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Previous page"
              disabled={!hasPrev}
              onClick={() => setParams({ page: String(page - 1) })}
            >
              <CaretLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Next page"
              disabled={!hasNext}
              onClick={() => setParams({ page: String(page + 1) })}
            >
              <CaretRight aria-hidden />
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
