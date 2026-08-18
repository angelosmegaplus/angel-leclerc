import { DEEP_AI_MODEL, DEFAULT_AI_MODEL, getLovableAiKey, lovableChat } from "./lovable-ai.server";

type ArticleSource = { label: string; url: string };

type CoverMeta = {
  source: string;
  pageUrl: string;
  credit: string;
  license: string;
  alt: string;
};

export type GeneratedArticleDraft = {
  title: string;
  excerpt: string;
  content: string;
  sources: ArticleSource[];
  topics: string[];
  coverUrl: string | null;
  coverMeta: CoverMeta | null;
};

const ALLOWED_TOPICS = [
  "Politique", "Société", "Emploi & formation", "Entreprise & économie",
  "Communication & médias", "International & géopolitique", "Religion",
  "Scoutisme", "Technologie & numérique", "Culture & idées",
];

const DEFAULT_ARTICLE_MODEL = DEFAULT_AI_MODEL;
const DEFAULT_ARTICLE_FALLBACK_MODEL = DEEP_AI_MODEL;

function extractResponseText(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  if (typeof root.output_text === "string" && root.output_text.trim()) return root.output_text.trim();
  if (!Array.isArray(root.output)) return null;
  for (const item of root.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) return text.trim();
    }
  }
  return null;
}

function parseJsonObject(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned) as Record<string, unknown>; } catch {
    const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>; } catch { return null; }
  }
}

const ARTICLE_SYSTEM_PROMPT =
        "Tu es le moteur de veille journalistique d'Angel OS. Rédige en français une synthèse d'actualité ULTRA COMPLÈTE, détaillée, factuelle, lisible et vérifiable. Utilise activement le web et recoupe plusieurs sources fiables. Le lecteur doit comprendre le sujet sans devoir ouvrir les sources : explique le contexte, les faits nouveaux, la chronologie utile, les personnes/organisations concernées, les chiffres clés lorsqu'ils existent, les réactions ou points de vue pertinents, les conséquences possibles et ce qui reste incertain. Distingue clairement les faits établis des analyses ou hypothèses. Ne remplis jamais les trous par invention. Évite les répétitions et le remplissage. Vise au minimum environ 1800 mots quand les informations disponibles le permettent. Retourne UNIQUEMENT un objet JSON valide avec title, excerpt, content, sources, topics. excerpt doit être un résumé global dense de l'actualité. content doit être en HTML simple (<p>, <h2>, <strong>, <em>) et comporter plusieurs sections explicatives. À la fin de content, ajoute un <h2>Lire les articles et sources</h2> puis une liste de paragraphes contenant des liens HTML cliquables vers CHAQUE source réellement utilisée, sous la forme <p><a href=\"URL\" target=\"_blank\" rel=\"noopener noreferrer\">Média — titre ou description</a></p>. sources doit contenir les mêmes pages réellement consultées sous forme {label,url}. N'invente jamais une URL, une citation ou une source. topics est limité aux catégories autorisées fournies par l'utilisateur.";

function articleUserPrompt(subject: string) {
  return `Sujet demandé : ${subject}\nCatégories autorisées : ${ALLOWED_TOPICS.join(", ")}. Fais une recherche approfondie, recoupe les informations importantes avec plusieurs médias ou sources primaires quand possible, puis produis le JSON complet.`;
}

function articleModels() {
  const primary = process.env["ANGEL_AI_ARTICLE_MODEL"] || DEFAULT_ARTICLE_MODEL;
  const fallback = process.env["ANGEL_AI_ARTICLE_FALLBACK_MODEL"] || DEFAULT_ARTICLE_FALLBACK_MODEL;
  return Array.from(new Set([primary, fallback].filter(Boolean)));
}

