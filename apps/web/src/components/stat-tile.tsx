export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {/* Steps down on narrow screens so four-digit counts don't wrap in the
          two-up mobile grid. */}
      <p className="mt-1.5 font-mono text-2xl tabular-nums tracking-h2 sm:text-3xl">
        {value}
      </p>
      {detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
