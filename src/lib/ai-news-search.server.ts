import type { NewsCategory, NewsItem } from "./news.functions";
import { getOpenAiCredential } from "./vercel-connect-credentials.server";

type SearchState = { expiresAt: number; items: NewsItem[]; failureUntil: number };
const state: SearchState = { expiresAt: 0, items: [], failureUntil: 0 };
const TTL_MS = 10 * 60_000;
const FAILURE_COOLDOWN_MS = 5 * 60_000;
const DEFAULT_WEB_MODEL = "gpt-4.1-mini";
const DEFAULT_WEB_FALLBACK_MODEL = "gpt-4o-mini";

const allowedCategories = new Set<Exclude<NewsCategory, "une">>([
  "politique", "dordogne", "tourisme", "medias", "journalisme", "emploi", "ia", "scoutisme",
]);

function responseText(json: any): string {
  if (typeof json?.output_text === "string") return json.output_text;
  for (const item of json?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) if (content?.type === "output_text" && typeof content.text === "string") return content.text;
  }
  return "";
}
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
  return { id: `openai-web-${category}-${index}-${title.slice(0, 80)}`, title: title.slice(0, 260), url, source, publishedAt, category };
}
function webModels() {
  const primary = process.env["OPENAI_WEB_MODEL"] || DEFAULT_WEB_MODEL;
  const fallback = process.env["OPENAI_WEB_FALLBACK_MODEL"] || DEFAULT_WEB_FALLBACK_MODEL;
  return Array.from(new Set([primary, fallback].filter(Boolean)));
}
function shouldTryFallback(status: number, body: string) { return (status === 400 || status === 403 || status === 404) && /model_not_found|model[^\n]*(?:unavailable|access|verified|verification)|organization must be verified/i.test(body); }

function requestBody(model: string) {
  return {
    model,
    tools: [{ type: "web_search" }],
    max_output_tokens: 2600,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: "Tu alimentes le fil d’actualité privé d’Angel OS. Le fil doit être réellement personnalisé, pas un fil tech générique. Cherche réellement sur le web. Priorité aux contenus publiés ou substantiellement mis à jour dans les dernières heures, avec extension à 48 h pour le local/tourisme et à 7 jours pour le scoutisme s’il n’y a rien de plus frais. Ne fournis que des articles/pages accessibles avec URL directe vérifiable. N’invente jamais une date, une source ou une URL. Évite les doublons, les polémiques vides, le clickbait et les sujets sans rapport avec le profil." }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: `Construis une veille très personnalisée. Le profil éditorial est, par ordre de priorité :
1. Politique et société françaises : institutions, services publics, pouvoir d’achat, souveraineté, collectivités, politiques sociales, enquêtes solides, corruption, favoritisme, lobbying, conflits d’intérêts, justice et finances publiques. Rester factuel et pluraliste ; ne pas transformer le fil en propagande partisane.
2. Sarlat-la-Canéda / Périgord Noir / Dordogne : politique locale, mairie/intercommunalité, travaux, commerces, logement, transports, justice, culture, associations, emploi et informations pratiques. Périgueux, Bergerac et Souillac en second cercle.
3. Tourisme : offices de tourisme, attractivité, patrimoine, hôtellerie, campings, fréquentation, saison touristique, tourisme en Dordogne/Lot/Nouvelle-Aquitaine et évolutions nationales importantes. Le tourisme est un vrai centre d’intérêt professionnel, pas une rubrique décorative.
4. Radio et médias : radios locales et nationales, animation radio, antenne, podcasts, audiences, audiovisuel et métiers de la radio.
5. Journalisme / communication : presse, rédaction, information locale, communication, création de contenu, édition et méthodes du métier.
6. Emploi / alternance : BTS Communication et opportunités compatibles communication, radio, médias, journalisme ou tourisme, surtout Sarlat, Périgueux, Bergerac, Brive puis Bordeaux.
7. IA / tech : seulement les développements réellement utiles ou importants autour d’OpenAI/ChatGPT, Android, Pixel et technologie grand public. Ne pas laisser la tech envahir la une.
8. Scoutisme / éducation populaire : actualités réellement significatives du scoutisme, des mouvements de jeunesse et de l’éducation populaire ; priorité basse mais rubrique conservée.

Retourne idéalement 3 à 5 résultats pour politique, Dordogne et tourisme ; 2 à 4 pour radio/médias, journalisme et emploi ; 1 à 3 pour IA et scoutisme. Les catégories exactes sont : politique, dordogne, tourisme, medias, journalisme, emploi, ia, scoutisme.

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown. Chaque objet doit avoir exactement : {"title":"...","url":"https://...","source":"nom du média","publishedAt":"ISO-8601 ou null","category":"politique|dordogne|tourisme|medias|journalisme|emploi|ia|scoutisme"}. Utilise l'URL de l'article source, pas une URL de moteur de recherche.` }],
      },
    ],
  };
}

export async function searchNewsWithOpenAI(): Promise<NewsItem[]> {
  const now = Date.now();
  if (state.items.length && state.expiresAt > now) return state.items;
  if (state.failureUntil > now) return state.items;
  if (["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase())) return [];

  const credential = await getOpenAiCredential();
  if (!credential) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);
  try {
    const models = webModels();
    for (let index = 0; index < models.length; index += 1) {
      const model = models[index];
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${credential.value}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody(model)),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("[ai-news-search] OpenAI web search", response.status, { model, credentialSource: credential.source, body });
        const hasFallback = index < models.length - 1;
        if (hasFallback && shouldTryFallback(response.status, body)) continue;
        state.failureUntil = now + FAILURE_COOLDOWN_MS;
        return state.items;
      }
      const json = await response.json();
      const items = parseJsonArray(responseText(json)).map(cleanItem).filter((item): item is NewsItem => Boolean(item)).slice(0, 40);
      if (items.length > 0) { state.items = items; state.expiresAt = now + TTL_MS; state.failureUntil = 0; }
      else state.failureUntil = now + FAILURE_COOLDOWN_MS;
      return state.items;
    }
    state.failureUntil = now + FAILURE_COOLDOWN_MS;
    return state.items;
  } catch (error) {
    console.error("[ai-news-search] failure", error);
    state.failureUntil = now + FAILURE_COOLDOWN_MS;
    return state.items;
  } finally { clearTimeout(timeout); }
}
