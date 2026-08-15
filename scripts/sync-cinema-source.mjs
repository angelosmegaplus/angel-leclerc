import fs from "node:fs";

const REFERENCE_URL = "https://movix.online/";
const STATE_PATH = new URL("../runtime/cinema-source.json", import.meta.url);
const userAgent = "Angel-OS-Cinema-Maintenance";

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

async function probe(raw) {
  const normalized = normalizeUrl(raw);
  if (!normalized) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const finalUrl = normalizeUrl(response.url) ?? normalized;
    const type = response.headers.get("content-type") || "";
    const body = type.includes("text/html") ? await response.text() : "";
    return { finalUrl, body };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractCandidate(html) {
  if (!html) return null;
  const candidates = [
    ...html.matchAll(/(?:href|content)=["'](https?:\/\/[^"']+)["']/gi),
    ...html.matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ]
    .map((match) => normalizeUrl(match[1] || match[0]))
    .filter(Boolean);

  return candidates.find((value) => {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return host.includes("movix") && !host.includes("github") && !host.includes("telegram") && !host.includes("t.me");
    } catch {
      return false;
    }
  }) ?? null;
}

const previous = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
let nextUrl = null;
let source = null;

const reference = await probe(REFERENCE_URL);
if (reference) {
  const announced = extractCandidate(reference.body);
  const candidate = announced || reference.finalUrl;
  const verified = await probe(candidate);
  if (verified) {
    nextUrl = verified.finalUrl;
    source = "movix_online";
  }
}

if (!nextUrl && previous?.url) {
  const previousProbe = await probe(previous.url);
  if (previousProbe) {
    nextUrl = previousProbe.finalUrl;
    source = "last_known";
  }
}

if (!nextUrl) {
  console.warn(`Cinema source unavailable; keeping last known URL: ${previous?.url || REFERENCE_URL}`);
  process.exit(0);
}

if (nextUrl === previous?.url) {
  console.log(`Cinema source unchanged and healthy: ${nextUrl}`);
  process.exit(0);
}

const next = {
  url: nextUrl,
  checkedAt: new Date().toISOString(),
  source,
};
fs.writeFileSync(STATE_PATH, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Cinema source updated: ${previous?.url || "none"} -> ${nextUrl}`);
