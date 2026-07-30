"use client";

import {
  Check,
  Loader2,
  Pencil,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";

import { ChannelIcon } from "@/components/channel-icon";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  type Citation,
  type MessageDetail as Detail,
} from "@/lib/api/client";
import { streamDraft, type DraftMeta } from "@/lib/api/sse";
import { CHANNEL_LABEL, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Phase = "loading" | "idle" | "drafting" | "streaming" | "ready";

/** Render draft text with [n] citation markers as superscript chips. */
function DraftText({
  text,
  onHover,
}: {
  text: string;
  onHover: (n: number | null) => void;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const n = Number(match[1]);
        return (
          <sup
            key={i}
            onMouseEnter={() => onHover(n)}
            onMouseLeave={() => onHover(null)}
            className="mx-0.5 inline-flex size-4 cursor-default items-center justify-center rounded-full bg-emerald-100 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          >
            {n}
          </sup>
        );
      })}
    </p>
  );
}

function CitationsPanel({
  citations,
  refused,
  hovered,
}: {
  citations: Citation[];
  refused: boolean;
  hovered: number | null;
}) {
  return (
    <aside className="w-64 shrink-0 space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Retrieved facts
      </h3>
      {refused ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="mb-1.5 size-4" />
          The knowledge base couldn&apos;t confidently answer this, so no facts
          were used — the draft asks for time instead of guessing.
        </div>
      ) : citations.length === 0 ? (
        <p className="text-xs text-muted-foreground">No facts retrieved.</p>
      ) : (
        citations.map((c) => (
          <div
            key={c.n}
            className={cn(
              "rounded-lg border p-2.5 text-xs leading-snug transition-all",
              c.cited
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30"
                : "opacity-55",
              hovered === c.n && "ring-2 ring-emerald-400"
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                [{c.n}]
              </span>
              {!c.cited && (
                <span className="text-[10px] text-muted-foreground">
                  retrieved, unused
                </span>
              )}
            </div>
            <p className="line-clamp-6 whitespace-pre-wrap">{c.text}</p>
          </div>
        ))
      )}
    </aside>
  );
}

export function MessageDetailPane({
  messageId,
  onChanged,
}: {
  messageId: string;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [streamText, setStreamText] = useState("");
  const [meta, setMeta] = useState<DraftMeta | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentModified, setSentModified] = useState<boolean | null>(null);

  const applyDetail = useCallback((data: Detail) => {
    setDetail(data);
    if (data.draft) {
      setCitations(data.draft.citations);
      setMeta({
        status: data.status,
        decision: data.draft.decision as DraftMeta["decision"],
        confidence: data.draft.confidence,
      });
      setPhase("ready");
    } else {
      setCitations([]);
      setMeta(null);
      setPhase("idle");
    }
  }, []);

  const load = useCallback(() => {
    void api
      .GET("/api/messages/{message_id}", {
        params: { path: { message_id: messageId } },
      })
      .then(({ data }) => {
        if (data) applyDetail(data);
      });
  }, [messageId, applyDetail]);

  // Mounted with key={messageId} by the parent, so switching messages
  // remounts with fresh initial state — the effect only fetches.
  useEffect(() => {
    void api
      .GET("/api/messages/{message_id}", {
        params: { path: { message_id: messageId } },
      })
      .then(({ data }) => {
        if (data) applyDetail(data);
      });
  }, [messageId, applyDetail]);

  const runDraft = () => {
    setPhase("drafting");
    setStreamText("");
    void streamDraft(messageId, {
      onMeta: (m) => {
        setMeta(m);
        setPhase("streaming");
      },
      onDelta: (t) => setStreamText((prev) => prev + t),
      onCitations: setCitations,
      onDone: () => {
        load();
        onChanged();
      },
      onError: () => setPhase("idle"),
    });
  };

  const send = async (finalContent: string) => {
    if (!detail?.draft) return;
    setSending(true);
    const { data } = await api.POST("/api/drafts/{draft_id}/send", {
      params: { path: { draft_id: detail.draft.id } },
      body: { final_content: finalContent },
    });
    setSending(false);
    if (data?.ok) {
      setSentModified(data.was_modified);
      setEditing(false);
      void load();
      onChanged();
    }
  };

  if (phase === "loading" || !detail) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const refused = meta?.decision === "refused";
  const isSpam = detail.status === "spam";
  const draftBody =
    phase === "streaming" ? streamText : (detail.draft?.content ?? streamText);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      {/* message header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {detail.author_name}
            {detail.rating != null && (
              <span className="ml-2 text-sm font-normal text-amber-600">
                {"★".repeat(detail.rating)}
                <span className="text-muted-foreground/40">
                  {"★".repeat(5 - detail.rating)}
                </span>
              </span>
            )}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChannelIcon channel={detail.channel} className="size-3.5" />
            {CHANNEL_LABEL[detail.channel] ?? detail.channel} ·{" "}
            {timeAgo(detail.received_at)}
          </p>
        </div>
        <StatusBadge status={detail.status} />
      </header>

      {/* the customer's message */}
      <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {detail.content}
      </div>

      {/* spam: nothing to draft */}
      {isSpam && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Filtered as spam — no reply drafted, no tokens spent.
        </div>
      )}

      {/* idle: no draft yet */}
      {!isSpam && phase === "idle" && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Sparkles className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">
            No draft yet — Regulars will answer from the business&apos;s own
            knowledge base.
          </p>
          <Button onClick={runDraft}>
            <Sparkles data-icon="inline-start" /> Draft reply
          </Button>
        </div>
      )}

      {/* drafting: retrieval + generation in progress */}
      {!isSpam && phase === "drafting" && (
        <div className="flex items-center gap-3 rounded-xl border p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Reading the knowledge base and drafting…
        </div>
      )}

      {/* the draft + citations */}
      {!isSpam && (phase === "streaming" || phase === "ready") && (
        <div className="flex gap-4">
          <div className="min-w-0 flex-1 rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-600" />
                <span className="text-sm font-medium">AI draft</span>
                {refused ? (
                  <Badge
                    variant="secondary"
                    className="border-0 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  >
                    needs you
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    grounded
                  </Badge>
                )}
              </div>
              {meta && (
                <div
                  className="flex items-center gap-1.5"
                  title={`retrieval confidence ${Math.round(meta.confidence * 100)}%`}
                >
                  <span className="text-[11px] text-muted-foreground">
                    confidence
                  </span>
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        refused ? "bg-amber-400" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.round(meta.confidence * 100)}%` }}
                    />
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              {editing ? (
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={7}
                  className="text-sm"
                />
              ) : (
                <DraftText text={draftBody} onHover={setHovered} />
              )}
              {phase === "streaming" && (
                <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-emerald-500" />
              )}
            </div>

            {phase === "ready" && detail.draft && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                {detail.status === "sent" || sentModified !== null ? (
                  <p className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                    <Check className="size-4" />
                    Sent{" "}
                    {sentModified
                      ? "with your edits — saved as training signal"
                      : "as drafted"}
                  </p>
                ) : editing ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void send(editText)}
                      disabled={sending || editText.trim().length === 0}
                    >
                      <Send data-icon="inline-start" /> Send edited reply
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      <X data-icon="inline-start" /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => void send(detail.draft!.content)}
                      disabled={sending}
                    >
                      <Send data-icon="inline-start" /> Approve &amp; send
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditText(detail.draft!.content);
                        setEditing(true);
                      }}
                    >
                      <Pencil data-icon="inline-start" /> Edit
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {detail.draft.model} · {(detail.draft.latency_ms / 1000).toFixed(1)}s
                </p>
              </div>
            )}
          </div>

          <CitationsPanel
            citations={citations}
            refused={refused}
            hovered={hovered}
          />
        </div>
      )}
    </div>
  );
}
