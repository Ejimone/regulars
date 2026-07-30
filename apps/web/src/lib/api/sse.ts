import { API_URL, type Citation } from "./client";

export type DraftMeta = {
  status: string;
  decision: "drafted" | "refused" | null;
  confidence: number;
};

type Handlers = {
  onStage?: (stage: string) => void;
  onMeta?: (meta: DraftMeta) => void;
  onDelta?: (text: string) => void;
  onCitations?: (citations: Citation[]) => void;
  onDone?: () => void;
  onError?: (detail: string) => void;
};

type Options = {
  /** Re-run the pipeline even if a draft exists (drafted/flagged only). */
  force?: boolean;
  /** Abort to stop reading the stream (e.g. on unmount). */
  signal?: AbortSignal;
};

/** Consume the SSE draft stream (fetch-based: EventSource can't POST).
 * Aborting via `signal` stops silently; other failures reach `onError`. */
export async function streamDraft(
  messageId: string,
  handlers: Handlers,
  { force = false, signal }: Options = {}
) {
  try {
    const res = await fetch(
      `${API_URL}/api/messages/${messageId}/draft${force ? "?force=true" : ""}`,
      { method: "POST", signal }
    );
    if (!res.ok || !res.body) {
      handlers.onError?.(`draft request failed (${res.status})`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let split;
      while ((split = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);

        let event = "message";
        let data = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7).trim();
          else if (line.startsWith("data: ")) data += line.slice(6);
        }
        const payload = data ? JSON.parse(data) : null;
        if (event === "status") handlers.onStage?.(payload?.stage ?? "");
        else if (event === "meta") handlers.onMeta?.(payload as DraftMeta);
        else if (event === "delta") handlers.onDelta?.(payload?.text ?? "");
        else if (event === "citations")
          handlers.onCitations?.((payload ?? []) as Citation[]);
        else if (event === "done") handlers.onDone?.();
        else if (event === "error")
          handlers.onError?.(payload?.detail ?? "unknown error");
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    handlers.onError?.(error instanceof Error ? error.message : "stream failed");
  }
}
