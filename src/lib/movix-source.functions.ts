import { createServerFn } from "@tanstack/react-start";
import { MOVIX_PERSISTED } from "@/lib/movix-current.generated";
import { FAST_AI_MODEL, lovableChat } from "@/lib/lovable-ai.server";

const UPSTREAM_RAW =
  "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const UPSTREAM_COMMITS =
  "https://api.github.com/repos/movixcorp/MovixOpenSource/commits?path=src/pages/help/MiroirsPage.tsx&per_page=1";
const RENTRY_REFERENCE = "https://rentry.co/movix/raw";
const HELP_REFERENCE = "https://movix.help/";
const TELEGRAM_PUBLIC = "https://t.me/s/movix_site";
const SEARCH_URL = "https://html.duckduckgo.com/html/?q=Movix%20adresse%20officielle%20site%20streaming";

let cache:
  | {
      expiresAt: number;
      value: MovixOfficialSource;
    }
  | undefined;
let lastKnownGoodUrl: string | null = null;

export type MovixOfficialSource = {
  url: string;
  checkedAt: string;
  source: "last_known" | "rentry" | "movix_help" | "persisted" | "github" | "lovable_ai" | "fallback";
  upstreamSha: string | null;
  chain: string[];
  evidence?: string[];
};

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isMovixHost(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host.includes("movix") && !host.includes("github") && !host.includes("telegram") && host !== "t.me";
  } catch {
    return false;
  }
}

async function probeUrl(raw: string) {
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;
  try {
    const response = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Angel-Movies-Movix-Link-Sync" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const finalUrl = normalizeUrl(response.url) ?? normalized;
    const body = (response.headers.get("content-type") || "").includes("text/html") ||
      (response.headers.get("content-type") || "").includes("text/plain")
      ? await response.text()
      : "";
    return { finalUrl, body };
  } catch {
    return null;
  }
}

function extractCandidates(source: string) {
  if (!source) return [];
  const values = [
    ...source.matchAll(/(?:href|content)=["'](https?:\/\/[^"']+)["']/gi),
    ...source.matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ]
    .map((match) => normalizeUrl(match[1] || match[0]))
    .filter((value): value is string => value !== null && isMovixHost(value));
  return [...new Set(values)];
}

