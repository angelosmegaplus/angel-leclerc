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

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL).trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY).trim();
  const supabase = createClient(url, key, {
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

export const Route = createFileRoute("/api/admin/articles")({
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, githubConfigured: Boolean(githubToken()) }, { headers }),
      POST: async ({ request }) => {
        try {
          const userId = await validateAdmin(request);
          const token = githubToken();
          if (!token) {
            return Response.json(
              { error: "Le stockage GitHub est prêt, mais GITHUB_CONTENT_TOKEN manque côté serveur." },
              { status: 503, headers },
            );
          }

          const input = (await request.json()) as {
            action?: "save" | "delete";
            article?: Record<string, unknown>;
            slug?: string;
          };

          if (input.action === "delete") {
            const slug = slugify(String(input.slug || ""));
            if (!slug) return Response.json({ error: "Slug manquant." }, { status: 400, headers });
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
            return Response.json({ ok: true, slug, commitSha: result.commit?.sha ?? null }, { headers });
          }

          if (input.action === "save") {
            const raw = input.article || {};
            const title = String(raw.title || "").trim();
            const slug = slugify(String(raw.slug || title));
            if (!title || !slug) return Response.json({ error: "Titre ou slug manquant." }, { status: 400, headers });

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
            return Response.json({ ok: true, slug, commitSha: result.commit?.sha ?? null }, { headers });
          }

          return Response.json({ error: "Action inconnue." }, { status: 400, headers });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          const status = message === "AUTH_REQUIRED" || message === "AUTH_INVALID" ? 401 : message === "ADMIN_REQUIRED" ? 403 : 500;
          console.error("[article-api] mutation failed", error);
          return Response.json({ error: message }, { status, headers });
        }
      },
    },
  },
});
