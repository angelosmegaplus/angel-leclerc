import fs from "node:fs/promises";

const REFERENCE_URL = "https://movix.online/";
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

function extractMovixUrl(source) {
  const matches = [
    ...source.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi),
    ...source.matchAll(/https?:\/\/[^\s"'<>]+/gi),
  ];
  for (const match of matches) {
    const value = normalize(match[1] || match[0]);
    if (!value) continue;
    const host = new URL(value).hostname.toLowerCase();
    if (host.includes("movix") && !host.includes("github") && !host.includes("telegram")) return value;
  }
  return null;
}

async function resolve() {
  const reference = await probe(REFERENCE_URL);
  if (reference) {
    const announced = extractMovixUrl(reference.body);
    if (announced) {
      const verified = await probe(announced);
      if (verified) return verified.url;
    }
    return reference.url;
  }

  try {
    const response = await fetch(UPSTREAM_RAW, {
      headers: { "User-Agent": "Angel-Movies-Movix-Automation" },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const candidate = extractMovixUrl(await response.text());
      if (candidate) {
        const verified = await probe(candidate);
        if (verified) return verified.url;
      }
    }
  } catch {}
  return null;
}

const current = await fs.readFile(TARGET, "utf8");
const currentUrl = current.match(/url:\s*"([^"]+)"/)?.[1] || "";
const resolved = await resolve();
if (!resolved) {
  console.error("Aucun domaine Movix vérifié.");
  process.exitCode = 1;
} else if (resolved === currentUrl) {
  console.log(`Movix inchangé : ${resolved}`);
} else {
  const next = `export const MOVIX_PERSISTED = {\n  url: ${JSON.stringify(resolved)},\n  source: "automation",\n} as const;\n`;
  await fs.writeFile(TARGET, next, "utf8");
  console.log(`Movix mis à jour : ${currentUrl || "aucun"} -> ${resolved}`);
}
