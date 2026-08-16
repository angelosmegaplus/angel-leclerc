import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AiMemoryScope = "public" | "private";
export type AiMemoryItem = {
  id: string;
  scope: AiMemoryScope;
  title: string;
  content: string;
  updatedAt: string;
};

function hasSupabaseAdminConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function contentFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const value = (payload as Record<string, unknown>).content;
  return typeof value === "string" ? value.trim() : "";
}

function compactText(value: unknown, max = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function stringList(value: unknown, maxItems = 8) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, maxItems);
}

export async function readAiMemory(scope: AiMemoryScope | "all" = "all", limit = 80): Promise<AiMemoryItem[]> {
  if (!hasSupabaseAdminConfig()) return [];
  const kinds = scope === "public" ? ["memory_public"] : scope === "private" ? ["memory_private"] : ["memory_public", "memory_private"];
  const { data, error } = await supabaseAdmin
    .from("ai_actions")
    .select("id, kind, title, payload, updated_at")
    .in("kind", kinds)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[ai-memory] read unavailable", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    scope: row.kind === "memory_public" ? "public" : "private",
    title: row.title,
    content: contentFromPayload(row.payload),
    updatedAt: row.updated_at,
  }));
}

async function publicContentSnapshot() {
  if (!hasSupabaseAdminConfig()) return "";
  const { data, error } = await supabaseAdmin
    .from("content_items")
    .select("section, title, subtitle, description, period, bullets, tags, extra_label, extra_value, url, updated_at, sort_order")
    .eq("published", true)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(120);

  if (error) {
    console.warn("[ai-memory] public content snapshot unavailable", error.message);
    return "";
  }
  if (!data?.length) return "";

  const sectionLabels: Record<string, string> = {
    experience: "EXPÉRIENCES PUBLIÉES",
    formation: "FORMATIONS PUBLIÉES",
    certification: "CERTIFICATIONS PUBLIÉES",
    engagement: "ENGAGEMENTS PUBLIÉS",
    projet: "PROJETS ET RÉALISATIONS PUBLIÉS",
    service: "SERVICES PRINCIPAUX PUBLIÉS",
    service_extra: "SERVICES COMPLÉMENTAIRES PUBLIÉS",
  };

  const groups = new Map<string, string[]>();
  for (const item of data) {
    const section = String(item.section || "autre");
    const details = [
      compactText(item.subtitle, 180),
      compactText(item.period, 100),
      compactText(item.description, 420),
      ...stringList(item.bullets, 8).map((value) => compactText(value, 220)),
      ...stringList(item.tags, 8).map((value) => `tag: ${compactText(value, 80)}`),
      item.extra_label && item.extra_value ? `${compactText(item.extra_label, 80)}: ${compactText(item.extra_value, 180)}` : "",
    ].filter(Boolean);
    const url = compactText(item.url, 220);
    const line = `- ${compactText(item.title, 180)}${details.length ? ` — ${details.join(" ; ")}` : ""}${url ? ` — ${url}` : ""}`;
    const current = groups.get(section) ?? [];
    current.push(line);
    groups.set(section, current);
  }

  const blocks = [...groups.entries()].map(([section, lines]) => `${sectionLabels[section] ?? `CONTENU PUBLIC — ${section.toUpperCase()}`}\n${lines.join("\n")}`);
  return `\n\nCONTENU PUBLIC ACTUEL DU SITE — SYNCHRONISÉ AUTOMATIQUEMENT\n${blocks.join("\n\n")}`;
}

async function publicSiteUpdates() {
  if (!hasSupabaseAdminConfig()) return "";
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("title, slug, category, excerpt, published_at, updated_at")
    .eq("published", true)
    .eq("is_private", false)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(12);
  if (error) {
    console.warn("[ai-memory] public site updates unavailable", error.message);
    return "";
  }
  if (!data?.length) return "";
  return `\n\nNOUVEAUTÉS PUBLIÉES SUR LE SITE\n${data.map((article) => {
    const summary = article.excerpt ? ` — ${String(article.excerpt).replace(/\s+/g, " ").slice(0, 220)}` : "";
    return `- ${article.title} (${article.category}) : /articles/${article.slug}${summary}`;
  }).join("\n")}`;
}

export async function aiMemoryPrompt(scope: AiMemoryScope | "all") {
  try {
    const items = await readAiMemory(scope);
    const lines = items.map((item) => `- ${item.title}: ${item.content || "(aucun détail supplémentaire)"} [mise à jour ${item.updatedAt}]`);
    const memory = lines.length ? `\n\nMÉMOIRE ANGEL OS ACTUALISÉE\nRègle : les éléments les plus récents priment en cas de contradiction avec une information plus ancienne.\n${lines.join("\n")}` : "";
    if (scope === "public") {
      const [contentSnapshot, siteUpdates] = await Promise.all([publicContentSnapshot(), publicSiteUpdates()]);
      return `${memory}${contentSnapshot}${siteUpdates}`;
    }
    return memory;
  } catch (error) {
    console.warn("[ai-memory] unavailable; continuing without memory", error instanceof Error ? error.message : String(error));
    return "";
  }
}

export async function readChatGptQueue(limit = 50) {
  if (!hasSupabaseAdminConfig()) return [];
  const { data, error } = await supabaseAdmin
    .from("ai_actions")
    .select("id, kind, title, description, payload, status, sensitive, created_at, updated_at")
    .in("kind", ["chatgpt_task", "operator_request", "refresh_check"])
    .in("status", ["pending", "running", "awaiting_operator"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[ai-memory] queue unavailable", error.message);
    return [];
  }
  return data ?? [];
}
