import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { SupabaseKeyValueCache } from "@/lib/supabase-key-value-cache.server";
import contextFile from "../../../runtime/angel-os-ai-context.json";

const CONTEXT_KEY = "angel_os_ai_context";
const MAX_CONTEXT_AGE_MS = Number(contextFile.staleAfterMinutes || 65) * 60 * 1000;
const CACHE_WARNING_INTERVAL_MS = 60 * 60 * 1000;
const contextCache = new SupabaseKeyValueCache();
let lastCacheWarningAt = 0;

type CacheRow = { key: string; payload: unknown; updated_at: string };

type OperationalContext = {
  version: 1;
  generatedAt: string;
  validUntil: string;
  source: "angel-os-hourly-context";
  knowledgeFile: {
    name: string;
    version: number;
    refreshCadenceMinutes: number;
    knowledgeAreas: string[];
  };
  autonomy: {
    automatic: string[];
    approvalRequired: string[];
  };
  overview: {
    applications: number;
    projects: number;
    openTasks: number;
    unpublishedArticles: number;
    pendingAiActions: number;
    activeMemoryItems: number;
  };
  priorities: string[];
  alerts: string[];
  liveSources: Array<{ key: string; updatedAt: string; ageMinutes: number }>;
  recentMemory: Array<{ title: string; scope: "private" | "public"; updatedAt: string; content: string }>;
};

function db() {
  return supabaseAdmin as any;
}

function compact(value: unknown, max = 360) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function payloadContent(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  return compact((payload as Record<string, unknown>).content, 600);
}

function ageMinutes(date: string, now = Date.now()) {
  const timestamp = new Date(date).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, Math.round((now - timestamp) / 60_000)) : 999999;
}

function warnCacheUnavailable(message: string) {
  const now = Date.now();
  if (now - lastCacheWarningAt < CACHE_WARNING_INTERVAL_MS) return;
  lastCacheWarningAt = now;
  console.warn("[angel-os-ai-context] durable cache unavailable; operational context continues in resilient mode", message);
}

