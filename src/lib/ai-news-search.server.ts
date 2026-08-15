import type { NewsCategory, NewsItem } from "./news.functions";
import { getOpenAiCredential } from "./vercel-connect-credentials.server";

type SearchState = { expiresAt: number; items: NewsItem[]; failureUntil: number };
const state: SearchState = { expiresAt: 0, items: [], failureUntil: 0 };
const TTL_MS = 10 * 60_000;
const FAILURE_COOLDOWN_MS = 5 * 60_000;
const DEFAULT_WEB_MODEL = "gpt-4.1-mini";
const DEFAULT_WEB_FALLBACK_MODEL = "gpt-4o-mini";

const allowedCategories = new Set<Exclude<NewsCategory, "une">>(["politique","medias","journalisme","ia","dordogne","emploi"]);

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
    max_output_tokens: 2200,
    input: [
      { role: "system", content: [{ type: "input_text", text: "Tu alimentes un fil d’actualité privé très personnalisé. Cherche réellement sur le web. Priorité absolue aux contenus publiés ou substantiellement mis à jour dans les 6 dernières heures, puis 24 heures. Évite les reprises anciennes, les contenus génériques, les marronniers et les doublons. Ne fournis que des articles/pages accessibles avec URL directe vérifiable. N’invente jamais une date, une source ou une URL. La fraîcheur et la pertinence passent avant la quantité." }] },
      { role: "user", content: [{ type: "input_text", text: `Recherche maintenant des actualités françaises et locales. Retourne idéalement 3 à 5 résultats PAR CATÉGORIE, avec au moins 2 résultats par catégorie quand l’actualité le permet. Les catégories exactes sont :\n- politique : politique et société françaises, pouvoir d'achat, services publics, souveraineté, institutions, rapports de pouvoir, enquêtes documentées, corruption, favoritisme, lobbying, conflits d'intérêts, justice et affaires financières. Prioriser les sujets substantiels et les médias sérieux ; éviter la petite polémique vide.\n- medias : radio, audiovisuel, médias, podcasts, audience, évolutions des radios et télévisions, animateurs et métiers de l'antenne.\n- journalisme : journalisme, presse, rédaction, communication, création de contenu, médias, édition, méthodes et évolutions du métier.\n- ia : IA, OpenAI, ChatGPT, Android, Google Pixel, smartphones, applications utiles et technologie grand public.\n- dordogne : Sarlat-la-Canéda et Périgord Noir d'abord, puis Dordogne, Périgueux, Bergerac et Souillac ; inclure politique locale, travaux, commerces, emploi, justice, culture, transports et informations pratiques.\n- emploi : alternance BTS Communication ou postes/stages compatibles Bac+2 en communication, radio, médias, journalisme ou création de contenu, prioritairement Bordeaux, Périgueux, Bergerac, Brive et Sarlat.\n\nPour la sélection générale, favorise particulièrement les enquêtes solides, la politique/société, le local Sarlat/Périgord Noir, Android/IA, radio/médias et les opportunités concrètes en communication. Évite les sujets très éloignés de ces centres d’intérêt sauf s’ils sont réellement majeurs.\n\nRéponds UNIQUEMENT avec un tableau JSON valide, sans markdown. Chaque objet doit avoir exactement : {"title":"...","url":"https://...","source":"nom du média","publishedAt":"ISO-8601 ou null","category":"politique|medias|journalisme|ia|dordogne|emploi"}. Utilise l'URL de l'article source, pas une URL de moteur de recherche.` }] }
    ]
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
      const items = parseJsonArray(responseText(json)).map(cleanItem).filter((item): item is NewsItem => Boolean(item)).slice(0, 30);
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
