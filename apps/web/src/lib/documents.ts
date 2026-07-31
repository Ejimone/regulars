import type { LucideIcon } from "lucide-react";
import {
  CircleQuestionMark,
  Clock,
  MessageSquareQuote,
  Scroll,
  Store,
  Tag,
} from "lucide-react";

/** Mirrors DOCUMENT_KINDS in apps/api/app/db/models.py (display order). */
export const DOCUMENT_KINDS = [
  "hours",
  "services",
  "pricing",
  "policies",
  "faq",
  "tone",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const KIND_META: Record<DocumentKind, { label: string; Icon: LucideIcon }> = {
  hours: { label: "Hours", Icon: Clock },
  services: { label: "Services", Icon: Store },
  pricing: { label: "Pricing", Icon: Tag },
  policies: { label: "Policies", Icon: Scroll },
  faq: { label: "FAQ", Icon: CircleQuestionMark },
  tone: { label: "Tone of voice", Icon: MessageSquareQuote },
};

export function kindMeta(kind: string) {
  return (
    KIND_META[kind as DocumentKind] ?? { label: kind, Icon: Scroll }
  );
}
