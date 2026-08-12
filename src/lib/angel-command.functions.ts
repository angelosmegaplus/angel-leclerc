import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CommandSchema = z.object({ command: z.string().trim().min(2).max(2_000) });

type Db = SupabaseClient<Database>;

export type AngelCommandResult = {
  response: string;
  status: "completed" | "awaiting_approval";
  source: "openai" | "local";
  autoExecuted: boolean;
  actionId: string | null;
};

async function assertAdmin(context: { supabase: Db; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
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

async function counts(db: Db) {
  const [applications, projects, tasks, articles, actions] = await Promise.all([
    db
      .from("applications")
      .select("company, city, position, status, sent_at, follow_up_at")
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
    return (
      date &&
      date <= new Date().toISOString().slice(0, 10) &&
      !["refusee", "acceptee"].includes(String(row.status))
    );
  });
  return {
    applications: apps.length,
    applicationsSent: apps.filter((row) => row.status === "envoyee" || row.status === "relance")
      .length,
    applicationsRejected: apps.filter((row) => row.status === "refusee").length,
    followUpsDue: due.length,
    recentApplications: apps.slice(0, 8),
    projects: (projects.data ?? []).length,
    openTasks: (tasks.data ?? []).filter((row: Record<string, unknown>) => row.status !== "termine")
      .length,
    articles: (articles.data ?? []).length,
    drafts: (articles.data ?? []).filter((row: Record<string, unknown>) => !row.published).length,
    pendingActions: (actions.data ?? []).length,
  };
}

async function openAiAnswer(command: string, context: Awaited<ReturnType<typeof counts>>) {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              "Tu es Angel AI dans un espace administrateur privé. Réponds en français, brièvement, uniquement à partir des données JSON fournies. N'affirme jamais qu'une action a été exécutée. Les emails, publications, paiements, suppressions et actions externes nécessitent une validation finale.",
          },
          { role: "user", content: `Commande: ${command}\nÉtat réel: ${JSON.stringify(context)}` },
        ],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function candidatureAnswer(state: Awaited<ReturnType<typeof counts>>) {
  const recent = state.recentApplications
    .slice(0, 5)
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
      .insert({
        author: "angel",
        content: data.command,
        status: "running",
        context: { source: "admin" },
      })
      .select("id")
      .single();
    if (messageError) throw messageError;

    try {
      const command = data.command.trim();
      const lower = command.toLowerCase();
      let result: AngelCommandResult;

      if (/synchronis\w*.*(?:gmail|candidature)|(?:gmail|candidature).*synchronis/i.test(command)) {
        const { syncApplicationsForUser } = await import("./applications.server");
        const sync = await syncApplicationsForUser(context.userId, db);
        result = {
          response: sync.message,
          status: "completed",
          source: "local",
          autoExecuted: sync.status === "completed",
          actionId: null,
        };
      } else if (/(?:ajoute|crée|cree|note).*(?:tâche|tache)|(?:tâche|tache)\s*:/i.test(command)) {
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
      } else if (/prépare.*(?:article|brouillon)|(?:article|brouillon)\s*:/i.test(command)) {
        const title = requestedTitle(command, "Nouveau brouillon");
        const slug = `${slugify(title) || "brouillon"}-${Date.now().toString(36)}`;
        const { data: article, error } = await db
          .from("articles")
          .insert({
            title,
            slug,
            category: "Article",
            excerpt: null,
            content: "",
            published: false,
            published_at: null,
            author_id: context.userId,
            ai_disclosure: {
              personal: false,
              chatgpt: false,
              otherAi: true,
              otherAiName: "Angel AI",
              images: false,
              imagesTool: "",
            },
          })
          .select("id")
          .single();
        if (error) throw error;
        await db.from("activity_log").insert({
          source: "ai",
          action: "create_draft",
          entity_type: "articles",
          entity_id: article.id,
          details: { title, command_id: message.id },
        });
        result = {
          response: `Brouillon créé automatiquement : « ${title} ». Rien n'a été publié.`,
          status: "completed",
          source: "local",
          autoExecuted: true,
          actionId: null,
        };
      } else {
        const state = await counts(db);
        const sensitive =
          /\b(envoie|envoyer|publie|publier|supprime|efface|paie|payer|rembourse|fusionne|merge)\b/i.test(
            command,
          );
        const operational =
          sensitive ||
          /\b(ajoute|crée|cree|corrige|modifie|déploie|deploie|programme)\b/i.test(command);
        if (operational) {
          const { data: action, error } = await db
            .from("ai_actions")
            .insert({
              kind: "operator_request",
              title: command.slice(0, 160),
              description: sensitive
                ? "Action préparée par Angel AI. Une validation finale reste obligatoire avant toute action externe ou irréversible."
                : "Demande enregistrée pour l'opérateur technique. L'interface ne prétend pas l'avoir exécutée.",
              payload: { command, command_id: message.id, execution: "operator_required" },
              status: "pending",
              target_type: "system",
              sensitive,
            })
            .select("id")
            .single();
          if (error) throw error;
          result = {
            response: sensitive
              ? "La préparation est enregistrée. Angel OS attend une validation finale unique avant l'action externe."
              : "La demande est enregistrée et tracée pour l'opérateur IA. Elle n'est pas présentée comme exécutée tant qu'aucun agent ne l'a réellement traitée.",
            status: "awaiting_approval",
            source: "local",
            autoExecuted: false,
            actionId: action.id,
          };
        } else if (/candidature|alternance|relance/i.test(lower)) {
          result = {
            response: candidatureAnswer(state),
            status: "completed",
            source: "local",
            autoExecuted: true,
            actionId: null,
          };
        } else {
          const generated = await openAiAnswer(command, state);
          result = {
            response:
              generated ??
              `État réel : ${state.applications} candidature(s), ${state.openTasks} tâche(s) ouverte(s), ${state.projects} projet(s), ${state.articles} article(s), ${state.pendingActions} action(s) en attente. Demandez par exemple « analyse mes candidatures », « crée une tâche : … » ou « prépare un brouillon sur … ».`,
            status: "completed",
            source: generated ? "openai" : "local",
            autoExecuted: true,
            actionId: null,
          };
        }
      }

      await db
        .from("ai_messages")
        .update({
          response: result.response,
          status: result.status,
          context: {
            source: result.source,
            auto_executed: result.autoExecuted,
            action_id: result.actionId,
          },
        })
        .eq("id", message.id);
      await db.from("activity_log").insert({
        source: "ai",
        action: "command_completed",
        entity_type: "ai_messages",
        entity_id: message.id,
        details: { status: result.status, action_id: result.actionId },
      });
      return result;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue";
      await db
        .from("ai_messages")
        .update({ response: detail, status: "failed", context: { error: detail } })
        .eq("id", message.id);
      await db.from("activity_log").insert({
        source: "ai",
        action: "command_failed",
        entity_type: "ai_messages",
        entity_id: message.id,
        details: { error: detail },
      });
      throw error;
    }
  });
