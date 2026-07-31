"use client";

import {
  RefreshCw,
  Check,
  Copy,
  Pencil,
  PenLine,
  CircleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChannelIcon } from "@/components/channel-icon";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api, type Citation, type MessageDetail as Detail } from "@/lib/api/client";
import { streamDraft, type DraftMeta } from "@/lib/api/sse";
import { channelMeta } from "@/lib/channels";
import { formatAuthor, formatLatency, timeAgo } from "@/lib/format";
import { useHotkey } from "@/hooks/use-hotkeys";
import { cn } from "@/lib/utils";

import { CitationsPanel } from "./citations-panel";
import { DraftText } from "./draft-text";

type Phase = "loading" | "idle" | "drafting" | "streaming" | "ready" | "error";

export function MessageDetailPane({
  messageId,
  onChanged,
}: {
  messageId: string;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [stage, setStage] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [meta, setMeta] = useState<DraftMeta | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentModified, setSentModified] = useState<boolean | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const copyReply = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

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
    } else if (data.status === "spam") {
      setCitations([]);
      setMeta(null);
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
      .then(({ data, error }) => {
        if (data) applyDetail(data);
        else if (error) setPhase("error");
      });
  }, [messageId, applyDetail]);

  // Mounted with key={messageId} by the parent, so switching messages
  // remounts with fresh initial state — the effect only fetches.
  useEffect(() => {
    void api
      .GET("/api/messages/{message_id}", {
        params: { path: { message_id: messageId } },
      })
      .then(({ data, error }) => {
        if (data) applyDetail(data);
        else if (error) setPhase("error");
      });
    return () => abortRef.current?.abort();
  }, [messageId, applyDetail]);

  const runDraft = (force = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("drafting");
    setStage(null);
    setStreamText("");
    void streamDraft(
      messageId,
      {
        onStage: setStage,
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
        onError: () => {
          setPhase("error");
          toast.add({
            title: "Drafting failed",
            description: "The reply couldn't be generated. Try again.",
            type: "error",
          });
        },
      },
      { force, signal: controller.signal }
    );
  };

  const send = async (finalContent: string) => {
    if (!detail?.draft) return;
    setSending(true);
    try {
      const { data, error } = await api.POST("/api/drafts/{draft_id}/send", {
        params: { path: { draft_id: detail.draft.id } },
        body: { final_content: finalContent },
      });
      if (error || !data?.ok) throw new Error("send failed");
      setSentModified(data.was_modified);
      setEditing(false);
      toast.add({
        title: data.was_modified ? "Approved with your edits" : "Reply approved",
        type: "success",
      });
      load();
      onChanged();
    } catch {
      toast.add({
        title: "Couldn't approve the reply",
        description: "Nothing was changed. Try again.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const canSend =
    phase === "ready" &&
    detail?.draft != null &&
    detail.status !== "sent" &&
    sentModified === null &&
    !sending;

  useHotkey(
    "enter+meta",
    () => {
      if (!canSend) return;
      void send(editing ? editText : detail!.draft!.content);
    },
    canSend
  );

  if (phase === "loading" || (phase === "error" && !detail)) {
    if (phase === "error") {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <CircleAlert className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load this message.
          </p>
          <Button variant="outline" size="sm" onClick={() => load()}>
            Try again
          </Button>
        </div>
      );
    }
    return (
      <div className="space-y-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!detail) return null;

  const refused = meta?.decision === "refused";
  const isSpam = detail.status === "spam";
  const canRegenerate =
    (detail.status === "drafted" || detail.status === "flagged") && phase === "ready";
  const draftBody =
    phase === "streaming" ? streamText : (detail.draft?.content ?? streamText);
  const author = formatAuthor(detail.channel, detail.author_name);
  const confidencePct = meta ? Math.round(meta.confidence * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight">
            <span className="truncate">{author.name}</span>
            {author.detail && (
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {author.detail}
              </span>
            )}
            {detail.rating != null && <StarRating rating={detail.rating} />}
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChannelIcon channel={detail.channel} className="size-3.5" />
            {channelMeta(detail.channel).label} ·{" "}
            <time dateTime={detail.received_at}>{timeAgo(detail.received_at)}</time>
          </p>
        </div>
        <StatusBadge status={detail.status} />
      </header>

      <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {detail.content}
      </div>

      {isSpam && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Filtered — no reply needed. Spam never reaches the drafting pipeline.
        </div>
      )}

      {!isSpam && phase === "idle" && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No draft yet. The reply will be written from your knowledge base.
          </p>
          <Button onClick={() => runDraft()}>
            <PenLine aria-hidden /> Draft reply
          </Button>
        </div>
      )}

      {!isSpam && phase === "error" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm">
            <CircleAlert className="size-4 text-destructive" aria-hidden />
            The draft couldn&apos;t be generated.
          </p>
          <Button variant="outline" size="sm" onClick={() => runDraft()}>
            <RefreshCw aria-hidden /> Try again
          </Button>
        </div>
      )}

      {!isSpam && phase === "drafting" && (
        <div className="flex items-center gap-3 rounded-xl border p-6 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          {stage === "drafting"
            ? "Reading the knowledge base and drafting…"
            : "Checking for an existing draft…"}
        </div>
      )}

      {!isSpam && (phase === "streaming" || phase === "ready") && (
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="min-w-0 flex-1 self-start rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm font-medium">Draft reply</span>
                {refused ? (
                  <Badge
                    variant="secondary"
                    className="border-0 bg-status-flagged/10 text-status-flagged"
                  >
                    Needs review
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
                    Grounded
                  </Badge>
                )}
              </div>
              {meta && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Confidence</span>
                  <span
                    role="progressbar"
                    aria-label="Retrieval confidence"
                    aria-valuenow={confidencePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuetext={`${confidencePct}%`}
                    className={cn(
                      "h-1.5 w-16 overflow-hidden rounded-full",
                      refused ? "bg-status-flagged/20" : "bg-primary/20"
                    )}
                  >
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        refused ? "bg-status-flagged" : "bg-primary"
                      )}
                      style={{ width: `${confidencePct}%` }}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {confidencePct}%
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
                  aria-label="Edit the reply"
                  className="text-sm"
                />
              ) : (
                <DraftText text={draftBody} onActivate={setActiveCitation} />
              )}
              {phase === "streaming" && (
                <span
                  aria-hidden
                  className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-primary"
                />
              )}
            </div>

            {phase === "ready" && detail.draft && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
                {detail.status === "sent" || sentModified !== null ? (
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-primary">
                      <Check className="size-4" aria-hidden />
                      Approved {sentModified ? "with your edits" : "as drafted"}
                    </p>
                    {sentModified && (
                      // The edit is persisted with the reply, but nothing
                      // consumes it — so this says stored, not "learned from".
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your edit is saved with this reply.
                      </p>
                    )}
                  </div>
                ) : editing ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void send(editText)}
                      disabled={sending || editText.trim().length === 0}
                    >
                      <Check aria-hidden /> Approve edited reply
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      <X aria-hidden /> Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => void send(detail.draft!.content)}
                          disabled={sending}
                        >
                          <Check aria-hidden /> Approve reply
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <KbdGroup>
                          <Kbd>⌘</Kbd>
                          <Kbd>↵</Kbd>
                        </KbdGroup>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditText(detail.draft!.content);
                        setEditing(true);
                      }}
                    >
                      <Pencil aria-hidden /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void copyReply(detail.draft!.content)}
                    >
                      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    {canRegenerate && (
                      <Button variant="ghost" onClick={() => setRegenerateOpen(true)}>
                        <RefreshCw aria-hidden />
                        Regenerate
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {detail.draft.model} · {formatLatency(detail.draft.latency_ms)}
                </p>
              </div>
            )}

            {/* The API marks a human decision; no channel here has an outbound
                write. Saying so is better than implying a send that never
                happens. */}
            {phase === "ready" && detail.draft && (
              <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                Regulars doesn&apos;t send replies for you yet. Approving marks this
                handled and keeps the final text here to copy.
              </p>
            )}
          </div>

          <CitationsPanel citations={citations} refused={refused} active={activeCitation} />
        </div>
      )}

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate a new draft?</AlertDialogTitle>
            <AlertDialogDescription>
              The current draft stays in the audit history. A fresh draft will be
              written from the latest knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setRegenerateOpen(false);
                runDraft(true);
              }}
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
