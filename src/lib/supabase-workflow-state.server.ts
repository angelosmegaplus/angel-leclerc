import type { WorkflowSnapshot, WorkflowStateStore } from "../../angel-os/core";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KEY_PREFIX = "workflow:";
const SCHEMA_RETRY_MS = 5 * 60 * 1000;
let durableDisabledUntil = 0;

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
  console.warn("[angel-workflow] cache schema unavailable; process fallback enabled for 5 minutes", error instanceof Error ? error.message : String(error));
}

/**
 * Durable Angel OS workflow state backed by angel_os_cache when the server-side
 * Supabase credentials and schema are available. The process-local map keeps
 * the runtime operational while a migration is missing or the PostgREST schema
 * cache is refreshing.
 */
export class SupabaseWorkflowStateStore implements WorkflowStateStore {
  private readonly fallback = new Map<string, WorkflowSnapshot<unknown>>();

  async load<TContext>(id: string): Promise<WorkflowSnapshot<TContext> | null> {
    if (!hasDurableBackend()) {
      return (this.fallback.get(id) as WorkflowSnapshot<TContext> | undefined) ?? null;
    }

    try {
      const { data, error } = await (supabaseAdmin as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { payload?: unknown } | null; error: { message?: string } | null }> };
          };
        };
      }).from("angel_os_cache").select("payload").eq("key", `${KEY_PREFIX}${id}`).maybeSingle();

      if (error) throw new Error(error.message || "Supabase workflow read failed");
      if (data?.payload && typeof data.payload === "object") {
        const snapshot = data.payload as WorkflowSnapshot<TContext>;
        this.fallback.set(id, snapshot as WorkflowSnapshot<unknown>);
        return snapshot;
      }
    } catch (error) {
      disableDurableBackend(error);
      console.warn("[angel-workflow] durable read unavailable; using process fallback", error instanceof Error ? error.message : String(error));
    }

    return (this.fallback.get(id) as WorkflowSnapshot<TContext> | undefined) ?? null;
  }

  async save<TContext>(snapshot: WorkflowSnapshot<TContext>): Promise<void> {
    this.fallback.set(snapshot.id, snapshot as WorkflowSnapshot<unknown>);
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
        {
          key: `${KEY_PREFIX}${snapshot.id}`,
          payload: snapshot,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
      if (error) throw new Error(error.message || "Supabase workflow write failed");
    } catch (error) {
      disableDurableBackend(error);
      console.warn("[angel-workflow] durable write unavailable; snapshot retained in process fallback", error instanceof Error ? error.message : String(error));
    }
  }
}
