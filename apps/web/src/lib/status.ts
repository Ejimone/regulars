// Status metadata is label + colour only. There was an `Icon` per status that
// nothing ever rendered; it is gone rather than carrying a decorative glyph.

/** Mirrors MESSAGE_STATUSES in apps/api/app/db/models.py. */
export const MESSAGE_STATUSES = ["new", "drafted", "flagged", "sent", "spam"] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

type StatusMeta = {
  label: string;
  /** Compact label for filter tabs. */
  shortLabel: string;
  /** Text color class driven by the status token. */
  textClass: string;
  /** Subtle badge treatment: tinted background + readable text. */
  badgeClass: string;
};

export const STATUS_META: Record<MessageStatus, StatusMeta> = {
  new: {
    label: "New",
    shortLabel: "New",
    textClass: "text-status-new",
    badgeClass: "bg-status-new/10 text-status-new",
  },
  drafted: {
    label: "Draft ready",
    shortLabel: "Drafts",
    textClass: "text-status-drafted",
    badgeClass: "bg-status-drafted/10 text-status-drafted",
  },
  flagged: {
    label: "Needs review",
    shortLabel: "Review",
    textClass: "text-status-flagged",
    badgeClass: "bg-status-flagged/10 text-status-flagged",
  },
  sent: {
    label: "Handled",
    shortLabel: "Handled",
    textClass: "text-status-sent",
    badgeClass: "bg-status-sent/10 text-status-sent",
  },
  spam: {
    label: "Filtered",
    shortLabel: "Filtered",
    textClass: "text-status-spam",
    badgeClass: "bg-status-spam/10 text-status-spam",
  },
};

export function isMessageStatus(value: string): value is MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(value);
}
