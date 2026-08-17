import type { KeyValueCache } from "../../angel-os/core";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let durableDisabledUntil = 0;
let durableDisableReason = "";
const SCHEMA_RETRY_MS = 5 * 60 * 1000;

function hasDurableBackend() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) && Date.now() >= durableDisabledUntil;
}

function isSchemaUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /angel_os_cache|schema cache|PGRST\d+|relation .* does not exist|could not find the table/i.test(message);
}

function disableDurableBackend(error: unknown) {
  if (!isSchemaUnavailable(error)) return;
  durableDisabledUntil = Date.now() + SCHEMA_RETRY_MS;
  durableDisableReason = error instanceof Error ? error.message : String(error ?? "schema unavailable");
  console.warn("[angel-cache] durable cache schema unavailable; process fallback enabled for 5 minutes", durableDisableReason);
}

/** Durable key/value storage backed by angel_os_cache with a safe process fallback. */
export class SupabaseKeyValueCache implements KeyValueCache {
  private readonly fallback = new Map<string, unknown>();

  constructor(private readonly prefix = "") {}

  private key(key: string) {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const resolvedKey = this.key(key);
    if (!hasDurableBackend()) return (this.fallback.get(resolvedKey) as T | undefined) ?? null;

    try {
      const { data, error } = await (supabaseAdmin as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { payload?: unknown } | null; error: { message?: string } | null }> };
          };
        };
      }).from("angel_os_cache").select("payload").eq("key", resolvedKey).maybeSingle();
      if (error) throw new Error(error.message || "Supabase cache read failed");
      if (data && "payload" in data) {
        this.fallback.set(resolvedKey, data.payload);
        return (data.payload as T | undefined) ?? null;
      }
    } catch (error) {
      disableDurableBackend(error);
      console.warn("[angel-cache] durable read unavailable; using process fallback", error instanceof Error ? error.message : String(error));
    }

    return (this.fallback.get(resolvedKey) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T, _ttlSeconds?: number): Promise<void> {
    const resolvedKey = this.key(key);
    this.fallback.set(resolvedKey, value);
    if (!hasDurableBackend()) return;

    try {
      const { error } = await (supabaseAdmin as unknown as {
        from: (table: string) => {
          upsert: (
            row: { key: string; payload: unknown; updated_at: string },
            options: { onConflict: string },
          ) => Promise<{ error: { message?: string } | null }>;
        };
      }).from("angel_os_cache").upsert(
        { key: resolvedKey, payload: value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
      if (error) throw new Error(error.message || "Supabase cache write failed");
    } catch (error) {
      disableDurableBackend(error);
      console.warn("[angel-cache] durable write unavailable; value retained in process fallback", error instanceof Error ? error.message : String(error));
    }
  }

  async delete(key: string): Promise<void> {
    const resolvedKey = this.key(key);
    this.fallback.delete(resolvedKey);
    if (!hasDurableBackend()) return;
    try {
      const { error } = await (supabaseAdmin as unknown as {
        from: (table: string) => {
          delete: () => { eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }> };
        };
      }).from("angel_os_cache").delete().eq("key", resolvedKey);
      if (error) throw new Error(error.message || "Supabase cache delete failed");
    } catch (error) {
      disableDurableBackend(error);
      console.warn("[angel-cache] durable delete unavailable", error instanceof Error ? error.message : String(error));
    }
  }
}
