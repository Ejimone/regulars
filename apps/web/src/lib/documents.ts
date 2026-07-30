import type { Icon } from "@phosphor-icons/react";
import {
  ChatTeardropText,
  Clock,
  Question,
  Scroll,
  Storefront,
  Tag,
} from "@phosphor-icons/react";

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

export const KIND_META: Record<DocumentKind, { label: string; Icon: Icon }> = {
  hours: { label: "Hours", Icon: Clock },
  services: { label: "Services", Icon: Storefront },
  pricing: { label: "Pricing", Icon: Tag },
  policies: { label: "Policies", Icon: Scroll },
  faq: { label: "FAQ", Icon: Question },
  tone: { label: "Tone of voice", Icon: ChatTeardropText },
};

export function kindMeta(kind: string) {
  return (
    KIND_META[kind as DocumentKind] ?? { label: kind, Icon: Scroll }
  );
}
