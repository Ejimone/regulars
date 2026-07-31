import type { LucideIcon } from "lucide-react";
import { AtSign, Mail, MessageCircle, Star } from "lucide-react";

/** Mirrors CHANNELS in apps/api/app/db/models.py. */
export const CHANNELS = ["contact_form", "google_review", "instagram_dm"] as const;

export type Channel = (typeof CHANNELS)[number];

type ChannelMeta = {
  label: string;
  Icon: LucideIcon;
};

// lucide dropped brand marks in 1.x, so Instagram uses a generic handle glyph
// rather than a redrawn trademark.
export const CHANNEL_META: Record<Channel, ChannelMeta> = {
  google_review: { label: "Google review", Icon: Star },
  instagram_dm: { label: "Instagram DM", Icon: AtSign },
  contact_form: { label: "Contact form", Icon: Mail },
};

const FALLBACK: ChannelMeta = { label: "Message", Icon: MessageCircle };

export function channelMeta(channel: string): ChannelMeta {
  return CHANNEL_META[channel as Channel] ?? FALLBACK;
}
