import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { angelMemoryIndex, recordAngelOperation } from "./angel-runtime.server";

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

export const getAdminIntegritySnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminIntegritySnapshot> => {
    const startedAt = Date.now();
    const db = context.supabase as any;
    const [applications, projects, tasks, articles, actions, messages, cache] = await Promise.all([
      db.from("applications").select("id", { count: "exact", head: true }),
      db.from("projects").select("id", { count: "exact", head: true }),
      db.from("project_tasks").select("id", { count: "exact", head: true }).neq("status", "termine"),
      db.from("articles").select("published"),
      db.from("ai_actions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("contact_requests").select("id", { count: "exact", head: true }).eq("is_read", false),
      db.from("angel_os_cache").select("key,updated_at").in("key", ["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary", "news_dashboard"]),
    ]);

    const results = [applications, projects, tasks, articles, actions, messages, cache];
    const errors = results.map((result: any) => result.error?.message).filter(Boolean);
    if (errors.length) {
      await recordAngelOperation({
        type: "admin.integrity.failed",
        source: "admin-integrity",
        ok: false,
        durationMs: Date.now() - startedAt,
        payload: { errors },
      });
      throw new Error(errors.join(" · "));
    }

    const articleRows = (articles.data ?? []) as Array<{ published?: boolean | null }>;
    const now = Date.now();
    const staleCaches = ((cache.data ?? []) as Array<{ key: string; updated_at: string }>).filter((row) => {
      const age = now - new Date(row.updated_at).getTime();
      return !Number.isFinite(age) || age > CACHE_MAX_AGE_MS;
    }).map((row) => row.key);

    const expected = new Set(["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary", "news_dashboard"]);
    for (const row of (cache.data ?? []) as Array<{ key: string }>) expected.delete(row.key);
    staleCaches.push(...expected);

    const warnings: string[] = [];
    if (staleCaches.length) warnings.push(`${staleCaches.length} snapshot(s) admin périmé(s) ou absent(s)`);

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
      metadata: { ...snapshot.counts, staleCaches: snapshot.staleCaches },
    });

    await recordAngelOperation({
      type: warnings.length ? "admin.integrity.warning" : "admin.integrity.ok",
      source: "admin-integrity",
      ok: true,
      durationMs: Date.now() - startedAt,
      payload: { counts: snapshot.counts, staleCaches: snapshot.staleCaches },
    });

    return snapshot;
  });
