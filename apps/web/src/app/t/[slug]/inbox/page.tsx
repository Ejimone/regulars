import { Inbox } from "lucide-react";

export default function InboxIndexPage() {
  return (
    <div className="flex h-full flex-col justify-center p-6 sm:p-10">
      <div className="max-w-[38ch]">
        <span className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
          <Inbox className="size-4" aria-hidden />
        </span>
        <p className="mt-5 text-[15px] font-medium">Select a message.</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Its draft, the facts behind it, and the approve action all appear here. Use{" "}
          <kbd className="font-mono text-xs">j</kbd> and{" "}
          <kbd className="font-mono text-xs">k</kbd> to move through the list.
        </p>
      </div>
    </div>
  );
}
