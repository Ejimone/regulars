"use client";

import Link from "next/link";

import { ChannelIcon } from "@/components/channel-icon";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { MessageListItem } from "@/lib/api/client";
import { formatAuthor, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MessageRow({
  message,
  href,
  active,
}: {
  message: MessageListItem;
  href: string;
  active: boolean;
}) {
  const author = formatAuthor(message.channel, message.author_name);
  const isNew = message.status === "new";

  return (
    <li className="relative">
      {isNew && (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
        />
      )}
      <Link
        href={href}
        data-message-row
        aria-current={active ? "page" : undefined}
        className={cn(
          "block border-b px-4 py-3 outline-none transition-colors",
          "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
          active && "bg-muted"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3">
            <ChannelIcon channel={message.channel} className="size-3.5 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "flex min-w-0 items-baseline gap-1.5 truncate text-sm",
                  isNew ? "font-semibold" : "font-medium"
                )}
              >
                <span className="truncate">{author.name}</span>
                {author.detail && (
                  <span className="shrink-0 font-mono text-xs font-normal text-muted-foreground">
                    {author.detail}
                  </span>
                )}
                {message.rating != null && (
                  <StarRating rating={message.rating} className="shrink-0" />
                )}
              </span>
              <time
                dateTime={message.received_at}
                className="shrink-0 text-xs tabular-nums text-muted-foreground"
              >
                {timeAgo(message.received_at)}
              </time>
            </span>
            <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
              {message.preview}
            </span>
            <span className="mt-1.5 flex items-center gap-1.5">
              <StatusBadge status={message.status} />
              {message.decision === "refused" && (
                <Badge variant="outline" className="text-muted-foreground">
                  Needs facts
                </Badge>
              )}
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}
