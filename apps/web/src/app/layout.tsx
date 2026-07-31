import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Instrument Serif ships a single weight, so `weight` is required — the build
// fails without it. That constraint is useful here: display type can never be
// bolded, which is the rule anyway.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Regulars",
    template: "%s · Regulars",
  },
  description:
    "Every review and DM, answered. AI drafts on-brand replies to reviews, DMs, and contact-form messages, grounded in your business's own knowledge base.",
  openGraph: {
    title: "Regulars",
    description: "Every review and DM, answered.",
    siteName: "Regulars",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Regulars",
    description: "Every review and DM, answered.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#100e0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // Next 16 no longer forces scroll-behavior:auto during navigation, so
      // without this attribute smooth in-page scrolling would also animate
      // every route transition.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before paint so scroll-reveal targets can start hidden without
            content ever being hidden from a visitor whose JS didn't run. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
