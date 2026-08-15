import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AiMessage } from "@/lib/ai-gateway.server";
import { resilientAngelAi } from "@/lib/ai-resilient.server";
import { searchPersonalContext } from "./personal-context.server";
import { recordAngelOperation } from "@/lib/angel-runtime.server";

const InputSchema = z.object({ command: z.string().trim().min(2).max(2_000) });
type Db = SupabaseClient<Database>;

const LEGACY_AUTOMATIC_RESPONSE = /^État réel\s*:/i;

function looksLikeHtml(value: string | null | undefined) {
  if (!value) return false;
  const sample = value.trim().slice(0, 800).toLowerCase();
  return sample.startsWith("<!doctype html") || sample.startsWith("<html") || /<head[\s>]|<body[\s>]|<title>this page didn't load<\/title>/.test(sample);
}

function safeTechnicalDetail(value: string | null | undefined) {
  if (!value?.trim()) return "Aucune réponse OpenAI exploitable n’a été reçue.";
  if (looksLikeHtml(value)) return "Le service amont a renvoyé une page d’erreur HTML au lieu d’une réponse API exploitable.";
  return value.trim().slice(0, 700);
}

async function assertAdmin(db: Db, userId: string) {
  const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Accès réservé à l’administrateur.");
}

async function recentConversation(db: Db) {
  const { data, error } = await db.from("ai_messages").select("content,response,status,created_at").order("created_at", { ascending: false }).limit(14);
  if (error) return [] as AiMessage[];
  return ((data ?? []) as Array<{ content?: string | null; response?: string | null; status?: string | null }>)
    .reverse()
    .flatMap((row) => {
      const messages: AiMessage[] = [];
      if (row.content?.trim()) messages.push({ role: "user", content: row.content.trim().slice(0, 2_000) });
      const response = row.response?.trim();
      if (
        row.status === "completed" &&
        response &&
        !LEGACY_AUTOMATIC_RESPONSE.test(response) &&
        !looksLikeHtml(response)
      ) {
        messages.push({ role: "assistant", content: response.slice(0, 3_000) });
      }
      return messages;
    })
    .slice(-14);
}

async function adminState(db: Db) {
  const [applications, projects, tasks, articles, actions] = await Promise.all([
    db.from("applications").select("company,city,position,status,follow_up_at,created_at").order("created_at", { ascending: false }).limit(80),
    db.from("projects").select("title,status").limit(100),
    db.from("project_tasks").select("title,status,due_date").limit(100),
    db.from("articles").select("title,published,scheduled_at").order("created_at", { ascending: false }).limit(80),
    db.from("ai_actions").select("title,status,sensitive").in("status", ["pending", "awaiting_operator"]).limit(30),
  ]);
  return {
    applications: applications.data ?? [],
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    articles: articles.data ?? [],
    actions: actions.data ?? [],
  };
}

export type PrivateAngelOsIaResult = {
  response: string;
  status: "completed";
  source: "openai";
  autoExecuted: false;
  actionId: null;
};

export const runPrivateAngelOsIaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ context, data }): Promise<PrivateAngelOsIaResult> => {
    const db = context.supabase as Db;
    await assertAdmin(db, context.userId);
    const startedAt = Date.now();
    const { data: stored, error: insertError } = await db.from("ai_messages").insert({ author: "angel", content: data.command, status: "running", context: { source: "angel-os-ia", private: true } }).select("id").single();
    if (insertError) throw insertError;

    try {
      const [history, state] = await Promise.all([recentConversation(db), adminState(db)]);
      const personal = searchPersonalContext(data.command, 8);
      const personalText = personal.length ? personal.map((hit) => `${hit.title}: ${hit.text.slice(0, 700)}`).join("\n") : "Aucun contexte personnel pertinent indexé.";
      const messages: AiMessage[] = [
        {
          role: "system",
          content: "Tu es Angel OS IA, la distribution d’intelligence artificielle privée fonctionnant au-dessus d’Angel OS dans l’espace administrateur privé. Tu réponds uniquement via OpenAI dans cette interface. Il n’existe aucun moteur conversationnel local de secours ici : ne prétends jamais être un fallback local. Utilise le contexte fourni, garde la continuité de conversation, et dis clairement quand une information manque. Angel OS fournit les primitives système ; Angel OS IA interprète et converse. N’affirme jamais qu’une action externe a été exécutée si elle ne l’a pas réellement été.",
        },
        ...history,
        {
          role: "user",
          content: `Demande actuelle : ${data.command}\n\nÉtat privé : ${JSON.stringify(state)}\n\nMémoire personnelle Angel OS IA :\n${personalText}`,
        },
      ];
      const ai = await resilientAngelAi({ messages, priority: "interactive", maxTokens: 1_400, temperature: 0.35, cacheTtlMs: 1 });
      const candidate = ai.text?.trim() ?? "";
      if ((ai as typeof ai & { adminFailure?: boolean }).adminFailure || !candidate || looksLikeHtml(candidate) || LEGACY_AUTOMATIC_RESPONSE.test(candidate)) {
        const technical = safeTechnicalDetail((ai as typeof ai & { detail?: string | null; adminFailureMessage?: string | null }).detail ?? (ai as typeof ai & { adminFailureMessage?: string | null }).adminFailureMessage);
        throw new Error(`Angel OS IA est indisponible : ${technical} Aucun moteur local ne répond à sa place dans l’espace privé.`);
      }
      const response = candidate.slice(0, 5_000);
      const { error: updateError } = await db.from("ai_messages").update({ response, status: "completed", context: { source: "openai", private: true, angel_os_ia: true } }).eq("id", stored.id);
      if (updateError) throw updateError;
      await recordAngelOperation({ type: "angel-os-ia.private-chat.completed", source: "angel-os-ia", ok: true, durationMs: Date.now() - startedAt, payload: { messageId: stored.id } });
      return { response, status: "completed", source: "openai", autoExecuted: false, actionId: null };
    } catch (error) {
      const rawDetail = error instanceof Error ? error.message : "Angel OS IA indisponible.";
      const detail = looksLikeHtml(rawDetail) ? "Angel OS IA indisponible : le service amont a renvoyé une page d’erreur non exploitable." : rawDetail.slice(0, 900);
      await db.from("ai_messages").update({ response: null, status: "failed", context: { source: "openai", private: true, error: detail } }).eq("id", stored.id);
      await recordAngelOperation({ type: "angel-os-ia.private-chat.failed", source: "angel-os-ia", ok: false, durationMs: Date.now() - startedAt, payload: { messageId: stored.id, error: detail } });
      throw new Error(detail);
    }
  });
