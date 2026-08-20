import { createServerFn } from "@tanstack/react-start";
import { MOVIX_PERSISTED } from "@/lib/movix-current.generated";

const RENTRY_REFERENCE = "https://rentry.co/movix/raw";
const UPSTREAM_RAW = "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const UPSTREAM_COMMITS = "https://api.github.com/repos/movixcorp/MovixOpenSource/commits?path=src/pages/help/MiroirsPage.tsx&per_page=1";
const HELP_REFERENCE = "https://movix.help/";

let cache: { expiresAt: number; value: MovixOfficialSource } | undefined;
let lastKnownGoodUrl: string | null = null;

export type MovixOfficialSource = {
  url: string;
  checkedAt: string;
  source: "last_known" | "rentry" | "movix_help" | "movix_online" | "persisted" | "github" | "lovable_ai" | "fallback";
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
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("text/html") || contentType.includes("text/plain") ? await response.text() : "";
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

async function referenceCandidates(url: string) {
  const response = await probeUrl(url);
  return response ? extractCandidates(response.body) : [];
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

async function firstVerified(candidates: string[]) {
  for (const candidate of candidates) {
    const verified = await probeUrl(candidate);
    if (verified && isMovixHost(verified.finalUrl)) return verified.finalUrl;
  }
  return null;
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

async function resolveMovixSource(): Promise<MovixOfficialSource> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  const chain: string[] = [];

  // Les références actives passent AVANT l'ancien domaine enregistré.
  chain.push("rentry");
  const rentry = await firstVerified(await referenceCandidates(RENTRY_REFERENCE));
  if (rentry) return buildValue(rentry, "rentry", chain, now, { evidence: [RENTRY_REFERENCE] });

  chain.push("github");
  const github = await firstVerified(await githubCandidates());
  if (github) {
    return buildValue(github, "github", chain, now, {
      upstreamSha: await upstreamSha(),
      evidence: [UPSTREAM_RAW],
    });
  }

  chain.push("movix_help");
  const help = await firstVerified(await referenceCandidates(HELP_REFERENCE));
  if (help) return buildValue(help, "movix_help", chain, now, { evidence: [HELP_REFERENCE] });

  // movix.online n'est plus injecté ici. La valeur persistante n'est qu'un secours.
  chain.push("persisted");
  if (MOVIX_PERSISTED.url) {
    const persisted = await probeUrl(MOVIX_PERSISTED.url);
    if (persisted && isMovixHost(persisted.finalUrl)) {
      return buildValue(persisted.finalUrl, "persisted", chain, now);
    }
  }

  if (lastKnownGoodUrl) {
    chain.push("last_known");
    const lastKnown = await probeUrl(lastKnownGoodUrl);
    if (lastKnown && isMovixHost(lastKnown.finalUrl)) {
      return buildValue(lastKnown.finalUrl, "last_known", chain, now);
    }
  }

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
