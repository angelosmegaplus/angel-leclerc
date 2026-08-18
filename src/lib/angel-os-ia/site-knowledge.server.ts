import { angelMemoryIndex, recordAngelOperation } from "@/lib/angel-runtime.server";

type RawModuleMap = Record<string, unknown>;

type KnowledgeHit = {
  title: string;
  text: string;
  source: string;
  metadata?: Record<string, unknown>;
};

const SOURCE_MODULES = import.meta.glob(
  [
    "/src/**/*.{ts,tsx,js,jsx,md,json}",
    "/angel-os/**/*.{ts,tsx,js,jsx,md,json}",
    "/docs/**/*.{md,json}",
  ],
  { eager: true, query: "?raw", import: "default" },
) as RawModuleMap;

const MAX_CHUNK = 5_500;
const OVERLAP = 450;
const PUBLIC_REFRESH_MS = 5 * 60 * 1000;

let indexedVersion = "";
let publicPagesRefreshedAt = 0;

function sourceVersion() {
  return process.env["VERCEL_GIT_COMMIT_SHA"] || process.env["VERCEL_GIT_COMMIT_REF"] || "development";
}

function normalizeRaw(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "default" in value && typeof (value as { default?: unknown }).default === "string") {
    return (value as { default: string }).default;
  }
  return "";
}

function chunks(text: string) {
  const out: string[] = [];
  if (text.length <= MAX_CHUNK) return [text];
  let cursor = 0;
  while (cursor < text.length) {
    const end = Math.min(text.length, cursor + MAX_CHUNK);
    out.push(text.slice(cursor, end));
    if (end >= text.length) break;
    cursor = Math.max(cursor + 1, end - OVERLAP);
  }
  return out;
}

