import type { Icon } from "@phosphor-icons/react";
import { ChatCircle, EnvelopeSimple, InstagramLogo, Star } from "@phosphor-icons/react";

/** Mirrors CHANNELS in apps/api/app/db/models.py. */
export const CHANNELS = ["contact_form", "google_review", "instagram_dm"] as const;

export type Channel = (typeof CHANNELS)[number];

type ChannelMeta = {
  label: string;
  Icon: Icon;
};

export const CHANNEL_META: Record<Channel, ChannelMeta> = {
  google_review: { label: "Google review", Icon: Star },
  instagram_dm: { label: "Instagram DM", Icon: InstagramLogo },
  contact_form: { label: "Contact form", Icon: EnvelopeSimple },
};

const FALLBACK: ChannelMeta = { label: "Message", Icon: ChatCircle };

export function channelMeta(channel: string): ChannelMeta {
  return CHANNEL_META[channel as Channel] ?? FALLBACK;
}
