import { createServerFn } from "@tanstack/react-start";

const UPSTREAM_RAW =
  "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const UPSTREAM_COMMITS =
  "https://api.github.com/repos/movixcorp/MovixOpenSource/commits?path=src/pages/help/MiroirsPage.tsx&per_page=1";
const FALLBACK_URL = "https://movix.online/";

let cache:
  | {
      expiresAt: number;
      value: MovixOfficialSource;
    }
  | undefined;

export type MovixOfficialSource = {
  url: string;
  checkedAt: string;
  source: "github" | "fallback";
  upstreamSha: string | null;
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

function extractOfficialUrl(source: string) {
  const marker = source.indexOf('titleKey: \'help.miroirs.officialListTitle\'');
  const relevant = marker >= 0 ? source.slice(marker, marker + 2_500) : source;

  const candidates = [...relevant.matchAll(/href=["'](https?:\/\/[^"']+)["']/g)]
    .map((match) => normalizeUrl(match[1]))
    .filter((value): value is string => Boolean(value));

  return (
    candidates.find((value) => {
      try {
        const host = new URL(value).hostname.toLowerCase();
        return !host.includes("rentry.co") && !host.includes("t.me") && !host.includes("telegram");
      } catch {
        return false;
      }
    }) ?? null
  );
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

async function resolveMovixSource(): Promise<MovixOfficialSource> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;

  try {
    const response = await fetch(UPSTREAM_RAW, {
      headers: { "User-Agent": "Angel-OS-Movix-Link-Sync" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`GitHub upstream ${response.status}`);

    const body = await response.text();
    const official = extractOfficialUrl(body);
    if (!official) throw new Error("Aucun lien officiel détecté dans la source Movix.");

    const value: MovixOfficialSource = {
      url: official,
      checkedAt: new Date(now).toISOString(),
      source: "github",
      upstreamSha: await upstreamSha(),
    };
    cache = { expiresAt: now + 60 * 60_000, value };
    return value;
  } catch (error) {
    console.error("[movix-source] upstream unavailable", error);
    const value: MovixOfficialSource = {
      url: FALLBACK_URL,
      checkedAt: new Date(now).toISOString(),
      source: "fallback",
      upstreamSha: null,
    };
    cache = { expiresAt: now + 10 * 60_000, value };
    return value;
  }
}

export const getMovixOfficialSource = createServerFn({ method: "GET" }).handler(resolveMovixSource);
