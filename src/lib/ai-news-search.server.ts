import type { NewsCategory, NewsItem } from "./news.functions";
import { DEFAULT_AI_MODEL, FAST_AI_MODEL, getLovableAiKey, lovableChat } from "./lovable-ai.server";

type SearchState = { expiresAt: number; items: NewsItem[]; failureUntil: number };
const state: SearchState = { expiresAt: 0, items: [], failureUntil: 0 };
const TTL_MS = 10 * 60_000;
const FAILURE_COOLDOWN_MS = 5 * 60_000;
const PROVIDER_TIMEOUT_MS = 20_000;
const DEFAULT_WEB_MODEL = DEFAULT_AI_MODEL;
const DEFAULT_WEB_FALLBACK_MODEL = FAST_AI_MODEL;

const allowedCategories = new Set<Exclude<NewsCategory, "une">>([
  "politique", "dordogne", "tourisme", "medias", "journalisme", "emploi", "ia", "scoutisme",
]);

const structuredNewsFormat = {
  name: "angel_os_news_feed",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        minItems: 1,
        maxItems: 14,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            source: { type: "string" },
            publishedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
            category: {
              type: "string",
              enum: ["politique", "dordogne", "tourisme", "medias", "journalisme", "emploi", "ia", "scoutisme"],
            },
          },
          required: ["title", "url", "source", "publishedAt", "category"],
        },
      },
    },
    required: ["items"],
  },
} as const;

function parseJsonArray(raw: string): any[] {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { const value = JSON.parse(trimmed); return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : []; }
  catch { const start = trimmed.indexOf("["); const end = trimmed.lastIndexOf("]"); if (start < 0 || end <= start) return []; try { const value = JSON.parse(trimmed.slice(start, end + 1)); return Array.isArray(value) ? value : []; } catch { return []; } }
}
function cleanItem(value: any, index: number): NewsItem | null {
  const category = String(value?.category ?? "") as Exclude<NewsCategory, "une">;
  const title = String(value?.title ?? "").replace(/\s+/g, " ").trim();
  const url = String(value?.url ?? "").trim();
  const source = String(value?.source ?? "Web").replace(/\s+/g, " ").trim().slice(0, 120) || "Web";
  if (!allowedCategories.has(category) || title.length < 8 || !/^https?:\/\//i.test(url)) return null;
  let publishedAt: string | null = null;
  if (value?.publishedAt) { const parsed = new Date(String(value.publishedAt)); if (!Number.isNaN(parsed.getTime())) publishedAt = parsed.toISOString(); }
  return { id: `angel-ai-web-${category}-${index}-${title.slice(0, 80)}`, title: title.slice(0, 260), url, source, publishedAt, category };
}
function webModels() {
  const primary = process.env["ANGEL_AI_WEB_MODEL"] || DEFAULT_WEB_MODEL;
  const fallback = process.env["ANGEL_AI_WEB_FALLBACK_MODEL"] || DEFAULT_WEB_FALLBACK_MODEL;
  return Array.from(new Set([primary, fallback].filter(Boolean)));
}

const NEWS_SYSTEM_PROMPT = "Tu alimentes le fil d’actualité privé d’Angel OS. Utilise obligatoirement la recherche web disponible. Le fil doit être réellement personnalisé, pas un fil tech générique. Priorité aux contenus publiés ou substantiellement mis à jour dans les dernières heures, avec extension à 48 h pour le local/tourisme et à 7 jours pour le scoutisme s’il n’y a rien de plus frais. Ne fournis que des articles/pages accessibles avec URL directe vérifiable. N’invente jamais une date, une source ou une URL. Évite les doublons, les polémiques vides, le clickbait et les sujets sans rapport avec le profil.";

const NEWS_USER_PROMPT = `Construis une veille très personnalisée et compacte. Le profil éditorial est, par ordre de priorité :
1. Politique et société françaises : institutions, services publics, pouvoir d’achat, souveraineté, collectivités, politiques sociales, enquêtes solides, corruption, favoritisme, lobbying, conflits d’intérêts, justice et finances publiques.
2. Sarlat-la-Canéda / Périgord Noir / Dordogne : politique locale, mairie/intercommunalité, travaux, commerces, logement, transports, justice, culture, associations, emploi et informations pratiques. Périgueux, Bergerac et Souillac en second cercle.
3. Tourisme : offices de tourisme, attractivité, patrimoine, hôtellerie, campings, fréquentation, saison touristique, tourisme en Dordogne/Lot/Nouvelle-Aquitaine et évolutions nationales importantes.
4. Radio et médias : radios locales et nationales, animation radio, antenne, podcasts, audiences, audiovisuel et métiers de la radio.
5. Journalisme / communication : presse, rédaction, information locale, communication, création de contenu, édition et méthodes du métier.
6. Emploi / alternance : BTS Communication et opportunités compatibles communication, radio, médias, journalisme ou tourisme, surtout Sarlat, Périgueux, Bergerac, Brive puis Bordeaux.
7. IA / tech : seulement les développements réellement utiles ou importants autour d’OpenAI/ChatGPT, Android, Pixel et technologie grand public.
8. Scoutisme / éducation populaire : actualités réellement significatives du scoutisme, des mouvements de jeunesse et de l’éducation populaire.

Retourne entre 8 et 14 résultats au total quand les sources récentes le permettent, en privilégiant politique, Dordogne et tourisme. Les catégories exactes sont : politique, dordogne, tourisme, medias, journalisme, emploi, ia, scoutisme. Utilise l'URL directe de la source consultée, jamais une URL de moteur de recherche.`;

export async function searchNewsWithOpenAI(): Promise<NewsItem[]> {
  const now = Date.now();
  if (state.items.length && state.expiresAt > now) return state.items;
  if (state.failureUntil > now) return state.items;
  if (["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase())) return [];

  if (!getLovableAiKey()) return [];

  try {
    for (const model of webModels()) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
      let raw = "";
      try {
        const result = await lovableChat({
          model,
          messages: [
            { role: "system", content: NEWS_SYSTEM_PROMPT },
            { role: "user", content: NEWS_USER_PROMPT },
          ],
          tools: [{ type: "google_search" }],
          responseFormat: { type: "json_schema", json_schema: structuredNewsFormat },
          maxTokens: 2400,
          signal: controller.signal,
        });
        if (!result.ok || !result.text) {
          console.warn("[ai-news-search] AI gateway web search unavailable", { model, detail: result.detail });
          continue;
        }
        raw = result.text;
      } finally {
        clearTimeout(timeout);
      }

      const items = parseJsonArray(raw).map(cleanItem).filter((item): item is NewsItem => Boolean(item)).slice(0, 24);
      if (items.length > 0) {
        state.items = items;
        state.expiresAt = now + TTL_MS;
        state.failureUntil = 0;
        return state.items;
      }
      console.warn("[ai-news-search] provider returned no usable structured news items", { model, outputLength: raw.length });
    }
    state.failureUntil = now + FAILURE_COOLDOWN_MS;
    return state.items;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[ai-news-search] unavailable; keeping cached feed", message);
    state.failureUntil = now + FAILURE_COOLDOWN_MS;
    return state.items;
  }
}
