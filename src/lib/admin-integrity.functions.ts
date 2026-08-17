import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { angelMemoryIndex, recordAngelOperation } from "./angel-runtime.server";
import { rememberPersonalContext } from "./angel-os-ia/personal-context.server";

export type AdminIntegritySnapshot = {
  checkedAt: string;
  counts: {
    applications: number;
    projects: number;
    openTasks: number;
    articles: number;
    publishedArticles: number;
    pendingActions: number;
    unreadMessages: number;
  };
  staleCaches: string[];
  warnings: string[];
};

const CACHE_MAX_AGE_MS = 20 * 60 * 1000;
const EXPECTED_CACHE_KEYS = ["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary", "news_dashboard"] as const;

function isMissingAngelOsCacheError(message: string | undefined) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("angel_os_cache") && (
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table") ||
    normalized.includes("does not exist") ||
    normalized.includes("relation")
  );
}

export const getAdminIntegritySnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminIntegritySnapshot> => {
    const startedAt = Date.now();
    const db = context.supabase as any;
    const cacheDb = supabaseAdmin as any;

    // Business tables keep the authenticated admin session. angel_os_cache is
    // deliberately server-only (RLS + no anon/authenticated grants), therefore
    // its health must be checked with the service-role client. Using the browser
    // user's client here used to turn a correct security policy into a false
    // "migration Supabase pending" warning.
    const [applications, projects, tasks, articles, actions, messages, cache] = await Promise.all([
      db.from("applications").select("id", { count: "exact", head: true }),
      db.from("projects").select("id", { count: "exact", head: true }),
      db.from("project_tasks").select("id", { count: "exact", head: true }).neq("status", "termine"),
      db.from("articles").select("published"),
      db.from("ai_actions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("contact_requests").select("id", { count: "exact", head: true }).eq("is_read", false),
      cacheDb.from("angel_os_cache").select("key,payload,updated_at").in("key", [...EXPECTED_CACHE_KEYS]),
    ]);

    const cacheErrorMessage = cache.error?.message as string | undefined;
    const cacheTablePending = isMissingAngelOsCacheError(cacheErrorMessage);
    const criticalResults = [applications, projects, tasks, articles, actions, messages];
    const errors = criticalResults.map((result: any) => result.error?.message).filter(Boolean);
    if (cacheErrorMessage && !cacheTablePending) errors.push(cacheErrorMessage);

    if (errors.length) {
      await recordAngelOperation({ type: "admin.integrity.failed", source: "admin-integrity", ok: false, durationMs: Date.now() - startedAt, payload: { errors } });
      throw new Error(errors.join(" · "));
    }

    const articleRows = (articles.data ?? []) as Array<{ published?: boolean | null }>;
    const now = Date.now();
    const cacheRows = cacheTablePending ? [] : (cache.data ?? []) as Array<{ key: string; payload?: unknown; updated_at: string }>;
    const staleCaches = cacheRows.filter((row) => {
      const age = now - new Date(row.updated_at).getTime();
      return !Number.isFinite(age) || age > CACHE_MAX_AGE_MS;
    }).map((row) => row.key);

    const expected = new Set<string>(EXPECTED_CACHE_KEYS);
    for (const row of cacheRows) expected.delete(row.key);
    staleCaches.push(...expected);

    // The fixed amber banner is reserved for a broken durable-cache
    // infrastructure. Missing/old snapshots remain tracked in staleCaches and
    // are refreshed by the normal jobs, but they no longer masquerade as a
    // database migration failure or block the admin UI.
    const warnings: string[] = [];
    if (cacheTablePending) warnings.push("Cache durable Angel OS indisponible côté serveur ; vérifier la migration Supabase");

    const snapshot: AdminIntegritySnapshot = {
      checkedAt: new Date().toISOString(),
      counts: {
        applications: applications.count ?? 0,
        projects: projects.count ?? 0,
        openTasks: tasks.count ?? 0,
        articles: articleRows.length,
        publishedArticles: articleRows.filter((row) => row.published === true).length,
        pendingActions: actions.count ?? 0,
        unreadMessages: messages.count ?? 0,
      },
      staleCaches: [...new Set(staleCaches)],
      warnings,
    };

    angelMemoryIndex.upsert({
      id: "admin:integrity:latest",
      source: "admin-integrity",
      title: "État courant de l'administration Angel OS",
      text: `Candidatures ${snapshot.counts.applications}; projets ${snapshot.counts.projects}; tâches ouvertes ${snapshot.counts.openTasks}; articles ${snapshot.counts.articles}; publiés ${snapshot.counts.publishedArticles}; actions en attente ${snapshot.counts.pendingActions}; messages non lus ${snapshot.counts.unreadMessages}. ${warnings.join(" ")}`,
      tags: ["admin", "integrity", "state"],
      updatedAt: now,
      metadata: { ...snapshot.counts, staleCaches: snapshot.staleCaches, durableCacheHealthy: !cacheTablePending },
    });

    const byKey = Object.fromEntries(cacheRows.map((row) => [row.key, row]));
    const personalUpdates: Promise<unknown>[] = [];
    if (byKey.google_calendar_dashboard?.payload) personalUpdates.push(rememberPersonalContext({ id: "agenda-dashboard", domain: "agenda", title: "Agenda personnel actuel", text: JSON.stringify(byKey.google_calendar_dashboard.payload), tags: ["calendar", "dashboard"], metadata: { updatedAt: byKey.google_calendar_dashboard.updated_at } }));
    if (byKey.gmail_dashboard?.payload) personalUpdates.push(rememberPersonalContext({ id: "mail-dashboard", domain: "mail", title: "Messagerie personnelle actuelle", text: JSON.stringify(byKey.gmail_dashboard.payload), tags: ["gmail", "dashboard"], metadata: { updatedAt: byKey.gmail_dashboard.updated_at } }));
    if (byKey.news_dashboard?.payload) personalUpdates.push(rememberPersonalContext({ id: "news-dashboard", domain: "news", title: "Fil d'actualités personnalisé actuel", text: JSON.stringify(byKey.news_dashboard.payload), tags: ["news", "dashboard"], metadata: { updatedAt: byKey.news_dashboard.updated_at } }));
    await Promise.all(personalUpdates);

    await recordAngelOperation({
      type: warnings.length ? "admin.integrity.warning" : "admin.integrity.ok",
      source: "admin-integrity",
      ok: true,
      durationMs: Date.now() - startedAt,
      payload: { counts: snapshot.counts, staleCaches: snapshot.staleCaches, cacheTablePending, durableCacheHealthy: !cacheTablePending },
    });

    return snapshot;
  });