async function researchAndWrite(subject: string): Promise<Omit<GeneratedArticleDraft, "coverUrl" | "coverMeta"> | null> {
  if (!getLovableAiKey()) {
    console.error("[article-ai] no AI gateway credential available");
    return null;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    for (const model of articleModels()) {
      const result = await lovableChat({
        model,
        messages: [
          { role: "system", content: ARTICLE_SYSTEM_PROMPT },
          { role: "user", content: articleUserPrompt(subject) },
        ],
        tools: [{ type: "google_search" }],
        temperature: 0.3,
        signal: controller.signal,
      });
      if (!result.ok || !result.text) {
        console.warn("[article-ai] AI gateway failed", { model, detail: result.detail });
        continue;
      }
      const parsed = parseJsonObject(result.text);
      if (!parsed) {
        console.warn("[article-ai] provider returned unparsable JSON", { model });
        continue;
      }
      const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 180) : subject.slice(0, 180);
      const excerpt = typeof parsed.excerpt === "string" ? parsed.excerpt.trim().slice(0, 1200) : "";
      const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
      const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];
      const sources: ArticleSource[] = rawSources
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
        .map((item) => ({
          label: typeof item.label === "string" ? item.label.trim().slice(0, 220) : "Source",
          url: typeof item.url === "string" ? item.url.trim() : "",
        }))
        .filter((item) => /^https?:\/\//i.test(item.url))
        .slice(0, 20);
      const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
      const topics = rawTopics.filter((item): item is string => typeof item === "string" && ALLOWED_TOPICS.includes(item)).slice(0, 4);
      if (!content || sources.length < 2) {
        console.warn("[article-ai] generated draft incomplete", { model, hasContent: Boolean(content), sourceCount: sources.length });
        continue;
      }
      return { title, excerpt, content, sources, topics };
    }
    return null;
  } catch (error) {
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
    console.error("[article-ai] generation failed", aborted ? "timeout" : error);
    return null;
  } finally { clearTimeout(timeout); }
}

function stripHtml(value: string) { return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function cleanMetadata(value: unknown) { if (typeof value !== "string") return ""; return stripHtml(value).replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim(); }

async function findCommonsImage(subject: string): Promise<{ url: string; meta: CoverMeta } | null> {
  const query = new URLSearchParams({ action: "query", generator: "search", gsrsearch: subject, gsrnamespace: "6", gsrlimit: "8", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600", format: "json", origin: "*" });
  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${query.toString()}`, { headers: { "User-Agent": "AngelOS/1.0 (angel-leclerc.fr)" } });
    if (!response.ok) return null;
    const json = await response.json() as { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<Record<string, unknown>> }> } };
    for (const page of Object.values(json.query?.pages ?? {})) {
      const info = page.imageinfo?.[0]; if (!info) continue;
      const url = typeof info.thumburl === "string" ? info.thumburl : typeof info.url === "string" ? info.url : ""; if (!url) continue;
      const ext = info.extmetadata && typeof info.extmetadata === "object" ? info.extmetadata as Record<string, { value?: unknown }> : {};
      const license = cleanMetadata(ext.LicenseShortName?.value ?? ext.License?.value);
      const artist = cleanMetadata(ext.Artist?.value ?? ext.Credit?.value) || "Auteur non précisé";
      const description = cleanMetadata(ext.ImageDescription?.value) || subject;
      if (!license || /copyrighted|fair use|non-free/i.test(license)) continue;
      const pageTitle = page.title ?? "";
      return { url, meta: { source: "Wikimedia Commons", pageUrl: pageTitle ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}` : "https://commons.wikimedia.org/", credit: artist, license, alt: description.slice(0, 300) } };
    }
    return null;
  } catch (error) { console.error("[article-ai] image search failed", error); return null; }
}

export async function findArticleCover(subject: string) { return findCommonsImage(subject); }
export async function generateArticleDraft(subject: string): Promise<GeneratedArticleDraft | null> {
  const written = await researchAndWrite(subject); if (!written) return null;
  const image = await findCommonsImage(written.title || subject);
  return { ...written, coverUrl: image?.url ?? null, coverMeta: image?.meta ?? null };
}
