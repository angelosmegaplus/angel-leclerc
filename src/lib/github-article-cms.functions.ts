import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REPOSITORY = "angelosmegaplus/angel-leclerc";
const BRANCH = "main";
const CONTENT_DIR = "src/content/articles-data";
const TOMBSTONE_DIR = "src/content/article-tombstones";

const ArticleSchema = z.object({
  id: z.string().optional().nullable(),
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(220),
  category: z.string().trim().default("Article"),
  excerpt: z.string().nullable().optional(),
  content: z.string().default(""),
  cover_url: z.string().nullable().optional(),
  published: z.boolean().default(false),
  published_at: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
  is_private: z.boolean().default(false),
  featured: z.boolean().default(false),
  attachments: z.array(z.unknown()).default([]),
  sources: z.array(z.unknown()).default([]),
  topics: z.array(z.string()).default([]),
  ai_disclosure: z.unknown().optional(),
  cover_meta: z.unknown().optional(),
  author_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const SlugSchema = z.object({ slug: z.string().trim().min(1).max(120) });

function token() {
  const value = process.env.GITHUB_CONTENT_TOKEN || process.env.GITHUB_TOKEN;
  if (!value) throw new Error("GITHUB_CONTENT_TOKEN manquant côté serveur.");
  return value;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function pathFor(slug: string) {
  return `${CONTENT_DIR}/${slugify(slug)}.json`;
}

function tombstonePathFor(slug: string) {
  return `${TOMBSTONE_DIR}/${slugify(slug)}.json`;
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

async function githubRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Angel-OS-Article-CMS",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response;
}

async function getExistingSha(path: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${path}?ref=${BRANCH}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Angel-OS-Article-CMS",
    },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  const body = await response.json() as { sha?: string };
  return body.sha || null;
}

async function putFile(path: string, contentText: string, message: string, sha?: string | null) {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(contentText, "utf8").toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const response = await githubRequest(`contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<{ commit?: { sha?: string } }>;
}

export const saveGitHubArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ArticleSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug || data.title);
    const path = pathFor(slug);
    const sha = await getExistingSha(path);
    const now = new Date().toISOString();
    const article = {
      ...data,
      id: data.id || `github:${slug}`,
      slug,
      created_at: data.created_at || now,
      updated_at: now,
    };

    const tombstonePath = tombstonePathFor(slug);
    const tombstoneSha = await getExistingSha(tombstonePath);
    if (tombstoneSha) {
      await githubRequest(`contents/${tombstonePath}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Restore article: ${slug}`, sha: tombstoneSha, branch: BRANCH }),
      });
    }

    const result = await putFile(
      path,
      `${JSON.stringify(article, null, 2)}\n`,
      `${sha ? "Update" : "Create"} article: ${data.title}`,
      sha,
    );
    return { ok: true, slug, commitSha: result.commit?.sha ?? null };
  });

export const deleteGitHubArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => SlugSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug);
    const path = pathFor(slug);
    const sha = await getExistingSha(path);

    if (sha) {
      await githubRequest(`contents/${path}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Delete article: ${slug}`, sha, branch: BRANCH }),
      });
    }

    const tombstonePath = tombstonePathFor(slug);
    const tombstoneSha = await getExistingSha(tombstonePath);
    const tombstone = {
      slug,
      deleted: true,
      deleted_at: new Date().toISOString(),
      reason: "Deleted from Angel OS article editor",
    };
    const result = await putFile(
      tombstonePath,
      `${JSON.stringify(tombstone, null, 2)}\n`,
      `Tombstone article: ${slug}`,
      tombstoneSha,
    );

    return { ok: true, deleted: true, slug, commitSha: result.commit?.sha ?? null };
  });
