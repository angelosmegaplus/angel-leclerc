import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AiMemoryScope = "public" | "private";
export type AiMemoryItem = {
  id: string;
  scope: AiMemoryScope;
  title: string;
  content: string;
  updatedAt: string;
};

function contentFromPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const value = (payload as Record<string, unknown>).content;
  return typeof value === "string" ? value.trim() : "";
}

export async function readAiMemory(scope: AiMemoryScope | "all" = "all", limit = 80): Promise<AiMemoryItem[]> {
  const kinds = scope === "public" ? ["memory_public"] : scope === "private" ? ["memory_private"] : ["memory_public", "memory_private"];
  const { data, error } = await supabaseAdmin
    .from("ai_actions")
    .select("id, kind, title, payload, updated_at")
    .in("kind", kinds)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[ai-memory] read failed", error);
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

export async function aiMemoryPrompt(scope: AiMemoryScope | "all") {
  const items = await readAiMemory(scope);
  if (!items.length) return "";
  const lines = items.map((item) => `- ${item.title}: ${item.content || "(aucun détail supplémentaire)"}`);
  return `\n\nMÉMOIRE ANGEL OS ACTUALISÉE\n${lines.join("\n")}`;
}

export async function readChatGptQueue(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("ai_actions")
    .select("id, kind, title, description, payload, status, sensitive, created_at, updated_at")
    .in("kind", ["chatgpt_task", "operator_request"])
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[ai-memory] queue read failed", error);
    return [];
  }
  return data ?? [];
}
