"use client";

import { Check, CircleNotch as Loader2, PaperPlaneTilt as Send } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, type Tenant } from "@/lib/api/client";

/** The live channel: a real form on a real endpoint. Submissions land in the
 * inbox as `new` messages via the same adapter the replay fixtures use. */
export function ContactForm({ slug }: { slug: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.GET("/api/tenants").then(({ data }) => {
      setTenant(data?.find((t) => t.slug === slug) ?? null);
    });
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: apiError } = await api.POST(
      "/api/public/contact/{slug}",
      {
        params: { path: { slug } },
        body: { name, email, message },
      }
    );
    setBusy(false);
    if (data?.ok) setDone(true);
    else if (apiError) setError("Something went wrong — check the fields and try again.");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-background p-8 shadow-sm">
        {done ? (
          <div className="text-center">
            <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <Check className="size-5 text-emerald-600" />
            </span>
            <h1 className="text-lg font-semibold">Message sent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tenant?.name ?? "The business"} will get back to you shortly.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo tip: <Link href="/" className="underline">open the inbox</Link>{" "}
              to watch this message arrive and get drafted.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold tracking-tight">
              Contact {tenant?.name ?? "…"}
            </h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              Ask about hours, prices, bookings — anything.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
              />
              <Textarea
                required
                placeholder="Your message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Send message
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
