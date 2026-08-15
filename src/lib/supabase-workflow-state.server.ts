import type { WorkflowSnapshot, WorkflowStateStore } from "../../angel-os/core";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KEY_PREFIX = "workflow:";

/**
 * Durable Angel OS workflow state backed by the existing angel_os_cache table.
 * A small in-process fallback keeps development usable when Supabase is absent,
 * while production persists every snapshot through the service-role client.
 */
export class SupabaseWorkflowStateStore implements WorkflowStateStore {
  private readonly fallback = new Map<string, WorkflowSnapshot<unknown>>();

  async load<TContext>(id: string): Promise<WorkflowSnapshot<TContext> | null> {
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
      console.warn("[angel-workflow] durable store read unavailable; using process fallback", error);
    }

    return (this.fallback.get(id) as WorkflowSnapshot<TContext> | undefined) ?? null;
  }

  async save<TContext>(snapshot: WorkflowSnapshot<TContext>): Promise<void> {
    this.fallback.set(snapshot.id, snapshot as WorkflowSnapshot<unknown>);
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
      console.warn("[angel-workflow] durable store write unavailable; snapshot retained in process fallback", error);
    }
  }
}
