import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { Article } from "@/lib/articles-types";
import { fetchAllArticles } from "@/lib/articles";
import { recordAngelOperation } from "@/lib/angel-runtime.server";

type Db = SupabaseClient<Database>;

type ActionResult = {
  executed: boolean;
  response?: string;
  actionId?: string | null;
  kind?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[«»"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Les colonnes JSONB sont typées `Json` : on convertit explicitement. */
function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

/** `badges` peut être n'importe quelle valeur JSON : on ne spread qu'un objet. */
function asJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stripArticlePrefix(value: string) {
  return value
    .replace(/^(?:l['’]\s*)?article\s+/i, "")
    .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
    .replace(/^[«"']|[»"']$/g, "")
    .trim();
}

async function findArticle(target: string): Promise<Article | null> {
  const wanted = normalize(stripArticlePrefix(target));
  if (!wanted) return null;
  const articles = await fetchAllArticles();

  const exact = articles.find(
    (article) => normalize(article.slug) === wanted || normalize(article.title) === wanted,
  );
  if (exact) return exact;

  const candidates = articles.filter((article) => {
    const title = normalize(article.title);
    const slug = normalize(article.slug);
    return title.includes(wanted) || wanted.includes(title) || slug.includes(wanted);
  });
  return candidates.length === 1 ? candidates[0] : null;
}

async function writeAction(
  db: Db,
  input: {
    kind: string;
    title: string;
    description: string;
    payload: Record<string, unknown>;
    status: "pending" | "completed" | "failed";
    targetType?: string;
    sensitive?: boolean;
  },
) {
  const { data, error } = await db
    .from("ai_actions")
    .insert({
      kind: input.kind,
      title: input.title.slice(0, 160),
      description: input.description.slice(0, 1200),
      payload: toJson(input.payload),
      status: input.status,
      target_type: input.targetType ?? null,
      sensitive: input.sensitive ?? false,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function logActivity(
  db: Db,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
) {
  await db.from("activity_log").insert({
    source: "ai",
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: toJson(details),
  });
}

function articleOverride(article: Article, userId: string, patch: Partial<Article>) {
  return {
    id: article.id?.startsWith("github:") ? undefined : article.id,
    title: article.title,
    slug: article.slug,
    category: article.category || "Article",
    excerpt: article.excerpt ?? null,
    content: article.content || "",
    cover_url: article.cover_url ?? null,
    published: article.published,
    published_at: article.published_at ?? null,
    scheduled_at: article.scheduled_at ?? null,
    is_private: article.is_private === true,
    featured: article.featured === true,
    attachments: article.attachments ?? [],
    sources: article.sources ?? [],
    topics: article.topics ?? [],
    badges: article.badges ?? {},
    ai_disclosure: article.ai_disclosure ?? {},
    cover_meta: article.cover_meta ?? {},
    author_id: article.author_id || userId,
    created_at: article.created_at,
    updated_at: new Date().toISOString(),
    ...patch,
  };
}

async function deleteArticle(db: Db, userId: string, target: string): Promise<ActionResult> {
  const article = await findArticle(target);
  if (!article) {
    return {
      executed: false,
      response: `Je n’ai pas trouvé un article unique correspondant à « ${stripArticlePrefix(target)} ». Je n’ai rien supprimé.`,
      kind: "article_delete",
    };
  }

  const now = new Date().toISOString();
  const actionId = await writeAction(db, {
    kind: "article_delete",
    title: `Supprimer : ${article.title}`,
    description: "Suppression explicitement demandée depuis Angel OS IA. Un tombstone Supabase masque toutes les sources historiques par slug.",
    payload: { article_id: article.id, slug: article.slug, title: article.title, requested_at: now },
    status: "pending",
    targetType: "articles",
    sensitive: true,
  });

  try {
    const override = articleOverride(article, userId, {
      published: false,
      published_at: null,
      scheduled_at: null,
      is_private: true,
      featured: false,
      badges: { ...asJsonObject(article.badges), __angel_os_deleted: true, deleted_at: now, deleted_by: "angel-os-ia" },
    });
    const { error } = await db.from("articles").upsert(override as any, { onConflict: "slug" });
    if (error) throw error;

    await db.from("ai_actions").update({ status: "completed", updated_at: now }).eq("id", actionId);
    await logActivity(db, "ai_delete_article", "articles", article.id ?? null, {
      slug: article.slug,
      title: article.title,
      action_id: actionId,
    });
    await recordAngelOperation({
      type: "angel-os-ia.action.article-delete",
      source: "angel-os-ia",
      ok: true,
      payload: { slug: article.slug, actionId },
    });

    return {
      executed: true,
      response: `Article « ${article.title} » supprimé et masqué de toutes les sources publiques connues. Action enregistrée : ${actionId}.`,
      actionId,
      kind: "article_delete",
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await db.from("ai_actions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", actionId);
    await recordAngelOperation({
      type: "angel-os-ia.action.article-delete",
      source: "angel-os-ia",
      ok: false,
      payload: { slug: article.slug, actionId, error: detail },
    });
    throw error;
  }
}

async function unpublishArticle(db: Db, userId: string, target: string): Promise<ActionResult> {
  const article = await findArticle(target);
  if (!article) {
    return {
      executed: false,
      response: `Je n’ai pas trouvé un article unique correspondant à « ${stripArticlePrefix(target)} ». Je n’ai rien modifié.`,
      kind: "article_unpublish",
    };
  }
  const now = new Date().toISOString();
  const actionId = await writeAction(db, {
    kind: "article_unpublish",
    title: `Dépublier : ${article.title}`,
    description: "Dépublication explicitement demandée depuis Angel OS IA.",
    payload: { article_id: article.id, slug: article.slug, title: article.title, requested_at: now },
    status: "pending",
    targetType: "articles",
  });

  const override = articleOverride(article, userId, {
    published: false,
    published_at: null,
    scheduled_at: null,
  });
  const { error } = await db.from("articles").upsert(override as any, { onConflict: "slug" });
  if (error) {
    await db.from("ai_actions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", actionId);
    throw error;
  }
  await db.from("ai_actions").update({ status: "completed", updated_at: now }).eq("id", actionId);
  await logActivity(db, "ai_unpublish_article", "articles", article.id ?? null, { slug: article.slug, action_id: actionId });
  await recordAngelOperation({ type: "angel-os-ia.action.article-unpublish", source: "angel-os-ia", ok: true, payload: { slug: article.slug, actionId } });

  return {
    executed: true,
    response: `Article « ${article.title} » dépublié. Il reste conservé dans Studio mais n’est plus public. Action enregistrée : ${actionId}.`,
    actionId,
    kind: "article_unpublish",
  };
}

async function renameArticle(db: Db, userId: string, target: string, newTitle: string): Promise<ActionResult> {
  const article = await findArticle(target);
  const title = newTitle.trim().replace(/^[«"']|[»"']$/g, "");
  if (!article || !title) {
    return { executed: false, response: "Je n’ai pas pu identifier de façon certaine l’article ou le nouveau titre. Je n’ai rien modifié.", kind: "article_rename" };
  }
  const now = new Date().toISOString();
  const actionId = await writeAction(db, {
    kind: "article_rename",
    title: `Renommer : ${article.title}`,
    description: `Modification explicite du titre en « ${title} » depuis Angel OS IA.`,
    payload: { article_id: article.id, slug: article.slug, previous_title: article.title, new_title: title, requested_at: now },
    status: "pending",
    targetType: "articles",
  });
  const override = articleOverride(article, userId, { title });
  const { error } = await db.from("articles").upsert(override as any, { onConflict: "slug" });
  if (error) {
    await db.from("ai_actions").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", actionId);
    throw error;
  }
  await db.from("ai_actions").update({ status: "completed", updated_at: now }).eq("id", actionId);
  await logActivity(db, "ai_rename_article", "articles", article.id ?? null, { slug: article.slug, previous_title: article.title, new_title: title, action_id: actionId });
  await recordAngelOperation({ type: "angel-os-ia.action.article-rename", source: "angel-os-ia", ok: true, payload: { slug: article.slug, actionId } });

  return {
    executed: true,
    response: `Titre modifié : « ${article.title} » → « ${title} ». Action enregistrée : ${actionId}.`,
    actionId,
    kind: "article_rename",
  };
}

export async function recordMaintenanceReport(db: Db, command: string) {
  if (!/\b(?:bug|probl[eè]me|erreur|cass[eé]|ne marche pas|fonctionne pas|anomalie)\b/i.test(command)) return null;
  const now = new Date().toISOString();
  const actionId = await writeAction(db, {
    kind: "maintenance_report",
    title: `Signalement Angel OS IA · ${command.slice(0, 100)}`,
    description: command,
    payload: {
      report: command,
      source: "angel-os-ia-chat",
      requested_at: now,
      policy: "Evidence required before any automatic code repair",
    },
    status: "pending",
    targetType: "maintenance",
  });
  await logActivity(db, "ai_record_maintenance_report", "ai_actions", actionId, { report: command });
  await recordAngelOperation({ type: "angel-os-ia.maintenance-report.created", source: "angel-os-ia", ok: true, payload: { actionId } });
  return actionId;
}

export async function tryExecuteExplicitAdminAction(
  db: Db,
  userId: string,
  command: string,
): Promise<ActionResult> {
  const trimmed = command.trim();

  const deleteMatch = trimmed.match(/^(?:supprime|efface|retire|delete)\s+(?:définitivement\s+)?(?:l['’]\s*)?article\s+(.+)$/i);
  if (deleteMatch?.[1]) return deleteArticle(db, userId, deleteMatch[1]);

  const unpublishMatch = trimmed.match(/^(?:dépublie|depublie|masque)\s+(?:l['’]\s*)?article\s+(.+)$/i);
  if (unpublishMatch?.[1]) return unpublishArticle(db, userId, unpublishMatch[1]);

  const renameMatch = trimmed.match(/^(?:renomme|change\s+le\s+titre\s+de)\s+(?:l['’]\s*)?article\s+(.+?)\s+(?:en|par)\s+(.+)$/i);
  if (renameMatch?.[1] && renameMatch?.[2]) return renameArticle(db, userId, renameMatch[1], renameMatch[2]);

  return { executed: false };
}
