"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { Suspense, use } from "react";

import { MessageListPane } from "@/components/message-list-pane";
import { cn } from "@/lib/utils";

export default function InboxLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const messageId = useSelectedLayoutSegment();
  const hasDetail = messageId != null;

  return (
    <div className="flex min-h-0 flex-1">
      <Suspense>
        <MessageListPane
          slug={slug}
          activeMessageId={messageId}
          className={cn(
            "w-full min-w-0 border-r lg:w-[380px] lg:shrink-0",
            hasDetail && "hidden lg:flex"
          )}
        />
      </Suspense>
      <main
        className={cn(
          "min-w-0 flex-1 overflow-y-auto",
          !hasDetail && "hidden lg:block"
        )}
      >
        {children}
      </main>
    </div>
  );
}
