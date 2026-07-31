import { ChannelIcon } from "@/components/channel-icon";
import { StarRating } from "@/components/star-rating";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Static views of the product built from the same components the app renders —
 * StatusBadge, StarRating, ChannelIcon — so the marketing site shows the real
 * thing rather than a redrawn mockup that can drift from it.
 */

export function Frame({
  className,
  label,
  children,
}: {
  className?: string;
  /** Describes the still for screen readers, which can't read the UI shown. */
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-2xl border border-hairline bg-surface-1 p-1.5 shadow-e2 md:p-2",
        className
      )}
    >
      <div className="overflow-hidden rounded-xl border border-hairline bg-background">
        {children}
      </div>
    </div>
  );
}

type Row = {
  channel: string;
  name: string;
  handle?: string;
  rating?: number;
  preview: string;
  time: string;
  status: string;
  needsFacts?: boolean;
  unread?: boolean;
};

const ROWS: Row[] = [
  {
    channel: "google_review",
    name: "Marta Oyelaran",
    rating: 2,
    preview:
      "Booked for 7.30 and still waited forty minutes. Nobody said anything until I asked twice.",
    time: "14m",
    status: "new",
    unread: true,
  },
  {
    channel: "instagram_dm",
    name: "hannah.brt",
    handle: "@hannah.brt",
    preview: "do you do gluten free pasta?",
    time: "1h",
    status: "drafted",
  },
  {
    channel: "contact_form",
    name: "Tomasz Wierzbicki",
    preview:
      "Is there parking nearby on a Saturday night? Coming in from out of town with my parents.",
    time: "3h",
    status: "drafted",
    needsFacts: true,
  },
  {
    channel: "google_review",
    name: "Priya Raman",
    rating: 5,
    preview: "Best carbonara I have had outside Rome. The staff remembered us from last time.",
    time: "5h",
    status: "sent",
  },
];

export function InboxStill() {
  return (
    <Frame label="The Regulars inbox: reviews, Instagram messages and contact-form enquiries in one list, each showing its status.">
      <ul>
        {ROWS.map((row, i) => (
          <li key={i} className="relative">
            {row.unread && (
              <span
                aria-hidden
                className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
              />
            )}
            <div
              className={cn(
                "border-b border-hairline px-4 py-3 last:border-b-0",
                i === 0 && "bg-surface-2"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2">
                  <ChannelIcon
                    channel={row.channel}
                    className="size-3.5 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "flex min-w-0 items-baseline gap-1.5 truncate text-sm",
                        row.unread ? "font-semibold" : "font-medium"
                      )}
                    >
                      <span className="truncate">{row.name}</span>
                      {row.handle && (
                        <span className="shrink-0 font-mono text-xs font-normal text-muted-foreground">
                          {row.handle}
                        </span>
                      )}
                      {row.rating != null && (
                        <StarRating rating={row.rating} className="shrink-0" />
                      )}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {row.time}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {row.preview}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusBadge status={row.status} />
                    {row.needsFacts && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Needs facts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function DraftStill() {
  return (
    <Frame label="A draft reply with two footnotes, beside the two lines from the knowledge base that produced them.">
      <div className="border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Draft reply</span>
          <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">
            Grounded
          </Badge>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed">
          Hi Hannah — yes, we keep a gluten-free pasta on every night, and the kitchen
          cooks it in a separate pot
          <Cite n={1} />. It&apos;s £2 on top of the listed price
          <Cite n={2} />. Just tell your server when you order and they&apos;ll flag it.
        </p>
        <div className="space-y-2 border-t border-hairline pt-3">
          <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
            Retrieved facts
          </p>
          <Fact n={1} text="Gluten-free pasta available every service, cooked in a dedicated pot." />
          <Fact n={2} text="Gluten-free substitution: £2 supplement." />
        </div>
      </div>
    </Frame>
  );
}

function Cite({ n }: { n: number }) {
  return (
    <span className="ml-0.5 inline-flex items-center rounded-full bg-primary/10 px-1.5 align-super font-mono text-[10px] font-semibold text-primary">
      {n}
    </span>
  );
}

function Fact({ n, text }: { n: number; text: string }) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-2.5 text-xs leading-snug">
      <span className="mr-1.5 font-mono font-semibold text-primary">[{n}]</span>
      {text}
    </div>
  );
}
