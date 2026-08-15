import type { WorkflowSnapshot, WorkflowStateStore } from "../../angel-os/core";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KEY_PREFIX = "workflow:";

function hasDurableBackend() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Durable Angel OS workflow state backed by angel_os_cache when the server-side
 * Supabase credentials are available. The process-local map keeps the runtime
 * operational without generating false production errors when that optional
 * persistence backend is not configured.
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
      console.warn("[angel-workflow] durable write unavailable; snapshot retained in process fallback", error instanceof Error ? error.message : String(error));
    }
  }
}