async function readRecentCacheRows(): Promise<CacheRow[]> {
  try {
    const { data, error } = await db()
      .from("angel_os_cache")
      .select("key,payload,updated_at")
      .neq("key", CONTEXT_KEY)
      .order("updated_at", { ascending: false })
      .limit(40);
    if (error) {
      warnCacheUnavailable(error.message || "schema unavailable");
      return [];
    }
    return (data ?? []) as CacheRow[];
  } catch (error) {
    warnCacheUnavailable(error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function refreshOperationalContext(): Promise<OperationalContext> {
  const client = db();
  const now = new Date();

  // The durable runtime cache is secondary. Business sources must remain usable
  // while a migration is pending, and a missing angel_os_cache table must never
  // make private AI conversations fail.
  const [applications, projects, tasks, articles, actions, memories, cacheRows] = await Promise.all([
    client.from("applications").select("id,status,company,city,position,follow_up_at").limit(250),
    client.from("projects").select("id,title,status").limit(200),
    client.from("project_tasks").select("id,title,status,due_date").limit(250),
    client.from("articles").select("id,title,published,scheduled_at").order("created_at", { ascending: false }).limit(150),
    client.from("ai_actions").select("id,title,status,sensitive,updated_at").in("status", ["pending", "running", "awaiting_operator"]).order("updated_at", { ascending: false }).limit(80),
    client.from("ai_actions").select("id,kind,title,payload,updated_at").in("kind", ["memory_public", "memory_private"]).eq("status", "active").order("updated_at", { ascending: false }).limit(40),
    readRecentCacheRows(),
  ]);

  const firstError = [applications, projects, tasks, articles, actions, memories].find((result) => result.error)?.error;
  if (firstError) throw new Error(`Contexte opérationnel indisponible : ${firstError.message}`);

  const applicationRows = applications.data ?? [];
  const projectRows = projects.data ?? [];
  const taskRows = tasks.data ?? [];
  const articleRows = articles.data ?? [];
  const actionRows = actions.data ?? [];
  const memoryRows = memories.data ?? [];

  const openTasks = taskRows.filter((item: any) => !["done", "completed", "closed", "archived"].includes(String(item.status ?? "").toLowerCase()));
  const priorities = [
    ...actionRows.slice(0, 6).map((item: any) => compact(item.title, 180)),
    ...openTasks
      .filter((item: any) => item.due_date)
      .sort((a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date)))
      .slice(0, 4)
      .map((item: any) => `${compact(item.title, 150)} · échéance ${item.due_date}`),
  ].filter(Boolean).slice(0, 10);

  const liveSources = cacheRows.map((row) => ({
    key: row.key,
    updatedAt: row.updated_at,
    ageMinutes: ageMinutes(row.updated_at, now.getTime()),
  }));
  const staleCritical = liveSources.filter((source) => source.ageMinutes > 180).slice(0, 5);
  const alerts = [
    ...(staleCritical.length ? [`${staleCritical.length} source(s) runtime n’ont pas été actualisées depuis plus de 3 h : ${staleCritical.map((item) => item.key).join(", ")}.`] : []),
    ...(actionRows.some((item: any) => item.sensitive) ? ["Des actions en attente sont sensibles et nécessitent une validation explicite avant exécution."] : []),
  ];

  const context: OperationalContext = {
    version: 1,
    generatedAt: now.toISOString(),
    validUntil: new Date(now.getTime() + MAX_CONTEXT_AGE_MS).toISOString(),
    source: "angel-os-hourly-context",
    knowledgeFile: {
      name: contextFile.name,
      version: contextFile.version,
      refreshCadenceMinutes: contextFile.refreshCadenceMinutes,
      knowledgeAreas: contextFile.knowledgeAreas,
    },
    autonomy: {
      automatic: contextFile.automaticActions,
      approvalRequired: contextFile.approvalRequired,
    },
    overview: {
      applications: applicationRows.length,
      projects: projectRows.length,
      openTasks: openTasks.length,
      unpublishedArticles: articleRows.filter((item: any) => !item.published).length,
      pendingAiActions: actionRows.length,
      activeMemoryItems: memoryRows.length,
    },
    priorities,
    alerts,
    liveSources,
    recentMemory: memoryRows.slice(0, 12).map((item: any) => ({
      title: compact(item.title, 160),
      scope: item.kind === "memory_public" ? "public" : "private",
      updatedAt: item.updated_at,
      content: payloadContent(item.payload),
    })),
  };

  // SupabaseKeyValueCache always retains a process-local fallback, so an
  // unapplied schema migration cannot break the main AI response path.
  await contextCache.set(CONTEXT_KEY, context);
  return context;
}

export async function readOperationalContext(options: { refreshIfStale?: boolean } = {}): Promise<OperationalContext | null> {
  const cached = await contextCache.get<OperationalContext>(CONTEXT_KEY);
  const stale = !cached?.generatedAt || ageMinutes(cached.generatedAt) > Number(contextFile.staleAfterMinutes || 65);

  if ((!cached || stale) && options.refreshIfStale !== false) {
    try {
      return await refreshOperationalContext();
    } catch (refreshError) {
      console.warn("[angel-os-ai-context] refresh unavailable", refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }
  return cached ?? null;
}

export function operationalContextPrompt(context: OperationalContext | null) {
  if (!context) return "";
  return `\n\nCONTEXTE OPÉRATIONNEL ANGEL OS — ACTUALISÉ ${context.generatedAt}\nFichier canonique : ${context.knowledgeFile.name} v${context.knowledgeFile.version}, cadence ${context.knowledgeFile.refreshCadenceMinutes} min. Ce dossier est relu à chaque réponse privée. Les données récentes priment sur les anciennes.\nDomaines suivis : ${context.knowledgeFile.knowledgeAreas.join(" | ")}\nIndicateurs : ${JSON.stringify(context.overview)}\nPriorités : ${context.priorities.length ? context.priorities.join(" | ") : "aucune priorité explicite en attente"}\nAlertes : ${context.alerts.length ? context.alerts.join(" | ") : "aucune alerte détectée"}\nAutonomie sûre : ${context.autonomy.automatic.join(" ")}\nValidation obligatoire : ${context.autonomy.approvalRequired.join(" ")}\nMémoire récente : ${context.recentMemory.map((item) => `${item.title}: ${item.content}`).join(" | ") || "aucune"}`;
}
