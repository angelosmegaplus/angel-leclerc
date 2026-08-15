import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AddMemorySchema = z.object({
  scope: z.enum(["public", "private"]),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(2).max(4000),
});
const IdSchema = z.object({ id: z.string().uuid() });
const AddTaskSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(4000).optional(),
  sensitive: z.boolean().optional(),
});

const GITHUB_COMMITS_API = "https://api.github.com/repos/angelosmegaplus/angel-leclerc/commits?sha=main&per_page=50";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulTokens(value: string) {
  const ignored = new Set(["a", "au", "aux", "avec", "de", "des", "du", "en", "et", "la", "le", "les", "pour", "sur", "un", "une", "the", "to", "and", "fix", "feat", "chore"]);
  return normalizeText(value).split(" ").filter((token) => token.length >= 3 && !ignored.has(token));
}

function looksEquivalent(a: string, b: string) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 18 && right.includes(left)) return true;
  if (right.length >= 18 && left.includes(right)) return true;

  const leftTokens = new Set(meaningfulTokens(left));
  const rightTokens = new Set(meaningfulTokens(right));
  if (leftTokens.size < 3 || rightTokens.size < 3) return false;
  let common = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) common += 1;
  });
  return common / Math.min(leftTokens.size, rightTokens.size) >= 0.8;
}

async function findExistingModification(context: any, title: string, description?: string) {
  const candidate = `${title} ${description ?? ""}`.trim();
  const { data, error } = await context.supabase
    .from("ai_actions")
    .select("id, title, description, status, created_at, updated_at")
    .in("kind", ["chatgpt_task", "operator_request"])
    .in("status", ["pending", "running", "awaiting_operator", "completed"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  const duplicateAction = (data ?? []).find((row: any) =>
    looksEquivalent(candidate, `${row.title ?? ""} ${row.description ?? ""}`),
  );
  if (duplicateAction) {
    return {
      source: duplicateAction.status === "completed" ? "already_completed" : "already_queued",
      reference: duplicateAction.id,
      status: duplicateAction.status,
    } as const;
  }

  try {
    const response = await fetch(GITHUB_COMMITS_API, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Angel-OS" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const commits = (await response.json()) as Array<{ sha?: string; commit?: { message?: string } }>;
    const duplicateCommit = commits.find((commit) => looksEquivalent(candidate, commit.commit?.message ?? ""));
    if (duplicateCommit) {
      return { source: "already_published", reference: duplicateCommit.sha ?? "main", status: "published" } as const;
    }
  } catch (error) {
    console.warn("[queue-dedup] GitHub publication check unavailable", error);
  }

  return null;
}

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

export const getAiMemoryState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ readAiMemory }, { readChatGptQueue }] = await Promise.all([
      import("./ai-memory.server"),
      import("./ai-memory.server"),
    ]);
    const [memory, queue] = await Promise.all([readAiMemory("all"), readChatGptQueue()]);
    return { memory, queue };
  });

export const addAiMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => AddMemorySchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("ai_actions")
      .insert({
        kind: data.scope === "public" ? "memory_public" : "memory_private",
        title: data.title,
        description: data.scope === "public" ? "Contexte public lisible par l'assistant du site." : "Contexte privé réservé à Angel AI dans l'administration.",
        payload: { content: data.content, scope: data.scope, source: "admin_memory" },
        status: "active",
        target_type: "ai_memory",
        sensitive: data.scope === "private",
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const archiveAiMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ai_actions")
      .update({ status: "archived", resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .in("kind", ["memory_public", "memory_private"]);
    if (error) throw error;
    return { ok: true };
  });

export const addChatGptTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => AddTaskSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);

    const existing = await findExistingModification(context, data.title, data.description);
    if (existing) {
      if (existing.source === "already_published" || existing.source === "already_completed") {
        return { id: existing.reference, accepted: false as const, blocked: true as const, reason: "already_published" as const };
      }
      return { id: existing.reference, accepted: false as const, blocked: true as const, reason: "already_queued" as const };
    }

    const { data: row, error } = await context.supabase
      .from("ai_actions")
      .insert({
        kind: "chatgpt_task",
        title: data.title,
        description: data.description || "Tâche à traiter depuis ChatGPT avec les connecteurs Angel OS.",
        payload: {
          source: "angel_ai",
          execution: "chatgpt_operator",
          publication_check: "passed",
          validation: "accepted",
          checked_at: new Date().toISOString(),
        },
        status: "pending",
        target_type: "chatgpt",
        sensitive: Boolean(data.sensitive),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id, accepted: true as const, blocked: false as const, reason: "validated_and_queued" as const };
  });

export const resolveChatGptTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ai_actions")
      .update({ status: "completed", resolved_at: new Date().toISOString() })
      .eq("id", data.id)
      .in("kind", ["chatgpt_task", "operator_request"]);
    if (error) throw error;
    return { ok: true };
  });
