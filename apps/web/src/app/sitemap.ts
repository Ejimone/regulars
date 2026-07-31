import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the marketing surface. Per-business contact pages belong to those
  // businesses, and workspaces are private.
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/how-it-works`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
