import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { syncApplicationsForUser, type ApplicationSyncResult } from "@/lib/applications.server";
import { rememberPersonalContext } from "./personal-context.server";

type Db = SupabaseClient<Database>;

export type AngelOsIaApplicationReconcileResult = ApplicationSyncResult & {
  orchestrator: "angel-os-ia";
};

/**
 * Point d'entrée canonique pour la reconstruction des candidatures depuis la boîte mail.
 *
 * Angel OS IA orchestre l'opération ; la synchronisation Gmail reste la couche de preuve
 * déterministe et idempotente. Cette séparation évite qu'un raisonnement incertain du
 * modèle puisse créer une candidature, changer un refus ou renvoyer un mail.
 */
export async function reconcileApplicationsFromMail(
  userId: string,
  db: Db,
): Promise<AngelOsIaApplicationReconcileResult> {
  const startedAt = Date.now();
  const result = await syncApplicationsForUser(userId, db);
  const reconciled: AngelOsIaApplicationReconcileResult = {
    ...result,
    orchestrator: "angel-os-ia",
  };

  const anyDb = db as unknown as { from: (table: string) => any };
  await anyDb.from("activity_log").insert({
    source: "ai",
    action: "angel_os_ia_applications_reconcile",
    entity_type: "applications",
    details: {
      orchestrator: "angel-os-ia",
      status: result.status,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      synced_at: result.syncedAt,
      duration_ms: Date.now() - startedAt,
    },
  }).then(({ error }: { error?: { message?: string } | null }) => {
    if (error) console.error("[angel-os-ia applications reconcile] activity log:", error.message);
  }).catch(() => undefined);

  await rememberPersonalContext({
    id: "angel-os-ia-applications-reconcile",
    domain: "applications",
    title: "Angel OS IA · contrôle candidatures depuis les mails",
    text: JSON.stringify({
      status: result.status,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      syncedAt: result.syncedAt,
    }),
    tags: ["angel-os-ia", "applications", "gmail", "reconciliation"],
    metadata: {
      orchestrator: "angel-os-ia",
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      status: result.status,
    },
  }).catch(() => undefined);

  return reconciled;
}