async function upstreamSha() {
  try {
    const response = await fetch(UPSTREAM_COMMITS, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Angel-Movies-Movix-Link-Sync" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{ sha?: string }>;
    return typeof payload?.[0]?.sha === "string" ? payload[0].sha : null;
  } catch {
    return null;
  }
}

async function githubCandidates() {
  try {
    const response = await fetch(UPSTREAM_RAW, {
      headers: { "User-Agent": "Angel-Movies-Movix-Link-Sync" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return [];
    return extractCandidates(await response.text());
  } catch {
    return [];
  }
}

async function candidatesFromReference(url: string) {
  const reference = await probeUrl(url);
  if (!reference) return [];
  return extractCandidates(reference.body);
}

async function publicResearchEvidence() {
  const evidence: string[] = [];
  for (const url of [TELEGRAM_PUBLIC, SEARCH_URL]) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Angel-Movies-Movix-Research" },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) continue;
      const text = (await response.text()).replace(/\s+/g, " ").slice(0, 18_000);
      evidence.push(`${url}\n${text}`);
    } catch {}
  }
  return evidence;
}

function parseAiUrl(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  try {
    const parsed = JSON.parse(fenced) as { url?: unknown; confidence?: unknown };
    const url = typeof parsed.url === "string" ? normalizeUrl(parsed.url) : null;
    const confidence = Number(parsed.confidence);
    return url && isMovixHost(url) && Number.isFinite(confidence) && confidence >= 0.75 ? url : null;
  } catch {
    return extractCandidates(text)[0] ?? null;
  }
}

async function lovableAiResearch() {
  const evidence = await publicResearchEvidence();
  if (!evidence.length) return null;
  const result = await lovableChat({
    model: FAST_AI_MODEL,
    maxTokens: 300,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Tu es la couche de vérification web d'Angel Movies. Analyse uniquement les extraits publics fournis. Identifie l'adresse officielle actuelle de Movix. Ignore les clones, agrégateurs SEO, faux domaines et simples mentions historiques. Réponds uniquement en JSON strict: {\"url\":\"https://.../\",\"confidence\":0.0,\"reason\":\"...\"}. Si la preuve est insuffisante, url doit être une chaîne vide et confidence < 0.75.",
      },
      {
        role: "user",
        content: `Sources publiques récentes à comparer:\n\n${evidence.join("\n\n---\n\n")}`,
      },
    ],
  });
  if (!result.ok || !result.text) return null;
  const candidate = parseAiUrl(result.text);
  if (!candidate) return null;
  const verified = await probeUrl(candidate);
  if (!verified) return null;
  return { url: verified.finalUrl, evidence: evidence.map((item) => item.split("\n", 1)[0] || "source web") };
}

function buildValue(
  url: string,
  source: MovixOfficialSource["source"],
  chain: string[],
  now: number,
  extra?: Partial<MovixOfficialSource>,
): MovixOfficialSource {
  lastKnownGoodUrl = url;
  const value: MovixOfficialSource = {
    url,
    checkedAt: new Date(now).toISOString(),
    source,
    upstreamSha: null,
    chain: [...chain],
    ...extra,
  };
  cache = { expiresAt: now + 15 * 60_000, value };
  return value;
}

async function firstVerified(candidates: string[]) {
  for (const candidate of candidates) {
    const verified = await probeUrl(candidate);
    if (verified && isMovixHost(verified.finalUrl)) return verified.finalUrl;
  }
  return null;
}

async function resolveMovixSource(): Promise<MovixOfficialSource> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  const chain: string[] = [];

  // 1. La liste d'adresses recommandée par le projet est consultée avant toute ancienne valeur locale.
  chain.push("rentry");
  const rentry = await firstVerified(await candidatesFromReference(RENTRY_REFERENCE));
  if (rentry) return buildValue(rentry, "rentry", chain, now, { evidence: [RENTRY_REFERENCE] });

  // 2. Vérification de la source GitHub officielle du projet.
  chain.push("github");
  const github = await firstVerified(await githubCandidates());
  if (github) {
    return buildValue(github, "github", chain, now, {
      upstreamSha: await upstreamSha(),
      evidence: [UPSTREAM_RAW],
    });
  }

  // 3. Page d'aide officielle, sans forcer movix.online comme valeur par défaut.
  chain.push("movix_help");
  const help = await probeUrl(HELP_REFERENCE);
  if (help) {
    const fromHelp = await firstVerified(extractCandidates(help.body));
    if (fromHelp) return buildValue(fromHelp, "movix_help", chain, now, { evidence: [HELP_REFERENCE] });
  }

  // 4. L'ancien domaine enregistré n'est désormais qu'un secours, jamais la priorité.
  chain.push("persisted");
  if (MOVIX_PERSISTED.url) {
    const persisted = await probeUrl(MOVIX_PERSISTED.url);
    if (persisted && isMovixHost(persisted.finalUrl)) {
      return buildValue(persisted.finalUrl, "persisted", chain, now);
    }
  }

  // 5. Dernier domaine réellement validé pendant la vie du serveur.
  if (lastKnownGoodUrl) {
    chain.push("last_known");
    const probe = await probeUrl(lastKnownGoodUrl);
    if (probe && isMovixHost(probe.finalUrl)) return buildValue(probe.finalUrl, "last_known", chain, now);
  }

  chain.push("lovable_ai");
  try {
    const ai = await lovableAiResearch();
    if (ai) return buildValue(ai.url, "lovable_ai", chain, now, { evidence: ai.evidence });
  } catch (error) {
    console.error("[movix-source] Lovable AI research failed", error);
  }

  // Aucun domaine arbitraire n'est injecté : on conserve seulement une valeur enregistrée si elle existe.
  const fallbackUrl = normalizeUrl(MOVIX_PERSISTED.url) || "";
  const value: MovixOfficialSource = {
    url: fallbackUrl,
    checkedAt: new Date(now).toISOString(),
    source: "fallback",
    upstreamSha: null,
    chain: [...chain, "fallback"],
  };
  cache = { expiresAt: now + 5 * 60_000, value };
  return value;
}

export const getMovixOfficialSource = createServerFn({ method: "GET" }).handler(resolveMovixSource);
