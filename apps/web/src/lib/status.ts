import type { Icon } from "@phosphor-icons/react";
import {
  CircleDashed,
  EnvelopeSimpleOpen,
  PaperPlaneTilt,
  Prohibit,
  Sparkle,
} from "@phosphor-icons/react";

/** Mirrors MESSAGE_STATUSES in apps/api/app/db/models.py. */
export const MESSAGE_STATUSES = ["new", "drafted", "flagged", "sent", "spam"] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

type StatusMeta = {
  label: string;
  /** Text color class driven by the status token. */
  textClass: string;
  /** Subtle badge treatment: tinted background + readable text. */
  badgeClass: string;
  Icon: Icon;
};

export const STATUS_META: Record<MessageStatus, StatusMeta> = {
  new: {
    label: "New",
    textClass: "text-status-new",
    badgeClass: "bg-status-new/10 text-status-new",
    Icon: EnvelopeSimpleOpen,
  },
  drafted: {
    label: "Draft ready",
    textClass: "text-status-drafted",
    badgeClass: "bg-status-drafted/10 text-status-drafted",
    Icon: Sparkle,
  },
  flagged: {
    label: "Needs review",
    textClass: "text-status-flagged",
    badgeClass: "bg-status-flagged/10 text-status-flagged",
    Icon: CircleDashed,
  },
  sent: {
    label: "Replied",
    textClass: "text-status-sent",
    badgeClass: "bg-status-sent/10 text-status-sent",
    Icon: PaperPlaneTilt,
  },
  spam: {
    label: "Filtered",
    textClass: "text-status-spam",
    badgeClass: "bg-status-spam/10 text-status-spam",
    Icon: Prohibit,
  },
};

export function isMessageStatus(value: string): value is MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(value);
}
