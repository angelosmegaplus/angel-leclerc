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
    const { reconcileApplicationsFromMail } = await import("./angel-os-ia/applications-reconcile.server");
    const result = await reconcileApplicationsFromMail(context.userId, context.supabase);

    const { data: recent } = await context.supabase
      .from("applications")
      .select("company,city,position,status,response,follow_up_at,sent_at")
      .order("sent_at", { ascending: false })
      .limit(60);

    await rememberPersonalContext({
      id: "applications-sync",
      domain: "applications",
      title: "Synchronisation candidatures · Angel OS IA",
      text: JSON.stringify({ result, recent: recent ?? [] }),
      tags: ["angel-os-ia", "gmail", "sync", "applications"],
      metadata: {
        orchestrator: "angel-os-ia",
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        followUpsRepaired: result.followUpsRepaired,
        status: result.status,
      },
    });

    return result;
  });

const ALTERNANCE_RUNTIME_URL =
  "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/runtime-data/runtime/alternance-urgent-latest.json";
const ALTERNANCE_HISTORY_URL =
  "https://raw.githubusercontent.com/angelosmegaplus/angel-leclerc/runtime-data/runtime/alternance-research-history.json";

async function fetchAdminJson(url: string) {
  const response = await fetch(`${url}?t=${Date.now()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function normalizeDate(value?: string) {
  if (!value?.trim()) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function normalizeLeadDates(lead: AlternanceResearchLead): AlternanceResearchLead {
  return {
    ...lead,
    freshness: normalizeDate(lead.freshness),
    lastActionAt: normalizeDate(lead.lastActionAt),
    firstSeenAt: normalizeDate(lead.firstSeenAt),
    lastSeenAt: normalizeDate(lead.lastSeenAt),
  };
}

function leadTimestamp(lead: AlternanceResearchLead) {
  const candidates = [lead.lastActionAt, lead.lastSeenAt, lead.freshness, lead.firstSeenAt]
    .filter(Boolean) as string[];
  for (const value of candidates) {
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function newestFirst(items: AlternanceResearchLead[]) {
  return items
    .map(normalizeLeadDates)
    .sort((a, b) => leadTimestamp(b) - leadTimestamp(a));
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

      if (payload.newApplication) payload.newApplication = normalizeLeadDates(payload.newApplication);
      payload.gmailActions = newestFirst(payload.gmailActions || []);
      payload.screenedLeads = newestFirst(payload.screenedLeads || []);

      if (historyRaw && typeof historyRaw === "object") {
        const history = historyRaw as { updatedAt?: string; items?: unknown };
        payload.history = newestFirst(
          Array.isArray(history.items)
            ? (history.items as AlternanceResearchLead[])
            : [],
        );
        payload.historyUpdatedAt = normalizeDate(history.updatedAt);

        payload.screenedLeads = newestFirst([
          ...(payload.history || []),
          ...(payload.screenedLeads || []),
        ]);
      }

      payload.updatedAt = normalizeDate(payload.updatedAt);
      return Object.keys(payload).length > 0 ? payload : null;
    } catch {
      return null;
    }
  });
