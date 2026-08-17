import { supabaseAdmin } from "@/integrations/supabase/client.server";
import contextFile from "../../../runtime/angel-os-ai-context.json";

const CONTEXT_KEY = "angel_os_ai_context";
const MAX_CONTEXT_AGE_MS = Number(contextFile.staleAfterMinutes || 65) * 60 * 1000;

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
  // angel_os_cache is an internal service-role table. Cast keeps this module
  // compatible while generated Supabase types catch up with new migrations.
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

export async function refreshOperationalContext(): Promise<OperationalContext> {
  const client = db();
  const now = new Date();

  const [applications, projects, tasks, articles, actions, memories, caches] = await Promise.all([
    client.from("applications").select("id,status,company,city,position,follow_up_at").limit(250),
    client.from("projects").select("id,title,status").limit(200),
    client.from("project_tasks").select("id,title,status,due_date").limit(250),
    client.from("articles").select("id,title,published,scheduled_at").order("created_at", { ascending: false }).limit(150),
    client.from("ai_actions").select("id,title,status,sensitive,updated_at").in("status", ["pending", "running", "awaiting_operator"]).order("updated_at", { ascending: false }).limit(80),
    client.from("ai_actions").select("id,kind,title,payload,updated_at").in("kind", ["memory_public", "memory_private"]).eq("status", "active").order("updated_at", { ascending: false }).limit(40),
    client.from("angel_os_cache").select("key,payload,updated_at").neq("key", CONTEXT_KEY).order("updated_at", { ascending: false }).limit(40),
  ]);

  const firstError = [applications, projects, tasks, articles, actions, memories, caches].find((result) => result.error)?.error;
  if (firstError) throw new Error(`Contexte opérationnel indisponible : ${firstError.message}`);

  const applicationRows = applications.data ?? [];
  const projectRows = projects.data ?? [];
  const taskRows = tasks.data ?? [];
  const articleRows = articles.data ?? [];
  const actionRows = actions.data ?? [];
  const memoryRows = memories.data ?? [];
  const cacheRows = (caches.data ?? []) as CacheRow[];

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

  const { error } = await client
    .from("angel_os_cache")
    .upsert({ key: CONTEXT_KEY, payload: context, updated_at: context.generatedAt }, { onConflict: "key" });
  if (error) throw new Error(`Impossible d’enregistrer le contexte opérationnel : ${error.message}`);
  return context;
}

export async function readOperationalContext(options: { refreshIfStale?: boolean } = {}): Promise<OperationalContext | null> {
  const client = db();
  const { data, error } = await client.from("angel_os_cache").select("payload,updated_at").eq("key", CONTEXT_KEY).maybeSingle();
  if (error) {
    console.warn("[angel-os-ai-context] read unavailable", error.message);
    return null;
  }

  const stale = !data?.updated_at || ageMinutes(data.updated_at) > Number(contextFile.staleAfterMinutes || 65);
  if ((!data?.payload || stale) && options.refreshIfStale !== false) {
    try {
      return await refreshOperationalContext();
    } catch (refreshError) {
      console.warn("[angel-os-ai-context] refresh unavailable", refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }
  return (data?.payload as OperationalContext | undefined) ?? null;
}

export function operationalContextPrompt(context: OperationalContext | null) {
  if (!context) return "";
  return `\n\nCONTEXTE OPÉRATIONNEL ANGEL OS — ACTUALISÉ ${context.generatedAt}\nFichier canonique : ${context.knowledgeFile.name} v${context.knowledgeFile.version}, cadence ${context.knowledgeFile.refreshCadenceMinutes} min. Ce dossier est relu à chaque réponse privée. Les données récentes priment sur les anciennes.\nDomaines suivis : ${context.knowledgeFile.knowledgeAreas.join(" | ")}\nIndicateurs : ${JSON.stringify(context.overview)}\nPriorités : ${context.priorities.length ? context.priorities.join(" | ") : "aucune priorité explicite en attente"}\nAlertes : ${context.alerts.length ? context.alerts.join(" | ") : "aucune alerte détectée"}\nAutonomie sûre : ${context.autonomy.automatic.join(" ")}\nValidation obligatoire : ${context.autonomy.approvalRequired.join(" ")}\nMémoire récente : ${context.recentMemory.map((item) => `${item.title}: ${item.content}`).join(" | ") || "aucune"}`;
}
