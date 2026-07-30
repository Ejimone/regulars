import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContactForm } from "@/components/contact-form";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Tenant = { slug: string; name: string; vertical: string };

/** Server-side tenant lookup, tolerant of an unreachable API (returns null so
 * builds and previews never hard-fail; the client then fetches on its own). */
async function fetchTenant(slug: string): Promise<Tenant | null | "unavailable"> {
  try {
    const res = await fetch(`${API_URL}/api/tenants`, { cache: "no-store" });
    if (!res.ok) return "unavailable";
    const tenants: Tenant[] = await res.json();
    return tenants.find((t) => t.slug === slug) ?? null;
  } catch {
    return "unavailable";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await fetchTenant(slug);
  const name = tenant && tenant !== "unavailable" ? tenant.name : "Contact";
  return {
    title: tenant && tenant !== "unavailable" ? `Contact ${name}` : "Contact",
    description:
      tenant && tenant !== "unavailable"
        ? `Send a message to ${name}. Questions about hours, prices, or bookings are answered quickly.`
        : undefined,
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await fetchTenant(slug);
  if (tenant === null) notFound();
  return <ContactForm slug={slug} />;
}
