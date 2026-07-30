"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export const PAGE_SIZE = 25;

export const queryKeys = {
  tenants: ["tenants"] as const,
  messages: (slug: string, filters: { status?: string; q?: string; page?: number }) =>
    ["messages", slug, filters] as const,
  allMessages: (slug: string) => ["messages", slug] as const,
  message: (id: string) => ["message", id] as const,
  stats: (slug: string) => ["stats", slug] as const,
  documents: (slug: string) => ["documents", slug] as const,
};

async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error || data === undefined) throw new Error("Request failed");
  return data;
}

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants,
    queryFn: () => unwrap(api.GET("/api/tenants")),
    staleTime: 5 * 60_000,
  });
}

export function useMessages(
  slug: string | null,
  { status, q, page = 1 }: { status?: string; q?: string; page?: number }
) {
  return useQuery({
    queryKey: queryKeys.messages(slug ?? "", { status, q, page }),
    queryFn: () =>
      unwrap(
        api.GET("/api/tenants/{slug}/messages", {
          params: {
            path: { slug: slug! },
            query: {
              ...(status ? { status } : {}),
              ...(q ? { q } : {}),
              limit: PAGE_SIZE,
              offset: (page - 1) * PAGE_SIZE,
            },
          },
        })
      ),
    enabled: slug != null,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useMessage(id: string) {
  return useQuery({
    queryKey: queryKeys.message(id),
    queryFn: () =>
      unwrap(api.GET("/api/messages/{message_id}", { params: { path: { message_id: id } } })),
  });
}

export function useStats(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.stats(slug ?? ""),
    queryFn: () =>
      unwrap(api.GET("/api/tenants/{slug}/stats", { params: { path: { slug: slug! } } })),
    enabled: slug != null,
    refetchInterval: 30_000,
  });
}

export function useDocuments(slug: string | null) {
  return useQuery({
    queryKey: queryKeys.documents(slug ?? ""),
    queryFn: () =>
      unwrap(api.GET("/api/tenants/{slug}/documents", { params: { path: { slug: slug! } } })),
    enabled: slug != null,
  });
}
