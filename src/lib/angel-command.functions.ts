import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AiMessage } from "./ai-gateway.server";
import { resilientAngelAi } from "./ai-resilient.server";

const CommandSchema = z.object({ command: z.string().trim().min(2).max(2_000) });

type Db = SupabaseClient<Database>;
type ChatHistory = Array<{ role: "user" | "assistant"; content: string }>;

export type AngelCommandResult = {
  response: string;
  status: "completed" | "partial" | "not_connected" | "awaiting_approval";
  source: "openai" | "local";
  autoExecuted: boolean;
  actionId: string | null;
};

async function assertAdmin(context: { supabase: Db; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Accès réservé à l'administrateur.");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function requestedTitle(command: string, fallback: string) {
  const afterColon = command.includes(":") ? command.split(":").slice(1).join(":").trim() : "";
  const afterSur = command.match(/\b(?:sur|pour)\s+(.+)$/i)?.[1]?.trim() ?? "";
  return (
    afterColon ||
    afterSur ||
    command.replace(/^(ajoute|crée|cree|prépare|prepare)\s+/i, "").trim() ||
    fallback
  ).slice(0, 180);
}

function isExplicitOperationalCommand(command: string) {
  return /^(?:(?:s['’]il te plaît|stp|merci de|peux-tu|tu peux)\s+)?(?:envoie|envoyer|publie|publier|supprime|efface|paie|payer|rembourse|fusionne|merge|ajoute|crée|cree|corrige|modifie|déploie|deploie|programme)\b/i.test(command.trim());
}

function isSensitiveOperationalCommand(command: string) {
  return /^(?:(?:s['’]il te plaît|stp|merci de|peux-tu|tu peux)\s+)?(?:envoie|envoyer|publie|publier|supprime|efface|paie|payer|rembourse|fusionne|merge)\b/i.test(command.trim());
}

async function counts(db: Db) {
  const [applications, projects, tasks, articles, actions] = await Promise.all([
    db
      .from("applications")
      .select("company, city, position, status, sent_at, follow_up_at, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    db.from("projects").select("status").limit(300),
    db.from("project_tasks").select("status, due_date").limit(300),
    db.from("articles").select("published, scheduled_at").limit(300),
    db.from("ai_actions").select("status").eq("status", "pending").limit(300),
  ]);
  for (const result of [applications, projects, tasks, articles, actions]) {
    if (result.error) throw result.error;
  }
  const apps = (applications.data ?? []) as Array<Record<string, unknown>>;
  const due = apps.filter((row) => {
    const date = typeof row.follow_up_at === "string" ? row.follow_up_at : "";
    return date && date <= new Date().toISOString().slice(0, 10) && !["refusee", "acceptee"].includes(String(row.status));
  });
  return {
    applications: apps.length,
    applicationsSent: apps.filter((row) => row.status === "envoyee" || row.status === "relance").length,
    applicationsRejected: apps.filter((row) => row.status === "refusee").length,
    followUpsDue: due.length,
    recentApplications: apps.slice(0, 12),
    projects: (projects.data ?? []).length,
    openTasks: (tasks.data ?? []).filter((row: Record<string, unknown>) => row.status !== "termine").length,
    articles: (articles.data ?? []).length,
    drafts: (articles.data ?? []).filter((row: Record<string, unknown>) => !row.published).length,
    pendingActions: (actions.data ?? []).length,
  };
}

async function recentConversation(db: Db, excludeId: string): Promise<ChatHistory> {
  const { data, error } = await db
    .from("ai_messages")
    .select("id, content, response, status, created_at")
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) {
    console.error("[angel-ai] historique indisponible", error);
    return [];
  }
  return ((data ?? []) as Array<Record<string, unknown>>)
    .reverse()
    .flatMap((row) => {
      const out: ChatHistory = [];
      const content = typeof row.content === "string" ? row.content.trim() : "";
      const response = typeof row.response === "string" ? row.response.trim() : "";
      if (content) out.push({ role: "user", content: content.slice(0, 2_000) });
      if (response) out.push({ role: "assistant", content: response.slice(0, 3_000) });
      return out;
    })
    .slice(-12);
}

async function openAiAnswer(
  command: string,
  context: Awaited<ReturnType<typeof counts>>,
  history: ChatHistory,
) {
  const { aiMemoryPrompt } = await import("./ai-memory.server");
  const memory = await aiMemoryPrompt("all");
  const messages: AiMessage[] = [
    {
      role: "system",
      content:
        "Tu es Angel AI, l'assistant principal de l'espace administrateur privé Angel OS. OpenAI est le moteur conversationnel principal. Le moteur local Angel OS ne sert qu'à exécuter des actions déterministes ou comme secours si OpenAI est indisponible. La conversation est continue : utilise les échanges précédents, comprends les pronoms et les références comme « ça », « lui », « continue », « développe », sans obliger l'administrateur à répéter le contexte. Réponds concrètement et avec suffisamment de détail. Utilise l'état JSON de l'administration et la mémoire Angel OS quand ils sont pertinents. Une question reste une question même si elle contient des mots comme corriger, modifier, publier ou programmer : n'interprète pas ces mots comme une action à exécuter sauf si l'utilisateur formule clairement un ordre. Si une information dépend de données absentes ou d'une actualité non fournie, dis-le. N'affirme jamais qu'une action a été exécutée si elle ne l'a pas été. Les emails, publications, paiements, suppressions et autres actions externes ou irréversibles nécessitent une validation finale. Quand une modification technique doit être faite par ChatGPT, indique clairement ce qui doit être placé dans la file À faire par ChatGPT.",
    },
    ...history,
    {
      role: "user",
      content: `Demande actuelle : ${command}\n\nContexte interne actuel : ${JSON.stringify(context)}${memory}`,
    },
  ];
  const result = await resilientAngelAi({
    messages,
    priority: "interactive",
    maxTokens: 1_200,
    temperature: 0.35,
    cacheTtlMs: 60_000,
  });
  return result.text?.trim() ?? null;
}

function candidatureAnswer(state: Awaited<ReturnType<typeof counts>>) {
  const recent = state.recentApplications
    .slice(0, 6)
    .map((row) => `${row.company}${row.city ? ` (${row.city})` : ""} — ${row.status}`)
    .join("\n• ");
  return [
    `${state.applications} candidature(s) suivie(s) : ${state.applicationsSent} envoyée(s)/en attente, ${state.applicationsRejected} refusée(s), ${state.followUpsDue} relance(s) arrivée(s) à échéance.`,
    recent ? `Dernières entrées :\n• ${recent}` : "Aucune candidature enregistrée.",
  ].join("\n\n");
}

export const runAngelCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CommandSchema.parse(input))
  .handler(async ({ context, data }): Promise<AngelCommandResult> => {
    await assertAdmin(context);
    const db = context.supabase as Db;
    const { data: message, error: messageError } = await db
      .from("ai_messages")
      .insert({ author: "angel", content: data.command, status: "running", context: { source: "admin" } })
      .select("id")
      .single();
    if (messageError) throw messageError;

    try {
      const command = data.command.trim();
      let result: AngelCommandResult;

      if (/synchronis\w*.*(?:gmail|candidature)|(?:gmail|candidature).*synchronis/i.test(command)) {
        const { syncApplicationsForUser } = await import("./applications.server");
        const sync = await syncApplicationsForUser(context.userId, db);
        result = {
          response: sync.message,
          status: sync.status,
          source: "local",
          autoExecuted: sync.status !== "not_connected",
          actionId: null,
        };
      } else if (/^(?:(?:s['’]il te plaît|stp|merci de|peux-tu|tu peux)\s+)?(?:ajoute|crée|cree|note).*(?:tâche|tache)|^(?:tâche|tache)\s*:/i.test(command)) {
        const title = requestedTitle(command, "Nouvelle tâche");
        const { data: task, error } = await db
          .from("project_tasks")
          .insert({ title, status: "a_faire", priority: "normale", notes: "Créée par Angel AI." })
          .select("id")
          .single();
        if (error) throw error;
        await db.from("activity_log").insert({
          source: "ai",
          action: "create",
          entity_type: "project_tasks",
          entity_id: task.id,
          details: { title, command_id: message.id },
        });
        result = {
          response: `Tâche créée automatiquement : « ${title} ». Elle est disponible dans Projets → Tâches.`,
          status: "completed",
          source: "local",
          autoExecuted: true,
          actionId: null,
        };
      } else if (/^(?:(?:s['’]il te plaît|stp|merci de|peux-tu|tu peux)\s+)?(?:prépare|prepare|crée|cree|rédige|redige).*(?:article|brouillon)|^(?:article|brouillon)\s*:/i.test(command)) {
        const requested = requestedTitle(command, "Nouveau brouillon");
        const { generateArticleDraft } = await import("./article-ai.server");
        const generated = await generateArticleDraft(requested);
        const finalTitle = generated?.title || requested;
        const slug = `${slugify(finalTitle) || "brouillon"}-${Date.now().toString(36)}`;
        const { data: article, error } = await db
          .from("articles")
          .insert({
            title: finalTitle,
            slug,
            category: "Article",
            excerpt: generated?.excerpt || null,
            content: generated?.content || "",
            sources: generated?.sources ?? [],
            topics: generated?.topics ?? [],
            cover_url: generated?.coverUrl ?? null,
            cover_meta: generated?.coverMeta ?? {},
            published: false,
            published_at: null,
            author_id: context.userId,
            ai_disclosure: {
              personal: false,
              chatgpt: Boolean(generated),
              otherAi: false,
              otherAiName: "",
              images: false,
              imagesTool: generated?.coverUrl ? "Wikimedia Commons" : "",
            },
          })
          .select("id")
          .single();
        if (error) throw error;
        await db.from("activity_log").insert({
          source: "ai",
          action: generated ? "create_researched_draft" : "create_draft",
          entity_type: "articles",
          entity_id: article.id,
          details: {
            title: finalTitle,
            command_id: message.id,
            generated: Boolean(generated),
            source_count: generated?.sources.length ?? 0,
            image_source: generated?.coverMeta?.source ?? null,
          },
        });
        result = {
          response: generated
            ? `Brouillon complet créé automatiquement : « ${finalTitle} » — texte, ${generated.sources.length} source(s), catégories${generated.coverUrl ? " et image Wikimedia créditée" : ""}. Rien n'a été publié : vous pouvez relire et modifier avant publication.`
            : `Brouillon créé : « ${finalTitle} », mais OpenAI n'est pas disponible sur ce déploiement. Le brouillon reste non publié et modifiable.`,
          status: generated ? "completed" : "partial",
          source: generated ? "openai" : "local",
          autoExecuted: true,
          actionId: null,
        };
      } else {
        const state = await counts(db);
        const operational = isExplicitOperationalCommand(command);
        const sensitive = operational && isSensitiveOperationalCommand(command);

        if (operational) {
          const { data: action, error } = await db
            .from("ai_actions")
            .insert({
              kind: "chatgpt_task",
              title: command.slice(0, 160),
              description: sensitive
                ? "Tâche préparée par Angel AI pour ChatGPT. Une validation finale reste obligatoire avant toute action externe ou irréversible."
                : "Tâche créée par Angel AI dans la file À faire par ChatGPT. Elle n'est pas présentée comme exécutée tant que ChatGPT ne l'a pas réellement traitée.",
              payload: { command, command_id: message.id, execution: "chatgpt_operator" },
              status: "pending",
              target_type: "chatgpt",
              sensitive,
            })
            .select("id")
            .single();
          if (error) throw error;
          result = {
            response: sensitive
              ? "La tâche est ajoutée à « À faire par ChatGPT ». Une validation finale restera nécessaire avant l'action externe."
              : "La demande est ajoutée à « À faire par ChatGPT » et restera en attente jusqu'à son traitement réel.",
            status: "awaiting_approval",
            source: "local",
            autoExecuted: false,
            actionId: action.id,
          };
        } else {
          const history = await recentConversation(db, message.id);
          const generated = await openAiAnswer(command, state, history);
          if (generated) {
            result = {
              response: generated,
              status: "completed",
              source: "openai",
              autoExecuted: true,
              actionId: null,
            };
          } else {
            const localContext = /candidature|alternance|relance/i.test(command) ? candidatureAnswer(state) : null;
            result = {
              response:
                localContext ??
                "OpenAI est momentanément indisponible. Angel OS reste uniquement en secours et conserve les fonctions locales déterministes ; la conversation complète reprendra dès que le fournisseur IA répondra de nouveau.",
              status: "partial",
              source: "local",
              autoExecuted: true,
              actionId: null,
            };
          }
        }
      }

      const { error: completionError } = await db
        .from("ai_messages")
        .update({
          response: result.response,
          status: result.status,
          context: {
            source: result.source,
            auto_executed: result.autoExecuted,
            action_id: result.actionId,
            conversation: true,
          },
        })
        .eq("id", message.id);
      if (completionError) throw completionError;

      const { error: completionLogError } = await db.from("activity_log").insert({
        source: "ai",
        action: "command_completed",
        entity_type: "ai_messages",
        entity_id: message.id,
        details: { status: result.status, action_id: result.actionId, source: result.source },
      });
      if (completionLogError) throw completionLogError;
      return result;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue";
      const { error: failureStatusError } = await db
        .from("ai_messages")
        .update({ response: detail, status: "failed", context: { error: detail } })
        .eq("id", message.id);
      const { error: failureLogError } = await db.from("activity_log").insert({
        source: "ai",
        action: "command_failed",
        entity_type: "ai_messages",
        entity_id: message.id,
        details: { error: detail },
      });
      if (failureStatusError || failureLogError) {
        const loggingError = failureStatusError ?? failureLogError;
        throw new Error(`${detail} Journalisation impossible : ${loggingError?.message ?? "erreur inconnue"}`);
      }
      throw error;
    }
  });