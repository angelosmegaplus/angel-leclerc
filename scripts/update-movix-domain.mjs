import fs from "node:fs/promises";

const RENTRY_REFERENCE = "https://rentry.co/movix/raw";
const HELP_REFERENCE = "https://movix.help/";
const UPSTREAM_RAW = "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const TARGET = "src/lib/movix-current.generated.ts";

function normalize(value) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isCandidate(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host.includes("movix") && !host.includes("github") && !host.includes("telegram") && host !== "t.me";
  } catch {
    return false;
  }
}

async function probe(raw) {
  const value = normalize(raw);
  if (!value) return null;
  try {
    const response = await fetch(value, {
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Angel-Movies-Movix-Automation" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("text/html") || contentType.includes("text/plain") ? await response.text() : "";
    return { url: normalize(response.url) || value, body };
  } catch {
    return null;
  }
}

function extractMovixUrls(source) {
  const matches = [
    ...source.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi),
    ...source.matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ];
  const values = [];
  for (const match of matches) {
    const value = normalize(match[1] || match[0]);
    if (value && isCandidate(value) && !values.includes(value)) values.push(value);
  }
  return values;
}

async function firstVerified(candidates) {
  for (const candidate of candidates) {
    const verified = await probe(candidate);
    if (verified && isCandidate(verified.url)) return verified.url;
  }
  return null;
}

async function candidatesFromReference(referenceUrl) {
  const reference = await probe(referenceUrl);
  return reference ? extractMovixUrls(reference.body) : [];
}

async function resolve() {
  // 1. Liste d'adresses dédiée : priorité absolue sur l'ancienne valeur enregistrée.
  const rentry = await firstVerified(await candidatesFromReference(RENTRY_REFERENCE));
  if (rentry) return { url: rentry, source: RENTRY_REFERENCE };

  // 2. Source GitHub officielle du projet.
  try {
    const response = await fetch(UPSTREAM_RAW, {
      cache: "no-store",
      headers: { "User-Agent": "Angel-Movies-Movix-Automation" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const github = await firstVerified(extractMovixUrls(await response.text()));
      if (github) return { url: github, source: UPSTREAM_RAW };
    }
  } catch {}

  // 3. Page d'aide officielle. Aucun movix.online n'est forcé dans le code.
  const help = await firstVerified(await candidatesFromReference(HELP_REFERENCE));
  if (help) return { url: help, source: HELP_REFERENCE };

  return null;
}

const current = await fs.readFile(TARGET, "utf8");
const currentUrl = current.match(/url:\s*"([^"]+)"/)?.[1] || "";
const resolved = await resolve();

if (!resolved) {
  console.error("Aucune nouvelle adresse Movix vérifiée. L'adresse persistante n'est pas remplacée.");
  process.exitCode = 1;
} else if (resolved.url === currentUrl) {
  console.log(`Movix inchangé : ${resolved.url}`);
} else {
  const next = `export const MOVIX_PERSISTED = {\n  url: ${JSON.stringify(resolved.url)},\n  source: ${JSON.stringify(resolved.source)},\n  previousUrl: ${JSON.stringify(currentUrl || null)},\n  checkedAt: ${JSON.stringify(new Date().toISOString())},\n} as const;\n`;
  await fs.writeFile(TARGET, next, "utf8");
  console.log(`Movix mis à jour : ${currentUrl || "aucun"} -> ${resolved.url}`);
}
