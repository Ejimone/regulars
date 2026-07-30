import { channelMeta } from "@/lib/channels";

export function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const { Icon, label } = channelMeta(channel);
  return <Icon className={className} aria-label={label} />;
}
