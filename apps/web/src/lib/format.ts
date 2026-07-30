export function timeAgo(iso: string): string {
  const seconds = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 14) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Display name plus an optional muted detail (e.g. an anonymized handle).
 * The backend's Instagram adapter emits "Instagram user •1234"; the raw string
 * feeds the LLM prompt, so it is reformatted here for display only. */
export function formatAuthor(
  channel: string,
  authorName: string
): { name: string; detail: string | null } {
  if (channel === "instagram_dm") {
    const match = authorName.match(/^Instagram user •(\w+)$/);
    if (match) return { name: "Instagram follower", detail: `#${match[1]}` };
  }
  return { name: authorName, detail: null };
}

export function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
