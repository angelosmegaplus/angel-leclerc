import fs from "node:fs/promises";

const REFERENCE_URLS = ["https://movix.help/", "https://movix.online/"];
const UPSTREAM_RAW = "https://raw.githubusercontent.com/movixcorp/MovixOpenSource/main/src/pages/help/MiroirsPage.tsx";
const TELEGRAM_PUBLIC = "https://t.me/s/movix_site";
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
      headers: { "User-Agent": "Angel-Movies-Movix-Automation" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const body = (response.headers.get("content-type") || "").includes("text/html") ? await response.text() : "";
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

async function resolve() {
  for (const referenceUrl of REFERENCE_URLS) {
    const reference = await probe(referenceUrl);
    if (!reference) continue;
    for (const candidate of extractMovixUrls(reference.body)) {
      const verified = await probe(candidate);
      if (verified) return { url: verified.url, source: referenceUrl };
    }
    if (isCandidate(reference.url)) return { url: reference.url, source: referenceUrl };
  }

  for (const sourceUrl of [UPSTREAM_RAW, TELEGRAM_PUBLIC]) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { "User-Agent": "Angel-Movies-Movix-Automation" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;
      const text = await response.text();
      for (const candidate of extractMovixUrls(text)) {
        const verified = await probe(candidate);
        if (verified) return { url: verified.url, source: sourceUrl };
      }
    } catch {}
  }
  return null;
}

const current = await fs.readFile(TARGET, "utf8");
const currentUrl = current.match(/url:\s*"([^"]+)"/)?.[1] || "";
const resolved = await resolve();
if (!resolved) {
  console.error("Aucun domaine Movix vérifié. Le dernier domaine sain est conservé.");
  process.exitCode = 1;
} else if (resolved.url === currentUrl) {
  console.log(`Movix inchangé : ${resolved.url}`);
} else {
  const next = `export const MOVIX_PERSISTED = {\n  url: ${JSON.stringify(resolved.url)},\n  source: ${JSON.stringify(resolved.source)},\n  previousUrl: ${JSON.stringify(currentUrl || null)},\n  checkedAt: ${JSON.stringify(new Date().toISOString())},\n} as const;\n`;
  await fs.writeFile(TARGET, next, "utf8");
  console.log(`Movix mis à jour : ${currentUrl || "aucun"} -> ${resolved.url}`);
}
