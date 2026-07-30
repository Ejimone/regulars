import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = createClient<paths>({ baseUrl: API_URL });

export type Tenant = components["schemas"]["TenantOut"];
export type MessageListItem = components["schemas"]["MessageListItem"];
export type MessageListPage = components["schemas"]["MessageListPage"];
export type MessageDetail = components["schemas"]["MessageDetail"];
export type Draft = components["schemas"]["DraftOut"];
export type Citation = components["schemas"]["CitationOut"];
export type Stats = components["schemas"]["StatsOut"];
export type KnowledgeDocument = components["schemas"]["DocumentOut"];
