"use client";

import { ChannelIcon } from "@/components/channel-icon";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import type { MessageListItem } from "@/lib/api/client";
import { formatAuthor, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MessageList({
  items,
  selectedId,
  onSelect,
}: {
  items: MessageListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        Nothing here.
      </p>
    );
  }
  return (
    <ul>
      {items.map((m) => (
        <li key={m.id}>
          <button
            onClick={() => onSelect(m.id)}
            className={cn(
              "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
              selectedId === m.id && "bg-muted"
            )}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <ChannelIcon channel={m.channel} className="size-3.5 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {formatAuthor(m.channel, m.author_name).name}
                    {m.rating != null && (
                      <StarRating rating={m.rating} className="ml-1.5" />
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(m.received_at)}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                  {m.preview}
                </span>
                <span className="mt-1.5 block">
                  <StatusBadge status={m.status} />
                </span>
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
