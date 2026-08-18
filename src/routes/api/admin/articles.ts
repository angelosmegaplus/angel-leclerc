import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const REPOSITORY = "angelosmegaplus/angel-leclerc";
const BRANCH = "main";
const CONTENT_DIR = "src/content/articles-data";
const TOMBSTONE_DIR = "src/content/article-tombstones";
const PUBLIC_SUPABASE_URL = "https://timygavajdestkbdzuyk.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8IG8jsDj3yWH7u7urAQPig_r2V8Wd9s";

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

function githubToken() {
  return (process.env.GITHUB_CONTENT_TOKEN || process.env.GITHUB_TOKEN || "").trim();
}

function serviceRoleKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).trim();
}

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Angel-OS-Article-CMS",
  };
}

async function validateAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const token = auth.slice(7).trim();
  if (!token) throw new Error("AUTH_REQUIRED");

  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY).trim();
  const supabase = createClient(supabaseUrl(), key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) throw new Error("AUTH_INVALID");

  const { data: role, error: roleError } = await supabase
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

async function getSha(path: string, token: string): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/contents/${path}?ref=${BRANCH}`,
    { headers: githubHeaders(token), cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as { sha?: string };
  return body.sha || null;
}

async function putFile(path: string, data: unknown, message: string, token: string) {
  const sha = await getSha(path, token);
  const body: Record<string, unknown> = {
    message,
    branch: BRANCH,
    content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64"),
  };
  if (sha) body.sha = sha;
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${path}`, {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  return response.json() as Promise<{ commit?: { sha?: string } }>;
}

async function deleteFile(path: string, message: string, token: string) {
  const sha = await getSha(path, token);
  if (!sha) return null;
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${path}`, {
    method: "DELETE",
    headers: githubHeaders(token),
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  return response.json() as Promise<{ commit?: { sha?: string } }>;
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
    ai_disclosure: raw.ai_disclosure && typeof raw.ai_disclosure === "object" ? raw.ai_disclosure : {},
    cover_meta: raw.cover_meta && typeof raw.cover_meta === "object" ? raw.cover_meta : {},
    author_id: typeof raw.author_id === "string" && raw.author_id ? raw.author_id : userId,
    updated_at: now,
  };
}

async function saveViaSupabase(raw: Record<string, unknown>, userId: string, slug: string) {
  const db = adminSupabase();
  const article = normalizeArticle(raw, userId, slug);
  const { data: existing, error: existingError } = await db
    .from("articles")
    .select("id,created_at,published_at")
    .eq("slug", slug)
    .maybeSingle();
  if (existingError) throw existingError;

  const row = {
    ...article,
    ...(existing?.id ? { id: existing.id } : {}),
    ...(existing?.created_at ? { created_at: existing.created_at } : {}),
    published_at: article.published
      ? (article.scheduled_at || existing?.published_at || article.published_at)
      : null,
  };

  const { error } = await db.from("articles").upsert(row as any, { onConflict: "slug" });
  if (error) throw error;

  const hiddenFromPublic = !article.published || article.is_private;
  if (hiddenFromPublic) {
    const { error: stateError } = await db
      .from("git_article_state")
      .upsert({ slug, deleted: true, deleted_at: new Date().toISOString() }, { onConflict: "slug" });
    if (stateError) throw stateError;
  } else {
    await db.from("git_article_state").delete().eq("slug", slug);
  }

  return { ok: true, slug, backend: "supabase-fallback" as const };
}

async function deleteViaSupabase(slug: string) {
  const db = adminSupabase();
  const { error: deleteError } = await db.from("articles").delete().eq("slug", slug);
  if (deleteError) throw deleteError;
  const { error: stateError } = await db
    .from("git_article_state")
    .upsert({ slug, deleted: true, deleted_at: new Date().toISOString() }, { onConflict: "slug" });
  if (stateError) throw stateError;
  return { ok: true, slug, backend: "supabase-fallback" as const };
}

export const Route = createFileRoute("/api/admin/articles")({
  server: {
    handlers: {
      GET: async () => Response.json({
        ok: true,
        githubConfigured: Boolean(githubToken()),
        supabaseServiceRoleConfigured: Boolean(serviceRoleKey()),
      }, { headers }),
      POST: async ({ request }) => {
        try {
          const userId = await validateAdmin(request);
          const input = (await request.json()) as {
            action?: "save" | "delete";
            article?: Record<string, unknown>;
            slug?: string;
          };
          const token = githubToken();

          if (input.action === "delete") {
            const slug = slugify(String(input.slug || ""));
            if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400, headers });

            if (!token) return Response.json(await deleteViaSupabase(slug), { headers });

            await deleteFile(`${CONTENT_DIR}/${slug}.json`, `Delete article: ${slug}`, token);
            const tombstone = {
              slug,
              deleted: true,
              deleted_at: new Date().toISOString(),
              reason: "Deleted from Angel OS article editor",
            };
            const result = await putFile(
              `${TOMBSTONE_DIR}/${slug}.json`,
              tombstone,
              `Tombstone article: ${slug}`,
              token,
            );
            return Response.json({ ok: true, slug, backend: "github", commitSha: result.commit?.sha ?? null }, { headers });
          }

          if (input.action === "save") {
            const raw = input.article || {};
            const title = String(raw.title || "").trim();
            const slug = slugify(String(raw.slug || title));
            if (!title || !slug) return Response.json({ error: "Titre ou slug manquant." }, { status: 400, headers });

            if (!token) return Response.json(await saveViaSupabase(raw, userId, slug), { headers });

            const now = new Date().toISOString();
            const article = {
              ...raw,
              id: String(raw.id || `github:${slug}`),
              slug,
              title,
              author_id: raw.author_id || userId,
              created_at: String(raw.created_at || now),
              updated_at: now,
            };

            await deleteFile(`${TOMBSTONE_DIR}/${slug}.json`, `Restore article: ${slug}`, token);
            const result = await putFile(
              `${CONTENT_DIR}/${slug}.json`,
              article,
              `${raw.id ? "Update" : "Create"} article: ${title}`,
              token,
            );
            return Response.json({ ok: true, slug, backend: "github", commitSha: result.commit?.sha ?? null }, { headers });
          }

          return Response.json({ error: "Action inconnue." }, { status: 400, headers });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          const status = message === "AUTH_REQUIRED" || message === "AUTH_INVALID" ? 401 : message === "ADMIN_REQUIRED" ? 403 : message === "ARTICLE_STORAGE_UNAVAILABLE" ? 503 : 500;
          console.error("[article-api] mutation failed", error);
          return Response.json({ error: message }, { status, headers });
        }
      },
    },
  },
});
