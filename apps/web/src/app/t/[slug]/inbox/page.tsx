import { TrayIcon } from "@phosphor-icons/react/dist/ssr";

export default function InboxIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <TrayIcon className="size-8" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Select a message</p>
        <p className="mt-1 text-sm">
          Choose a message from the list to review its draft.
        </p>
      </div>
    </div>
  );
}
