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
    const lines = items.map((item) => `- ${item.title}: ${item.content || "(aucun détail supplémentaire)"}`);
    const memory = lines.length ? `\n\nMÉMOIRE ANGEL OS ACTUALISÉE\n${lines.join("\n")}` : "";
    if (scope === "public") return `${memory}${await publicSiteUpdates()}`;
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
