import { Camera, Mail, MessageSquare, Star } from "lucide-react";

export function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  if (channel === "google_review") return <Star className={className} />;
  if (channel === "instagram_dm") return <Camera className={className} />;
  if (channel === "contact_form") return <Mail className={className} />;
  return <MessageSquare className={className} />;
}
