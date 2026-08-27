import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "public/logos/objectives";
const commons = (file) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;

const logos = [
  { file: "ibsac.svg", brands: ["ibsac"], pages: ["https://www.ibsac.fr/"] },
  { file: "cned.svg", brands: ["cned"], pages: ["https://www.cned.fr/"], urls: [commons("Logo CNED.svg")] },
  { file: "cfj.svg", brands: ["cfj"], pages: ["https://cfjparis.com/"] },
  { file: "ipj.svg", brands: ["ipj", "dauphine"], pages: ["https://ipj.eu/"] },
  { file: "esj-lille.svg", brands: ["esj", "lille"], pages: ["https://esj-lille.fr/"] },
  { file: "ejt.svg", brands: ["ejt"], pages: ["https://ejt.fr/"] },
  { file: "ina.svg", brands: ["ina"], pages: ["https://www.ina.fr/"], urls: [commons("Logo INA.svg")] },
  { file: "iscpa.svg", brands: ["iscpa", "studec"], pages: ["https://www.iscpa-ecoles.com/"] },
  { file: "la-skol.svg", brands: ["skol"], pages: ["https://www.laskol.fr/"] },
  { file: "france-inter.svg", brands: ["france", "inter"], pages: ["https://www.radiofrance.fr/franceinter"] },
  { file: "franceinfo.svg", brands: ["franceinfo"], pages: ["https://www.franceinfo.fr/"] },
  { file: "ici.svg", brands: ["ici"], pages: ["https://www.radiofrance.fr/ici"] },
  { file: "rtl.svg", brands: ["rtl"], pages: ["https://www.rtl.fr/"] },
  { file: "europe-1.svg", brands: ["europe1", "europe-1", "europe 1"], pages: ["https://www.europe1.fr/"] },
  { file: "happy-radio.svg", brands: ["happy", "radio"], pages: ["https://happyradio.fr/"] },
  { file: "rcf.svg", brands: ["rcf"], pages: ["https://www.rcf.fr/"] },
  { file: "rmc.svg", brands: ["rmc"], pages: ["https://rmc.bfmtv.com/"] },
  { file: "nrj.svg", brands: ["nrj"], pages: ["https://www.nrj.fr/"] },
  { file: "skyrock.svg", brands: ["skyrock"], pages: ["https://skyrock.fm/"] },
  { file: "fun-radio.svg", brands: ["fun", "radio"], pages: ["https://www.funradio.fr/"] },
  { file: "rfm.svg", brands: ["rfm"], pages: ["https://www.rfm.fr/"] },
  { file: "europe-2.svg", brands: ["europe2", "europe-2", "europe 2"], pages: ["https://www.europe2.fr/"] },
  { file: "sud-radio.svg", brands: ["sud", "radio"], pages: ["https://www.sudradio.fr/"] },
  { file: "radio-classique.svg", brands: ["radio", "classique"], pages: ["https://www.radioclassique.fr/"] },
];

const headers = { "user-agent": "Mozilla/5.0 (compatible; Angel-Leclerc-site-logo-cache/2.0)" };
async function fetchWithTimeout(url) { return fetch(url, { redirect: "follow", headers, signal: AbortSignal.timeout(12000) }); }
function absoluteUrl(value, base) { try { return new URL(value, base).href; } catch { return null; } }
function attr(tag, name) { return tag.match(new RegExp(`\\b${name}=[\"']([^\"']+)[\"']`, "i"))?.[1] ?? ""; }

async function discoverLogo(pageUrl, brands) {
  const response = await fetchWithTimeout(pageUrl);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const candidates = [];

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const rawSrc = attr(tag, "src") || attr(tag, "data-src") || attr(tag, "data-lazy-src");
    const url = absoluteUrl(rawSrc, pageUrl);
    if (!url) continue;
    const haystack = `${tag} ${url}`.toLowerCase();
    let score = 0;
    if (/logo|site-logo|custom-logo|brand|branding/.test(haystack)) score += 18;
    if (/header|navbar|masthead/.test(haystack)) score += 8;
    if (brands.some((brand) => haystack.includes(brand.toLowerCase()))) score += 14;
    if (/footer|partner|sponsor|league|ligue|advert|pub|social|icon/.test(haystack)) score -= 20;
    if (/\.svg(?:\?|$)/i.test(url)) score += 5;
    candidates.push({ url, score });
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attr(tag, "rel").toLowerCase();
    const href = absoluteUrl(attr(tag, "href"), pageUrl);
    if (!href || !/(icon|apple-touch-icon)/.test(rel)) continue;
    candidates.push({ url: href, score: 3 });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates.find((item) => item.score >= 12);
  if (!best) throw new Error("aucun logo officiel suffisamment fiable détecté");
  return best.url;
}

async function getImage(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const type = (response.headers.get("content-type") ?? "").split(";")[0];
  if (!type.startsWith("image/") && type !== "application/svg+xml") throw new Error(`type inattendu: ${type}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 800) throw new Error("fichier trop petit pour être un logo exploitable");
  return { bytes, type: type || "image/png", source: response.url };
}

function svgContainer(bytes, mime) {
  if (mime === "image/svg+xml") return bytes.toString("utf8");
  const data = bytes.toString("base64");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet"><image href="data:${mime};base64,${data}" x="0" y="0" width="1200" height="600" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

await mkdir(OUT_DIR, { recursive: true });
let downloaded = 0;
for (const logo of logos) {
  const candidates = [];
  for (const page of logo.pages ?? []) {
    try { candidates.push(await discoverLogo(page, logo.brands ?? [])); }
    catch (error) { console.warn(`[logos] ${logo.file} sur ${page}: ${error.message}`); }
  }
  candidates.push(...(logo.urls ?? []));
  let success = false;
  for (const url of [...new Set(candidates)]) {
    try {
      const image = await getImage(url);
      await writeFile(join(OUT_DIR, logo.file), svgContainer(image.bytes, image.type), "utf8");
      console.log(`[logos] ${logo.file} <- ${image.source}`);
      downloaded += 1;
      success = true;
      break;
    } catch (error) { console.warn(`[logos] ${logo.file}: ${url} (${error.message})`); }
  }
  if (!success) console.warn(`[logos] ${logo.file}: ancien logo local conservé.`);
}
console.log(`[logos] ${downloaded}/${logos.length} logos actualisés.`);
