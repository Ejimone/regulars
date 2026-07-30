"use client";

import { Inbox, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { MessageDetailPane } from "@/components/message-detail";
import { MessageList } from "@/components/message-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  api,
  type MessageListItem,
  type Tenant,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";

const FILTERS: { key: string; label: string; status: string | null }[] = [
  { key: "all", label: "All", status: null },
  { key: "new", label: "New", status: "new" },
  { key: "flagged", label: "Needs you", status: "flagged" },
  { key: "drafted", label: "Drafted", status: "drafted" },
  { key: "sent", label: "Sent", status: "sent" },
  { key: "spam", label: "Spam", status: "spam" },
];

export default function Dashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    void api.GET("/api/tenants").then(({ data }) => {
      if (data && data.length > 0) {
        setTenants(data);
        setTenant((current) => current ?? data[0].slug);
      }
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!tenant) return;
    const { data } = await api.GET("/api/tenants/{slug}/messages", {
      params: { path: { slug: tenant } },
    });
    if (data) setMessages(data.items);
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    void api
      .GET("/api/tenants/{slug}/messages", { params: { path: { slug: tenant } } })
      .then(({ data }) => {
        if (data) setMessages(data.items);
      });
  }, [tenant]);

  const reset = async () => {
    if (!tenant) return;
    if (!confirm("Reset this demo business to its original state?")) return;
    setResetting(true);
    await api.POST("/api/tenants/{slug}/reset", {
      params: { path: { slug: tenant } },
    });
    setResetting(false);
    setSelectedId(null);
    void loadMessages();
  };

  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const visible = active.status
    ? messages.filter((m) => m.status === active.status)
    : messages;
  const countFor = (status: string | null) =>
    status ? messages.filter((m) => m.status === status).length : messages.length;

  return (
    <div className="flex h-dvh flex-col">
      {/* top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight">Regulars</h1>
          <Badge variant="outline" className="text-muted-foreground">
            demo workspace
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tenant ?? ""}
            onChange={(e) => {
              setTenant(e.target.value);
              setSelectedId(null);
            }}
            className="h-8 rounded-lg border bg-background px-2 text-sm"
          >
            {tenants.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void reset()}
            disabled={resetting}
          >
            <RotateCcw
              data-icon="inline-start"
              className={cn(resetting && "animate-spin")}
            />
            Reset demo
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* inbox pane */}
        <div className="flex w-[380px] shrink-0 flex-col border-r">
          <div className="flex flex-wrap gap-1 border-b p-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs transition-colors",
                  filter === f.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label} {countFor(f.status) > 0 && `· ${countFor(f.status)}`}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MessageList
              items={visible}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        {/* detail pane */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {selectedId ? (
            <MessageDetailPane
              key={selectedId} // remount per message: fresh state, no effect resets
              messageId={selectedId}
              onChanged={() => void loadMessages()}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Inbox className="mb-3 size-8" />
              <p className="text-sm">Pick a message to see its draft.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
