import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Route d'écriture unique du module Articles.
 * Elle n'écrit QUE dans la base native du projet : plus de fichiers GitHub,
 * plus de pierres tombales de dépôt, plus de synchronisation externe.
 */

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
}

function publishableKey() {
  return (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
}

function serviceRoleKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
}

async function validateAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const token = auth.slice(7).trim();
  if (!token) throw new Error("AUTH_REQUIRED");

  const client = createClient(supabaseUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) throw new Error("AUTH_INVALID");

  const { data: role, error: roleError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) throw new Error("ADMIN_REQUIRED");
  return userId;
}

function adminSupabase() {
  const key = serviceRoleKey();
  if (!key) throw new Error("ARTICLE_STORAGE_UNAVAILABLE");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeArticle(raw: Record<string, unknown>, userId: string, slug: string) {
  const now = new Date().toISOString();
  const published = raw.published === true;
  const scheduledAt = typeof raw.scheduled_at === "string" && raw.scheduled_at ? raw.scheduled_at : null;
  const publishedAt = published
    ? (typeof raw.published_at === "string" && raw.published_at ? raw.published_at : scheduledAt || now)
    : null;

  return {
    title: String(raw.title || "").trim(),
    slug,
    category: String(raw.category || "Article"),
    excerpt: typeof raw.excerpt === "string" && raw.excerpt.trim() ? raw.excerpt.trim() : null,
    content: String(raw.content || ""),
    cover_url: typeof raw.cover_url === "string" && raw.cover_url.trim() ? raw.cover_url.trim() : null,
    published,
    published_at: publishedAt,
    scheduled_at: scheduledAt,
    is_private: raw.is_private === true,
    featured: raw.featured === true,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    badges: {},
    ai_disclosure: raw.ai_disclosure && typeof raw.ai_disclosure === "object" ? raw.ai_disclosure : {},
    cover_meta: raw.cover_meta && typeof raw.cover_meta === "object" ? raw.cover_meta : {},
    author_id: typeof raw.author_id === "string" && raw.author_id ? raw.author_id : userId,
    updated_at: now,
  };
}

async function saveArticle(raw: Record<string, unknown>, userId: string, slug: string) {
  const db = adminSupabase();
  const article = normalizeArticle(raw, userId, slug);

  const { data: existing, error: existingError } = await db
    .from("articles")
    .select("id,created_at,published_at")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;

  // Renommage : on retrouve la ligne par identifiant pour renommer au lieu de dupliquer.
  const rawId = typeof raw.id === "string" ? raw.id.trim() : "";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  let renamedFrom: string | null = null;
  let current = existing;

  if (!current && isUuid) {
    const { data: byId, error: byIdError } = await db
      .from("articles")
      .select("id,slug,created_at,published_at")
      .eq("id", rawId)
      .maybeSingle();
    if (byIdError) throw byIdError;
    if (byId) {
      current = { id: byId.id, created_at: byId.created_at, published_at: byId.published_at };
      if (byId.slug && byId.slug !== slug) renamedFrom = byId.slug;
    }
  }

  const row = {
    ...article,
    ...(current?.id ? { id: current.id } : {}),
    ...(current?.created_at ? { created_at: current.created_at } : {}),
    published_at: article.published
      ? (article.scheduled_at || current?.published_at || article.published_at)
      : null,
  };

  const { error } = await db.from("articles").upsert(row as any, { onConflict: "slug" });
  if (error) throw error;

  return { ok: true, slug, renamedFrom, backend: "lovable-cloud" as const };
}

/** Suppression = corbeille : la ligne reste en base, invisible du site et du Studio. */
async function trashArticle(slug: string) {
  const db = adminSupabase();
  const { data: existing, error: existingError } = await db
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("ARTICLE_NOT_FOUND");

  const now = new Date().toISOString();
  const { error } = await db
    .from("articles")
    .update({
      published: false,
      published_at: null,
      scheduled_at: null,
      is_private: true,
      featured: false,
      badges: { __angel_os_deleted: true, deleted_at: now },
      updated_at: now,
    } as any)
    .eq("slug", slug);
  if (error) throw error;
  return { ok: true, slug, backend: "lovable-cloud" as const };
}

/** Restauration : l'article revient en brouillon privé, jamais republié automatiquement. */
async function restoreArticle(slug: string) {
  const db = adminSupabase();
  const { data: existing, error: existingError } = await db
    .from("articles")
    .select("badges")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("ARTICLE_NOT_FOUND");

  const badges = (existing.badges && typeof existing.badges === "object" && !Array.isArray(existing.badges)
    ? { ...(existing.badges as Record<string, unknown>) }
    : {}) as Record<string, unknown>;
  delete badges.__angel_os_deleted;
  delete badges.deleted_at;
  delete badges.deleted_by;

  const { error } = await db
    .from("articles")
    .update({ badges, published: false, is_private: true, updated_at: new Date().toISOString() } as any)
    .eq("slug", slug);
  if (error) throw error;
  return { ok: true, slug, backend: "lovable-cloud" as const };
}

/** Suppression définitive : uniquement depuis la corbeille. */
async function purgeArticle(slug: string) {
  const db = adminSupabase();
  const { data: existing, error: existingError } = await db
    .from("articles")
    .select("badges")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;
  const badges = existing?.badges as Record<string, unknown> | null | undefined;
  if (!existing || !badges || badges.__angel_os_deleted !== true) throw new Error("PURGE_REQUIRES_TRASH");

  const { error } = await db.from("articles").delete().eq("slug", slug);
  if (error) throw error;
  return { ok: true, slug, backend: "lovable-cloud" as const };
}

export const Route = createFileRoute("/api/admin/articles")({
  server: {
    handlers: {
      GET: async () => Response.json({
        ok: true,
        storage: "lovable-cloud",
        storageConfigured: Boolean(serviceRoleKey()),
      }, { headers }),
      POST: async ({ request }) => {
        try {
          const userId = await validateAdmin(request);
          const input = (await request.json()) as {
            action?: "save" | "delete" | "restore" | "purge";
            article?: Record<string, unknown>;
            slug?: string;
          };

          if (input.action === "delete") {
            const slug = slugify(String(input.slug || ""));
            if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400, headers });
            return Response.json(await trashArticle(slug), { headers });
          }

          if (input.action === "restore") {
            const slug = slugify(String(input.slug || ""));
            if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400, headers });
            return Response.json(await restoreArticle(slug), { headers });
          }

          if (input.action === "purge") {
            const slug = slugify(String(input.slug || ""));
            if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400, headers });
            return Response.json(await purgeArticle(slug), { headers });
          }

          if (input.action === "save") {
            const raw = input.article || {};
            const title = String(raw.title || "").trim();
            const slug = slugify(String(raw.slug || title));
            if (!title || !slug) return Response.json({ error: "Titre ou slug manquant." }, { status: 400, headers });
            return Response.json(await saveArticle(raw, userId, slug), { headers });
          }

          return Response.json({ error: "Action inconnue." }, { status: 400, headers });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          const status = message === "AUTH_REQUIRED" || message === "AUTH_INVALID"
            ? 401
            : message === "ADMIN_REQUIRED"
              ? 403
              : message === "ARTICLE_STORAGE_UNAVAILABLE"
                ? 503
                : message === "ARTICLE_NOT_FOUND"
                  ? 404
                  : 500;
          console.error("[article-api] mutation failed", error);
          return Response.json({ error: message }, { status, headers });
        }
      },
    },
  },
});
