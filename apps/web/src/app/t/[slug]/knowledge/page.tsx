"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { api, type KnowledgeDocument } from "@/lib/api/client";
import { queryKeys, useDocuments } from "@/lib/api/queries";
import { kindMeta } from "@/lib/documents";
import { timeAgo } from "@/lib/format";

const MAX_CONTENT = 20_000;

function DocumentCard({
  doc,
  onEdit,
}: {
  doc: KnowledgeDocument;
  onEdit: () => void;
}) {
  const { label, Icon } = kindMeta(doc.kind);
  return (
    <article className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">{doc.title}</h3>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${doc.title}`} onClick={onEdit}>
          <PencilSimple aria-hidden />
        </Button>
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
        {doc.content}
      </p>
      <p className="mt-3 text-[11px] tabular-nums text-muted-foreground">
        {doc.chunk_count} section{doc.chunk_count === 1 ? "" : "s"} indexed · updated{" "}
        {timeAgo(doc.updated_at)}
      </p>
    </article>
  );
}

export default function KnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { data: documents, isPending } = useDocuments(slug);
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null);
  const [draft, setDraft] = useState("");

  const save = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await api.PUT("/api/documents/{document_id}", {
        params: { path: { document_id: id } },
        body: { content },
      });
      if (error || !data) throw new Error("save failed");
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(slug) });
      toast.add({
        title: "Knowledge updated",
        description: `${data.chunk_count} section${data.chunk_count === 1 ? "" : "s"} re-indexed. Drafts now answer from the new text.`,
        type: "success",
      });
      setEditing(null);
    },
    onError: () => {
      toast.add({
        title: "Couldn't save the document",
        description: "Nothing was changed. Try again.",
        type: "error",
      });
    },
  });

  const openEditor = (doc: KnowledgeDocument) => {
    setEditing(doc);
    setDraft(doc.content);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Knowledge</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every draft is grounded in these documents. Edits re-index immediately.
        </p>
      </header>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {documents?.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onEdit={() => openEditor(doc)} />
          ))}
        </div>
      )}

      <Dialog
        open={editing != null}
        onOpenChange={(open) => {
          if (!open && !save.isPending) setEditing(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.title}</DialogTitle>
            <DialogDescription>
              Saving re-chunks and re-embeds this document so retrieval sees the
              new text immediately.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            maxLength={MAX_CONTENT}
            aria-label="Document content"
            className="font-mono text-xs leading-relaxed"
            disabled={save.isPending}
          />
          <p className="text-right text-[11px] tabular-nums text-muted-foreground">
            {draft.length.toLocaleString()} / {MAX_CONTENT.toLocaleString()}
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditing(null)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => editing && save.mutate({ id: editing.id, content: draft })}
              disabled={save.isPending || draft.trim().length === 0}
            >
              {save.isPending ? (
                <>
                  <Spinner data-icon="inline-start" /> Re-indexing…
                </>
              ) : (
                "Save & re-index"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
