import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const Schema = z.object({ command: z.string().trim().min(2).max(2_000) });
type Db = SupabaseClient<Database>;

export type ArticleCommandResult = {
  response: string;
  status: "completed" | "partial" | "awaiting_approval";
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

function requestedTitle(command: string) {
  const afterColon = command.includes(":") ? command.split(":").slice(1).join(":").trim() : "";
  const afterSur = command.match(/\b(?:sur|pour)\s+(.+)$/i)?.[1]?.trim() ?? "";
  return (
    afterColon ||
    afterSur ||
    command.replace(/^(ajoute|crée|cree|prépare|prepare|rédige|redige)\s+/i, "").trim() ||
    "Nouveau brouillon"
  ).slice(0, 180);
}

export function isArticleCommand(command: string) {
  return /(?:prépare|prepare|crée|cree|rédige|redige|écris|ecris).*(?:article|brouillon)|(?:article|brouillon)\s*:/i.test(
    command,
  );
}

export const runArticleCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ context, data }): Promise<ArticleCommandResult> => {
    await assertAdmin(context);
    const db = context.supabase as Db;
    const requested = requestedTitle(data.command);

    const { data: message, error: messageError } = await db
      .from("ai_messages")
      .insert({
        author: "angel",
        content: data.command,
        status: "running",
        context: { source: "admin", kind: "article_generation" },
      })
      .select("id")
      .single();
    if (messageError) throw messageError;

    try {
      const { generateArticleDraft } = await import("./article-ai.server");
      const generated = await generateArticleDraft(requested);

      if (!generated) {
        const { data: action, error: actionError } = await db
          .from("ai_actions")
          .insert({
            kind: "article_generation_request",
            title: `Article : ${requested}`.slice(0, 160),
            description:
              "Génération complète différée : recherche web, rédaction, sources, catégories et image créditée. Aucun article vide n'a été créé.",
            payload: {
              command: data.command,
              subject: requested,
              command_id: message.id,
              execution: "deferred_ai_required",
              requested_at: new Date().toISOString(),
            },
            status: "pending",
            target_type: "articles",
            sensitive: false,
          })
          .select("id")
          .single();
        if (actionError) throw actionError;

        const response =
          `La génération complète de « ${requested} » n'est pas disponible immédiatement. ` +
          "La demande a été mise en attente dans Angel OS, sans créer de brouillon vide ni inventer de sources. Elle pourra être reprise dès qu'un moteur IA sécurisé est disponible.";

        await db
          .from("ai_messages")
          .update({
            response,
            status: "partial",
            context: {
              source: "local",
              auto_executed: false,
              action_id: action.id,
              kind: "article_generation",
              queued: true,
            },
          })
          .eq("id", message.id);

        await db.from("activity_log").insert({
          source: "ai",
          action: "queue_article_generation",
          entity_type: "ai_actions",
          entity_id: action.id,
          details: { subject: requested, command_id: message.id },
        });

        return {
          response,
          status: "partial",
          source: "local",
          autoExecuted: false,
          actionId: action.id,
        };
      }

      const finalTitle = generated.title || requested;
      const slug = `${slugify(finalTitle) || "brouillon"}-${Date.now().toString(36)}`;
      const { data: article, error } = await db
        .from("articles")
        .insert({
          title: finalTitle,
          slug,
          category: "Article",
          excerpt: generated.excerpt || null,
          content: generated.content,
          sources: generated.sources,
          topics: generated.topics,
          cover_url: generated.coverUrl,
          cover_meta: generated.coverMeta ?? {},
          published: false,
          published_at: null,
          author_id: context.userId,
          ai_disclosure: {
            personal: false,
            chatgpt: true,
            otherAi: false,
            otherAiName: "",
            images: false,
            imagesTool: generated.coverUrl ? "Wikimedia Commons" : "",
          },
        })
        .select("id")
        .single();
      if (error) throw error;

      const response =
        `Brouillon complet créé automatiquement : « ${finalTitle} » — texte, ${generated.sources.length} source(s), catégories` +
        `${generated.coverUrl ? " et image Wikimedia créditée" : ""}. Rien n'a été publié : vous pouvez relire et modifier avant publication.`;

      await db
        .from("ai_messages")
        .update({
          response,
          status: "completed",
          context: {
            source: "openai",
            auto_executed: true,
            action_id: null,
            kind: "article_generation",
            article_id: article.id,
          },
        })
        .eq("id", message.id);

      await db.from("activity_log").insert({
        source: "ai",
        action: "create_researched_draft",
        entity_type: "articles",
        entity_id: article.id,
        details: {
          title: finalTitle,
          command_id: message.id,
          source_count: generated.sources.length,
          image_source: generated.coverMeta?.source ?? null,
        },
      });

      return {
        response,
        status: "completed",
        source: "openai",
        autoExecuted: true,
        actionId: null,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Erreur inconnue";
      await db
        .from("ai_messages")
        .update({
          response: detail,
          status: "failed",
          context: { error: detail, kind: "article_generation" },
        })
        .eq("id", message.id);
      await db.from("activity_log").insert({
        source: "ai",
        action: "article_generation_failed",
        entity_type: "ai_messages",
        entity_id: message.id,
        details: { error: detail },
      });
      throw error;
    }
  });
