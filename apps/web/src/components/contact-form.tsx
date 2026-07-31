"use client";

import { Send } from "lucide-react";
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
    // Offset from the top rather than vertically centred — a centred card in a
    // dead field is the template look this page is deliberately avoiding.
    <div className="mx-auto w-full max-w-[34rem] px-4 sm:px-6 pt-16 pb-24 md:pt-24">
      {done ? (
        <div role="status">
          <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
            Sent
          </p>
          <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-normal tracking-h1">
            Thanks{name ? `, ${name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-muted-foreground">
            {tenant?.name ?? "The business"} has your message and will get back to you
            at {email || "the address you gave"}.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
            Get in touch
          </p>
          <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-normal tracking-h1 text-balance">
            {tenant?.name ?? "Contact us"}
          </h1>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-muted-foreground">
            Questions about hours, prices or bookings are welcome. Most messages are
            answered the same day.
          </p>

          <div className="mt-10 rounded-2xl border border-hairline bg-card p-6 shadow-e2 sm:p-8">
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
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? <Spinner /> : <Send aria-hidden />}
                Send message
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
