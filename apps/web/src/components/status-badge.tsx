import { Badge } from "@/components/ui/badge";
import { STATUS_META, isMessageStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  if (!isMessageStatus(status)) {
    return (
      <Badge variant="secondary" className="border-0">
        {status}
      </Badge>
    );
  }
  const meta = STATUS_META[status];
  return (
    <Badge variant="secondary" className={cn("border-0", meta.badgeClass)}>
      {meta.label}
    </Badge>
  );
}
