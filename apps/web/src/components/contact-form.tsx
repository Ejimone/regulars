"use client";

import { Check, PaperPlaneTilt } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { useTenants } from "@/lib/api/queries";

/** The live channel: a real form on a real endpoint. Submissions land in the
 * business's inbox as `new` messages via the same adapter as every channel. */
export function ContactForm({ slug }: { slug: string }) {
  const { data: tenants } = useTenants();
  const tenant = tenants?.find((t) => t.slug === slug) ?? null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.POST("/api/public/contact/{slug}", {
        params: { path: { slug } },
        body: { name, email, message },
      });
      if (apiError || !data?.ok) throw new Error("submit failed");
      setDone(true);
    } catch {
      setError("Your message couldn't be sent. Check the fields and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {done ? (
          <div className="text-center" role="status">
            <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/15">
              <Check className="size-5 text-primary" aria-hidden />
            </span>
            <h1 className="text-lg font-semibold tracking-tight">Message sent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Thanks{name ? `, ${name.split(" ")[0]}` : ""}.{" "}
              {tenant?.name ?? "The business"} will get back to you shortly.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold tracking-tight">
              Contact {tenant?.name ?? "us"}
            </h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
              Questions about hours, prices, or bookings are welcome.
            </p>
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                <Input
                  id="contact-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <Input
                  id="contact-email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  aria-invalid={error != null || undefined}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-message">Message</FieldLabel>
                <Textarea
                  id="contact-message"
                  required
                  rows={4}
                  maxLength={4000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={busy}
                />
              </Field>
              {error && <FieldError role="alert">{error}</FieldError>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PaperPlaneTilt data-icon="inline-start" aria-hidden />
                )}
                Send message
              </Button>
            </form>
          </>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Powered by <span className="font-medium text-foreground">Regulars</span>
      </p>
    </div>
  );
}
