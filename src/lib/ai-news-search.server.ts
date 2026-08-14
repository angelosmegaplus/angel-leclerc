import type { NewsCategory, NewsItem } from "./news.functions";

type SearchState = {
  expiresAt: number;
  items: NewsItem[];
  failureUntil: number;
};

const state: SearchState = { expiresAt: 0, items: [], failureUntil: 0 };
const TTL_MS = 10 * 60_000;
const FAILURE_COOLDOWN_MS = 5 * 60_000;

const allowedCategories = new Set<Exclude<NewsCategory, "une">>([
  "politique",
  "medias",
  "journalisme",
  "ia",
  "dordogne",
  "emploi",
]);

function responseText(json: any): string {
  if (typeof json?.output_text === "string") return json.output_text;
  for (const item of json?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function parseJsonArray(raw: string): any[] {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const value = JSON.parse(trimmed);
    return Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start < 0 || end <= start) return [];
    try {
      const value = JSON.parse(trimmed.slice(start, end + 1));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}

function cleanItem(value: any, index: number): NewsItem | null {
  const category = String(value?.category ?? "") as Exclude<NewsCategory, "une">;
  const title = String(value?.title ?? "").replace(/\s+/g, " ").trim();
  const url = String(value?.url ?? "").trim();
  const source = String(value?.source ?? "Web").replace(/\s+/g, " ").trim().slice(0, 120) || "Web";
  if (!allowedCategories.has(category) || title.length < 8 || !/^https?:\/\//i.test(url)) return null;

  let publishedAt: string | null = null;
  if (value?.publishedAt) {
    const parsed = new Date(String(value.publishedAt));
    if (!Number.isNaN(parsed.getTime())) publishedAt = parsed.toISOString();
  }

  return {
    id: `openai-web-${category}-${index}-${title.slice(0, 80)}`,
    title: title.slice(0, 260),
    url,
    source,
    publishedAt,
    category,
  };
}

export async function searchNewsWithOpenAI(): Promise<NewsItem[]> {
  const now = Date.now();
  if (state.items.length && state.expiresAt > now) return state.items;
  if (state.failureUntil > now) return state.items;

  const key = process.env["OPENAI_API_KEY"];
  if (!key || ["0", "false", "off", "disabled"].includes(String(process.env["ANGEL_AI_ENABLED"] ?? "true").toLowerCase())) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env["OPENAI_WEB_MODEL"] || "gpt-5-mini",
        tools: [{ type: "web_search" }],
        max_output_tokens: 1600,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Tu complètes un fil d'actualité privé. Cherche réellement sur le web et ne fournis que des articles/pages de médias accessibles avec URL directe vérifiable. Priorité absolue aux contenus publiés ou substantiellement mis à jour dans les 6 dernières heures, puis 24 heures. Évite les doublons et les contenus anciens sans évolution. N'invente jamais une date, une source ou une URL.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Recherche maintenant des actualités françaises et locales pour compléter Google News. Retourne au maximum 24 résultats utiles, répartis entre ces catégories exactes :\n- politique : politique/société France, pouvoir d'achat, services publics, souveraineté, institutions, enquêtes documentées\n- medias : radio, audiovisuel, médias, podcasts\n- journalisme : journalisme, communication, presse, création de contenu\n- ia : IA, OpenAI, Android, smartphones, applications et technologie\n- dordogne : Sarlat-la-Canéda/Périgord Noir en priorité, puis Dordogne, Périgueux, Bergerac\n- emploi : alternance BTS Communication, communication, radio, médias, emploi/stage compatibles Bac+2\n\nRéponds UNIQUEMENT avec un tableau JSON valide, sans markdown. Chaque objet doit avoir exactement : {"title":"...","url":"https://...","source":"nom du média","publishedAt":"ISO-8601 ou null","category":"politique|medias|journalisme|ia|dordogne|emploi"}. Utilise l'URL de l'article source, pas une URL de moteur de recherche.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[ai-news-search] OpenAI web search", response.status, await response.text());
      state.failureUntil = now + FAILURE_COOLDOWN_MS;
      return state.items;
    }

    const json = await response.json();
    const parsed = parseJsonArray(responseText(json));
    const items = parsed.map(cleanItem).filter((item): item is NewsItem => Boolean(item)).slice(0, 24);
    if (items.length > 0) {
      state.items = items;
      state.expiresAt = now + TTL_MS;
      state.failureUntil = 0;
    } else {
      state.failureUntil = now + FAILURE_COOLDOWN_MS;
    }
    return state.items;
  } catch (error) {
    console.error("[ai-news-search] failure", error);
    state.failureUntil = now + FAILURE_COOLDOWN_MS;
    return state.items;
  } finally {
    clearTimeout(timeout);
  }
}
