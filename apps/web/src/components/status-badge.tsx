import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { label: string; className: string }> = {
  new: {
    label: "New",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  drafted: {
    label: "Draft ready",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  flagged: {
    label: "Needs you",
    className:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
  sent: {
    label: "Sent",
    className: "bg-muted text-muted-foreground",
  },
  spam: {
    label: "Spam",
    className: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { label: status, className: "" };
  return (
    <Badge variant="secondary" className={cn("border-0", style.className)}>
      {style.label}
    </Badge>
  );
}
