import { createServerFn } from "@tanstack/react-start";
import persistedCinemaSource from "../../runtime/cinema-source.json";

const UPSTREAM_RAW =
  "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const UPSTREAM_COMMITS =
  "https://api.github.com/repos/movixcorp/MovixOpenSource/commits?path=src/pages/help/MiroirsPage.tsx&per_page=1";
const REFERENCE_URL = "https://movix.online/";

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
  source: "persisted" | "last_known" | "movix_online" | "github" | "fallback";
  upstreamSha: string | null;
  chain: string[];
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

async function probeUrl(raw: string) {
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;
  try {
    const response = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Angel-OS-Movix-Link-Sync" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const finalUrl = normalizeUrl(response.url) ?? normalized;
    const body = (response.headers.get("content-type") || "").includes("text/html")
      ? await response.text()
      : "";
    return { finalUrl, body };
  } catch {
    return null;
  }
}

function extractCandidateFromHtml(source: string) {
  if (!source) return null;
  const candidates = [
    ...source.matchAll(/(?:href|content)=["'](https?:\/\/[^"']+)["']/gi),
    ...source.matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ]
    .map((match) => normalizeUrl(match[1] || match[0]))
    .filter((value): value is string => Boolean(value));

  return candidates.find((value) => {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return host.includes("movix") && !host.includes("github") && !host.includes("telegram") && !host.includes("t.me");
    } catch {
      return false;
    }
  }) ?? null;
}

function extractOfficialUrl(source: string) {
  const marker = source.indexOf('titleKey: \'help.miroirs.officialListTitle\'');
  const relevant = marker >= 0 ? source.slice(marker, marker + 2_500) : source;
  const candidates = [...relevant.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)]
    .map((match) => normalizeUrl(match[1]))
    .filter((value): value is string => Boolean(value));

  return candidates.find((value) => {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return !host.includes("rentry.co") && !host.includes("t.me") && !host.includes("telegram");
    } catch {
      return false;
    }
  }) ?? null;
}

async function upstreamSha() {
  try {
    const response = await fetch(UPSTREAM_COMMITS, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "Angel-OS-Movix-Link-Sync" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{ sha?: string }>;
    return typeof payload?.[0]?.sha === "string" ? payload[0].sha : null;
  } catch {
    return null;
  }
}

async function githubOfficialUrl() {
  const response = await fetch(UPSTREAM_RAW, {
    headers: { "User-Agent": "Angel-OS-Movix-Link-Sync" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;
  return extractOfficialUrl(await response.text());
}

async function resolveMovixSource(): Promise<MovixOfficialSource> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  const chain: string[] = [];

  const persisted = normalizeUrl(String(persistedCinemaSource?.url ?? ""));
  if (persisted) {
    chain.push("persisted");
    const probe = await probeUrl(persisted);
    if (probe) {
      lastKnownGoodUrl = probe.finalUrl;
      const value: MovixOfficialSource = {
        url: probe.finalUrl,
        checkedAt: new Date(now).toISOString(),
        source: "persisted",
        upstreamSha: null,
        chain,
      };
      cache = { expiresAt: now + 30 * 60_000, value };
      return value;
    }
  }

  if (lastKnownGoodUrl) {
    chain.push("last_known");
    const probe = await probeUrl(lastKnownGoodUrl);
    if (probe) {
      lastKnownGoodUrl = probe.finalUrl;
      const value: MovixOfficialSource = {
        url: probe.finalUrl,
        checkedAt: new Date(now).toISOString(),
        source: "last_known",
        upstreamSha: null,
        chain,
      };
      cache = { expiresAt: now + 30 * 60_000, value };
      return value;
    }
  }

  chain.push("movix_online");
  const reference = await probeUrl(REFERENCE_URL);
  if (reference) {
    const announced = extractCandidateFromHtml(reference.body);
    const candidate = announced || reference.finalUrl;
    const verified = await probeUrl(candidate);
    if (verified) {
      lastKnownGoodUrl = verified.finalUrl;
      const value: MovixOfficialSource = {
        url: verified.finalUrl,
        checkedAt: new Date(now).toISOString(),
        source: "movix_online",
        upstreamSha: null,
        chain,
      };
      cache = { expiresAt: now + 30 * 60_000, value };
      return value;
    }
  }

  chain.push("github");
  try {
    const official = await githubOfficialUrl();
    if (official) {
      const verified = await probeUrl(official);
      if (verified) {
        lastKnownGoodUrl = verified.finalUrl;
        const value: MovixOfficialSource = {
          url: verified.finalUrl,
          checkedAt: new Date(now).toISOString(),
          source: "github",
          upstreamSha: await upstreamSha(),
          chain,
        };
        cache = { expiresAt: now + 30 * 60_000, value };
        return value;
      }
    }
  } catch (error) {
    console.error("[movix-source] github resolution failed", error);
  }

  const fallback = persisted || lastKnownGoodUrl || REFERENCE_URL;
  const value: MovixOfficialSource = {
    url: fallback,
    checkedAt: new Date(now).toISOString(),
    source: "fallback",
    upstreamSha: null,
    chain: [...chain, "fallback"],
  };
  cache = { expiresAt: now + 10 * 60_000, value };
  return value;
}

export const getMovixOfficialSource = createServerFn({ method: "GET" }).handler(resolveMovixSource);
