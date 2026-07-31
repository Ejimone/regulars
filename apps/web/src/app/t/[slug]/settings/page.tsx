"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { useTenants } from "@/lib/api/queries";

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[15px] font-medium">{title}</h2>
      <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: tenants, isPending } = useTenants();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const tenant = tenants?.find((t) => t.slug === slug);
  const contactPath = `/contact/${slug}`;
  const contactUrl =
    typeof window === "undefined" ? contactPath : `${window.location.origin}${contactPath}`;

  const copyContactUrl = async () => {
    await navigator.clipboard.writeText(contactUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const restore = async () => {
    setResetting(true);
    try {
      const { data } = await api.POST("/api/tenants/{slug}/reset", {
        params: { path: { slug } },
      });
      if (!data?.ok) throw new Error("reset failed");
      // Every message and draft UUID changed — drop the whole cache.
      queryClient.clear();
      router.replace(`/t/${slug}/inbox`);
      toast.add({
        title: "Sample workspace reset",
        description: `${data.messages} messages and ${data.documents} documents restored.`,
        type: "success",
      });
      setResetOpen(false);
    } catch {
      toast.add({
        title: "Couldn't reset the workspace",
        description: "Nothing was changed. Try again.",
        type: "error",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-lg font-semibold tracking-h3">Settings</h1>

      <div className="mt-8">
        {isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <Row
              title="Workspace"
              description={
                tenant
                  ? `${tenant.name} — ${tenant.vertical.replace("_", " ")}.`
                  : "This workspace could not be loaded."
              }
            />

            <Row
              title="Your public contact page"
              description="Share this link, or embed it on your website. Anything submitted here arrives in your inbox as a new message."
            >
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-hairline bg-surface-2 px-3 py-2 font-mono text-xs">
                  {contactUrl}
                </code>
                <Button variant="outline" size="sm" onClick={() => void copyContactUrl()}>
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(contactPath, "_blank", "noopener")}
                >
                  <ExternalLink aria-hidden />
                  Open
                </Button>
              </div>
            </Row>

            {tenant?.is_sample && (
              <Row
                title="Sample workspace"
                description="This workspace ships with Regulars so you can try it without connecting anything. Its messages and knowledge documents are examples, not a real business."
              >
                <Button variant="outline" onClick={() => setResetOpen(true)}>
                  <RotateCcw aria-hidden />
                  Reset to the original sample
                </Button>
              </Row>
            )}
          </>
        )}
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this sample workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the messages and documents with the originals. Replies
              you&apos;ve approved and edits you&apos;ve made here will be gone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={(event) => {
                event.preventDefault();
                void restore();
              }}
            >
              {resetting ? "Resetting…" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