function routeFromSource(source: string) {
  const match = source.match(/createFileRoute\(\s*["'`]([^"'`]+)["'`]\s*\)/);
  return match?.[1] ?? null;
}

function isFetchablePublicRoute(route: string) {
  if (!route.startsWith("/")) return false;
  if (route.startsWith("/admin")) return false;
  if (route.includes("$") || route.includes("*") || route.includes("_")) return false;
  return true;
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function indexEntry(input: {
  id: string;
  source: string;
  title: string;
  text: string;
  tags: string[];
  metadata: Record<string, string | number | boolean | null>;
}) {
  angelMemoryIndex.upsert({
    id: input.id,
    source: input.source,
    title: input.title,
    text: input.text,
    tags: ["angel-os-ia", "site-knowledge", ...input.tags],
    updatedAt: Date.now(),
    metadata: input.metadata,
  });
}

function indexRepositorySources() {
  const version = sourceVersion();
  if (indexedVersion === version) return { changed: false, files: Object.keys(SOURCE_MODULES).length, version };

  let fileCount = 0;
  let chunkCount = 0;
  for (const [path, rawValue] of Object.entries(SOURCE_MODULES)) {
    const text = normalizeRaw(rawValue).trim();
    if (!text) continue;
    fileCount += 1;
    const route = routeFromSource(text);
    chunks(text).forEach((chunk, index) => {
      chunkCount += 1;
      indexEntry({
        id: `site-code:${version}:${path}:${index}`,
        source: `site-code:${path}`,
        title: route ? `${path} · route ${route}` : path,
        text: chunk,
        tags: ["code", path.startsWith("/src/routes/") ? "route" : "source"],
        metadata: {
          path,
          route,
          commit: version,
          chunk: index,
          evidence: "repository-source",
          confidence: "authoritative",
        },
      });
    });
  }
  indexedVersion = version;
  return { changed: true, files: fileCount, chunks: chunkCount, version };
}

async function refreshPublicRenderedPages(force = false) {
  const now = Date.now();
  if (!force && now - publicPagesRefreshedAt < PUBLIC_REFRESH_MS) return { changed: false, pages: 0 };

  const routes = new Set<string>(["/"]);
  for (const rawValue of Object.values(SOURCE_MODULES)) {
    const route = routeFromSource(normalizeRaw(rawValue));
    if (route && isFetchablePublicRoute(route)) routes.add(route);
  }

  const origin = process.env["ANGEL_PUBLIC_ORIGIN"] || "https://www.angel-leclerc.fr";
  let pages = 0;
  await Promise.all(
    [...routes].slice(0, 80).map(async (route) => {
      try {
        const response = await fetch(new URL(route, origin), {
          headers: { Accept: "text/html", "User-Agent": "Angel-OS-IA-SiteReader/1.0" },
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return;
        const text = htmlToText(await response.text()).slice(0, 24_000);
        if (!text) return;
        pages += 1;
        chunks(text).forEach((chunk, index) => {
          indexEntry({
            id: `site-page:${route}:${index}`,
            source: `site-page:${route}`,
            title: `angel-leclerc.fr${route}`,
            text: chunk,
            tags: ["rendered-page", "public"],
            metadata: {
              route,
              checkedAt: new Date().toISOString(),
              evidence: "rendered-production-page",
              confidence: "authoritative-live",
            },
          });
        });
      } catch {
        // A page that cannot be read is simply absent from the live-page evidence set.
      }
    }),
  );
  publicPagesRefreshedAt = now;
  return { changed: true, pages };
}

export async function ensureSiteKnowledgeFresh(options?: { forcePublic?: boolean }) {
  const startedAt = Date.now();
  const source = indexRepositorySources();
  const rendered = await refreshPublicRenderedPages(options?.forcePublic === true);
  await recordAngelOperation({
    type: "angel-os-ia.site-knowledge.refreshed",
    source: "angel-os-ia:site-knowledge",
    ok: true,
    durationMs: Date.now() - startedAt,
    payload: { source, rendered },
  });
  return { source, rendered };
}

export function searchSiteKnowledge(query: string, limit = 12): KnowledgeHit[] {
  return angelMemoryIndex
    .search(query, Math.max(limit * 4, 32))
    .filter((hit) => hit.source.startsWith("site-code:") || hit.source.startsWith("site-page:"))
    .slice(0, limit)
    .map((hit) => ({
      title: hit.title,
      text: hit.text,
      source: hit.source,
      metadata: hit.metadata as Record<string, unknown> | undefined,
    }));
}

export function siteKnowledgePrompt(hits: KnowledgeHit[]) {
  if (!hits.length) return "\n\nCONNAISSANCE DU SITE : aucun extrait pertinent n’a été retrouvé dans l’index local.";
  const evidence = hits.map((hit, index) => {
    const metadata = hit.metadata ? JSON.stringify(hit.metadata) : "{}";
    return `[SOURCE ${index + 1}] ${hit.title}\nProvenance: ${hit.source}\nMétadonnées: ${metadata}\n${hit.text.slice(0, 4_500)}`;
  }).join("\n\n");
  return `\n\nCONNAISSANCE INTERNE ANGEL-LECLERC.FR — extraits pertinents indexés\n${evidence}`;
}

export const SITE_KNOWLEDGE_POLICY = `
RÈGLES DE FIABILITÉ — ANGEL OS IA
1. Distingue toujours le code source, le texte réellement rendu en production, les données de base et une simple inférence.
2. Une affirmation sur le fonctionnement du site doit être appuyée par une source identifiable (fichier/route/donnée) présente dans le contexte.
3. Le texte rendu en production prime pour décrire ce que voit réellement un visiteur. Le code de main prime pour décrire l’intention et l’implémentation courante.
4. Une donnée dynamique récente (mail, agenda, candidature, base) prime sur une ancienne copie de page ou une mémoire historique.
5. Si deux sources se contredisent, expose la contradiction. Ne choisis pas silencieusement celle qui t’arrange.
6. N’enregistre en mémoire durable qu’un fait stable, daté et suffisamment prouvé. Le code brut reste dans l’index de connaissance et ne doit pas être transformé en "fait utilisateur".
7. N’écris/modifie automatiquement une donnée interne que si la preuve est certaine, l’opération est idempotente, réversible et non destructive. Sinon, propose l’action.
8. Ne prétends jamais avoir lu un fichier, une page, un mail, un agenda ou exécuté une action si la source correspondante n’est pas présente ou si l’opération n’a pas abouti.
9. En cas de doute, réponds "non vérifié" ou "source indisponible" plutôt que de compléter par supposition.
10. Les actions externes, publications publiques, envois de mails, suppressions, paiements et changements irréversibles exigent toujours une validation explicite.
`.trim();
