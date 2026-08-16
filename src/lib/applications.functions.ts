import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ApplicationSyncResult } from "./applications.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rememberPersonalContext } from "./angel-os-ia/personal-context.server";

export type AlternanceResearchLead = {
  employer?: string;
  company?: string;
  city?: string;
  position?: string;
  freshness?: string;
  source?: string;
  missions?: string;
  level?: string;
  contract?: string;
  directRecruiter?: boolean;
  fit?: string;
  action?: string;
  status?: string;
  recipient?: string;
  lastAction?: string;
  lastActionAt?: string;
  nextAction?: string;
  reason?: string;
  visualStatus?: string;
  gmailThreadId?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
};

export type AlternanceResearchSnapshot = {
  updatedAt?: string;
  source?: string;
  newApplicationSent?: boolean;
  newApplication?: AlternanceResearchLead | null;
  gmailActions?: AlternanceResearchLead[];
  screenedLeads?: AlternanceResearchLead[];
  history?: AlternanceResearchLead[];
  historyUpdatedAt?: string;
  angelOsSync?: {
    status?: string;
    visualStatus?: string;
    reason?: string;
    preservation?: string;
    fallbackJournal?: string;
    fallbackUpdated?: boolean;
  } | null;
};

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const syncGoogleApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApplicationSyncResult> => {
    await assertAdmin(context);
    const { syncApplicationsForUser } = await import("./applications.server");
    const result = await syncApplicationsForUser(context.userId, context.supabase);

    const { data: recent } = await context.supabase
      .from("applications")
      .select("company,city,position,status,response,follow_up_at,sent_at")
      .order("sent_at", { ascending: false })
      .limit(60);

    await rememberPersonalContext({
      id: "applications-sync",
      domain: "applications",
      title: "Synchronisation candidatures et Gmail",
      text: JSON.stringify({ result, recent: recent ?? [] }),
      tags: ["gmail", "sync", "applications"],
      metadata: {
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        status: result.status,
      },
    });

    return result;
  });

const ALTERNANCE_RUNTIME_URL =
  "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/alternance-urgent-latest.json";
const ALTERNANCE_HISTORY_URL =
  "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/main/runtime/alternance-research-history.json";

async function fetchAdminJson(url: string) {
  const response = await fetch(`${url}?t=${Date.now()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

export const getAlternanceResearchSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlternanceResearchSnapshot | null> => {
    await assertAdmin(context);

    try {
      const [latestRaw, historyRaw] = await Promise.all([
        fetchAdminJson(ALTERNANCE_RUNTIME_URL),
        fetchAdminJson(ALTERNANCE_HISTORY_URL),
      ]);

      const payload = latestRaw && typeof latestRaw === "object"
        ? { ...(latestRaw as AlternanceResearchSnapshot) }
        : ({} as AlternanceResearchSnapshot);

      if (historyRaw && typeof historyRaw === "object") {
        const history = historyRaw as { updatedAt?: string; items?: unknown };
        payload.history = Array.isArray(history.items)
          ? (history.items as AlternanceResearchLead[])
          : [];
        payload.historyUpdatedAt = history.updatedAt;

        // The dashboard consumes screenedLeads. Put the durable history first,
        // then the latest cycle so current statuses overwrite older information.
        payload.screenedLeads = [
          ...(payload.history || []),
          ...(payload.screenedLeads || []),
        ];
      }

      return Object.keys(payload).length > 0 ? payload : null;
    } catch {
      return null;
    }
  });
