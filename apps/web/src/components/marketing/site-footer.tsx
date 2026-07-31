import Link from "next/link";

import { Container } from "@/components/marketing/section";

const YEAR = 2026;

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <Container className="flex flex-col gap-10 py-14 sm:flex-row sm:justify-between">
        <div className="max-w-[28ch] space-y-3">
          <p className="font-display text-[1.375rem] leading-none tracking-h3">Regulars</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Reviews and messages for local businesses, answered from what you already
            know.
          </p>
        </div>

        <nav aria-label="Footer" className="flex gap-16">
          <div className="space-y-3">
            <p className="text-[13px] font-medium tracking-eyebrow text-muted-foreground">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-muted-foreground transition-colors duration-150 ease-ui hover:text-foreground"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/t"
                  className="text-muted-foreground transition-colors duration-150 ease-ui hover:text-foreground"
                >
                  Open the app
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </Container>

      <Container className="border-t border-hairline py-6">
        <p className="font-mono text-xs text-muted-foreground">
          Regulars — free, in beta. {YEAR}
        </p>
      </Container>
    </footer>
  );
}
