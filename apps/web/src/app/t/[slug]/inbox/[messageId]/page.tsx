"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense, use } from "react";

import { MessageDetailPane } from "@/components/message-detail";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api/queries";

function MessageDetailScreen({ slug, messageId }: { slug: string; messageId: string }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const backHref = `/t/${slug}/inbox${qs ? `?${qs}` : ""}`;

  return (
    <div className="flex min-h-full flex-col">
      <div className="shrink-0 border-b p-2 lg:hidden">
        <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Inbox
        </Button>
      </div>
      <MessageDetailPane
        key={messageId} // remount per message: fresh state, no effect resets
        messageId={messageId}
        onChanged={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.allMessages(slug) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.stats(slug) });
        }}
      />
    </div>
  );
}

export default function MessageDetailPage({
  params,
}: {
  params: Promise<{ slug: string; messageId: string }>;
}) {
  const { slug, messageId } = use(params);
  return (
    <Suspense>
      <MessageDetailScreen slug={slug} messageId={messageId} />
    </Suspense>
  );
}
