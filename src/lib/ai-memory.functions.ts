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
  .inputValidator((input: unknown) => AddMemorySchema.parse(input))
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
  .inputValidator((input: unknown) => IdSchema.parse(input))
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
  .inputValidator((input: unknown) => AddTaskSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("ai_actions")
      .insert({
        kind: "chatgpt_task",
        title: data.title,
        description: data.description || "Tâche à traiter depuis ChatGPT avec les connecteurs Angel OS.",
        payload: { source: "angel_ai", execution: "chatgpt_operator" },
        status: "pending",
        target_type: "chatgpt",
        sensitive: Boolean(data.sensitive),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const resolveChatGptTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
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
