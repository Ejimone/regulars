import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/marketing/reveal";
import { DraftStill, InboxStill } from "@/components/marketing/product-still";
import {
  Container,
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
} from "@/components/marketing/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  // A title.template on the root layout does not apply to a page in the same
  // segment, so the home title is set absolutely.
  title: { absolute: "Regulars — reply to every review, in your voice." },
  description:
    "Regulars drafts replies to your Google reviews, Instagram DMs and contact-form messages, grounded in your own hours, prices and policies. You approve every one.",
};

export default function HomePage() {
  return (
    <>
      {/* Hero — asymmetric 7/5, left-aligned. */}
      <Container className="pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <Eyebrow>For restaurants, clinics and shops.</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] font-normal tracking-display text-balance">
              Regulars replies to every review, in your voice.
            </h1>
            <Lede className="mt-6">
              It reads the hours, prices and policies you already wrote down, drafts the
              reply, and shows you the exact lines it used. You approve. Nothing leaves
              without you.
            </Lede>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/t">Open the sample workspace</Link>
              </Button>
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-ui hover:text-foreground hover:underline"
              >
                See how it works.
              </Link>
            </div>
          </Reveal>

          <Reveal index={1} className="lg:col-span-5">
            <InboxStill />
          </Reveal>
        </div>
      </Container>

      {/* Proof strip — hairline-divided, no icons, mono numerals. */}
      <Container>
        <Reveal className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              head: "Three channels.",
              body: "Google reviews, Instagram DMs, and your own contact form.",
            },
            {
              head: "Every sentence cited.",
              body: "Footnoted to a document you wrote yourself.",
            },
            {
              head: "Nothing sends unread.",
              body: "Each reply waits for you to approve it.",
            },
            {
              head: "Free.",
              body: "No card, no plan, no seat count.",
            },
          ].map(({ head, body }) => (
            <div key={head} className="bg-background p-6">
              <p className="text-sm font-medium">{head}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>

      {/* The problem — 8/4 with a pull-quote. */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <SectionTitle>The reviews pile up on a Tuesday.</SectionTitle>
            <Lede className="mt-6">
              A two-star about a forty-minute wait. Three messages asking whether you do
              gluten-free. A contact form at 11pm about parking. Each one takes four
              minutes and a small amount of dread, and each one is answered by something
              you already know.
            </Lede>
          </Reveal>
          <Reveal index={1} className="lg:col-span-4 lg:col-start-9 lg:self-center">
            <blockquote className="border-l-2 border-primary pl-6 font-display text-[1.5rem] leading-[1.35] tracking-h3 italic">
              I know the answer. I just don&apos;t want to type it again.
            </blockquote>
          </Reveal>
        </div>
      </Section>

      {/* How it works — numbered, left rail. */}
      <Section bleed>
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle className="mt-5">
            Set-up is a text box. The rest is reading.
          </SectionTitle>
        </Reveal>

        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {[
            {
              n: "01",
              head: "Write down what you already know.",
              body: "Hours, prices, policies, the two things people always ask. Plain text in a box. That is the whole setup.",
            },
            {
              n: "02",
              head: "A message arrives.",
              body: "A Google review, an Instagram DM, or your contact form. It lands in one inbox, in order.",
            },
            {
              n: "03",
              head: "Read the draft. Approve it.",
              body: "The reply is already written and already sourced. Change a word or don't.",
            },
          ].map(({ n, head, body }, i) => (
            <Reveal as="li" key={n} index={i}>
              <p className="font-mono text-xs tabular-nums text-primary">{n}</p>
              <h3 className="mt-4 text-[1.25rem] leading-[1.35] font-medium tracking-h3">
                {head}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
                {body}
              </p>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* Grounding — image left, 5/7. */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <DraftStill />
          </Reveal>
          <Reveal index={1} className="lg:col-span-5 lg:col-start-8">
            <SectionTitle>It shows its work.</SectionTitle>
            <Lede className="mt-6">
              Every claim in a draft carries a footnote. Follow it and the exact line
              from your knowledge base is right there. If the answer isn&apos;t in there,
              Regulars says so and asks for time instead of inventing a policy you never
              had.
            </Lede>
          </Reveal>
        </div>
      </Section>

      {/* What it doesn't do — the honest section. */}
      <Section bleed>
        <Reveal>
          <Eyebrow>Plainly</Eyebrow>
          <SectionTitle className="mt-5">What Regulars doesn&apos;t do.</SectionTitle>
        </Reveal>
        <ul className="mt-12 max-w-[70ch]">
          {[
            {
              head: "It doesn't post for you yet.",
              body: "Approving a reply marks the message handled and keeps the final text ready to copy. Posting straight to Google and Instagram is next.",
            },
            {
              head: "It doesn't learn from your edits yet.",
              body: "Your edits are saved alongside the reply, but they don't change the next draft.",
            },
            {
              head: "It doesn't guess.",
              body: "When your knowledge base doesn't cover a question, the draft asks for time rather than making something up.",
            },
          ].map(({ head, body }, i) => (
            <Reveal
              as="li"
              key={head}
              index={i}
              className="border-t border-hairline py-6 last:border-b"
            >
              <p className="text-[15px] font-medium">{head}</p>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-muted-foreground">
                {body}
              </p>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Close */}
      <Section>
        <Reveal className="max-w-[46ch]">
          <SectionTitle>Start with the sample workspace.</SectionTitle>
          <Lede className="mt-6">
            Two example businesses with a full inbox and knowledge base, so you can see
            the whole loop before connecting anything of your own.
          </Lede>
          <Button asChild size="lg" className="mt-9 rounded-full">
            <Link href="/t">Open the sample workspace</Link>
          </Button>
        </Reveal>
      </Section>
    </>
  );
}
