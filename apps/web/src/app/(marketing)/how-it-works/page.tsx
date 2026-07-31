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
  title: "How it works",
  description:
    "Write down what you already know, watch messages arrive in one inbox, read a sourced draft, and approve it. Regulars in four steps.",
};

const STEPS = [
  {
    n: "01",
    head: "Write down what you already know.",
    body: [
      "Regulars answers from a knowledge base you write yourself: opening hours, prices, the policy on dogs, the two questions everyone asks. It is plain text in a box, grouped into a handful of documents — hours, services, pricing, policies, FAQ, and the tone you want replies to take.",
      "There is no integration to configure and no schema to learn. If you can type it into a note on your phone, it is a knowledge base.",
    ],
  },
  {
    n: "02",
    head: "Watch it arrive.",
    body: [
      "Google reviews, Instagram DMs, and submissions from your own contact page land in one list, newest first. Each row shows who wrote it, which channel it came from, the star rating where there is one, and where it has got to.",
      "Obvious spam is filtered out before it reaches you.",
    ],
    still: "inbox" as const,
  },
  {
    n: "03",
    head: "Read the draft.",
    body: [
      "Regulars retrieves the lines from your knowledge base that bear on the question, writes a reply in your tone, and footnotes each claim to the line that produced it. The retrieved facts sit next to the draft so you can check the reasoning rather than trust it.",
      "When your knowledge base doesn't cover the question, the draft says so and asks for time. It is marked Needs facts, and that is the signal to add the missing document.",
    ],
    still: "draft" as const,
  },
  {
    n: "04",
    head: "Approve or edit.",
    body: [
      "Approve it as written, or change a word first. Approving marks the message handled and keeps the final text ready to copy into Google or Instagram.",
      "Regulars does not post on your behalf yet, and it will not tell you otherwise.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Container className="pt-20 pb-16 md:pt-28 md:pb-20">
        <Reveal className="max-w-[24ch]">
          <Eyebrow>How it works</Eyebrow>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.98] font-normal tracking-display text-balance">
            Set-up is a text box. The rest is reading.
          </h1>
        </Reveal>
      </Container>

      <Container className="pb-24 md:pb-32">
        <ol className="space-y-20 md:space-y-28">
          {STEPS.map(({ n, head, body, still }) => (
            <Reveal as="li" key={n}>
              <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
                {/* Sticky rail keeps the step number beside its prose on desktop. */}
                <div className="lg:col-span-3">
                  <div className="lg:sticky lg:top-28">
                    <p className="font-mono text-xs tabular-nums text-primary">{n}</p>
                    <h2 className="mt-3 font-display text-[1.75rem] leading-[1.1] font-normal tracking-h2">
                      {head}
                    </h2>
                  </div>
                </div>
                <div className="space-y-5 lg:col-span-8 lg:col-start-5">
                  {body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="max-w-[62ch] text-[17px] leading-[1.65] text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {still === "inbox" && (
                    <div className="pt-4">
                      <InboxStill />
                    </div>
                  )}
                  {still === "draft" && (
                    <div className="pt-4">
                      <DraftStill />
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>

      <Section bleed>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <SectionTitle>What it costs. Nothing.</SectionTitle>
          </Reveal>
          <Reveal index={1} className="lg:col-span-6 lg:col-start-7">
            <Lede>
              Regulars is free while it is in beta. There is no plan to price it per
              seat, no card to add, and no trial to run out. If that changes, it will
              change here first.
            </Lede>
          </Reveal>
        </div>
      </Section>

      <Section>
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

      <Section bleed>
        <Reveal className="max-w-[46ch]">
          <SectionTitle>See it with real messages.</SectionTitle>
          <Lede className="mt-6">
            The sample workspace has a full inbox and knowledge base already loaded.
          </Lede>
          <Button asChild size="lg" className="mt-9 rounded-full">
            <Link href="/t">Open the sample workspace</Link>
          </Button>
        </Reveal>
      </Section>
    </>
  );
}
