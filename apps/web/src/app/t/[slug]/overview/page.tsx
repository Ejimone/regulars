"use client";

import { ChartBar } from "@phosphor-icons/react";
import { use } from "react";

import { StatTile } from "@/components/stat-tile";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CHANNELS, CHANNEL_META } from "@/lib/channels";
import { formatLatency, formatPercent } from "@/lib/format";
import { useStats } from "@/lib/api/queries";

export default function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: stats, isPending } = useStats(slug);

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!stats) return null;

  if (stats.messages_total === 0) {
    return (
      <Empty className="h-full">
        <EmptyMedia variant="icon">
          <ChartBar aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Activity appears here once messages arrive.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const decisions = stats.drafted + stats.refused;
  const draftedShare = decisions > 0 ? stats.drafted / decisions : 0;
  const maxChannel = Math.max(...CHANNELS.map((c) => stats.by_channel[c] ?? 0), 1);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <h1 className="text-lg font-semibold tracking-tight">Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Messages" value={String(stats.messages_total)} />
        <StatTile
          label="Awaiting review"
          value={String(stats.by_status.new + stats.by_status.flagged)}
          detail="New and flagged messages"
        />
        <StatTile
          label="Replies sent"
          value={String(stats.sends)}
          detail={
            stats.sends > 0 && stats.edit_rate != null
              ? `${formatPercent(stats.edit_rate)} edited before sending`
              : undefined
          }
        />
        <StatTile
          label="Avg draft speed"
          value={stats.avg_latency_ms != null ? formatLatency(stats.avg_latency_ms) : "—"}
          detail={
            stats.avg_confidence != null
              ? `${formatPercent(stats.avg_confidence)} avg confidence`
              : undefined
          }
        />
      </div>

      {decisions > 0 && (
        <section aria-label="Draft outcomes" className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Draft outcomes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Whether the latest draft for each message answered from the knowledge
            base or asked for time.
          </p>
          <div className="mt-3 flex h-4 w-full gap-0.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-l-full bg-primary"
              style={{ width: `${Math.max(draftedShare * 100, 2)}%` }}
            />
            <div
              className="h-full flex-1 rounded-r-full bg-muted-foreground/30"
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatPercent(draftedShare)} grounded
            </span>{" "}
            ({stats.drafted}) · {formatPercent(1 - draftedShare)} needed facts (
            {stats.refused})
          </p>
        </section>
      )}

      <section aria-label="Messages by channel" className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Channels</h2>
        <ul className="mt-3 space-y-3">
          {CHANNELS.map((channel) => {
            const { label, Icon } = CHANNEL_META[channel];
            const count = stats.by_channel[channel] ?? 0;
            return (
              <li key={channel} className="flex items-center gap-3">
                <span className="flex w-36 shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-4" aria-hidden />
                  {label}
                </span>
                <span className="h-3.5 min-w-0 flex-1">
                  <span
                    className="block h-full rounded-r-sm bg-primary"
                    style={{ width: `${(count / maxChannel) * 100}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-sm tabular-nums">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
