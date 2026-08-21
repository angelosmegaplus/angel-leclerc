import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "public/logos/objectives";
const commons = (file) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;

const logos = [
  { file: "ibsac.svg", pages: ["https://www.ibsac.fr/"] },
  { file: "cned.svg", urls: [commons("Logo CNED.svg"), commons("CNED logo.svg")], pages: ["https://www.cned.fr/"] },
  { file: "cfj.svg", urls: ["https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_CFJ.svg", commons("Logo CFJ.svg")] },
  { file: "ipj.svg", urls: [commons("Logo de l'Université Paris Dauphine - PSL.jpg"), commons("Dauphine logo 2019 - Bleu.png")], pages: ["https://ipj.eu/"] },
  { file: "esj-lille.svg", urls: ["https://upload.wikimedia.org/wikipedia/commons/f/f8/New_logo_ESJ_Lille.svg", commons("New logo ESJ Lille.svg")], pages: ["https://esj-lille.fr/"] },
  { file: "ejt.svg", urls: [commons("EjTlogo.png")], pages: ["https://ejt.fr/"] },
  { file: "ina.svg", urls: [commons("Logo INA.svg")], pages: ["https://www.ina.fr/"] },
  { file: "iscpa.svg", pages: ["https://www.iscpa-ecoles.com/ecole/presse", "https://www.iscpa-ecoles.com/"] },
  { file: "la-skol.svg", pages: ["https://www.laskol.fr/"] },
  { file: "france-inter.svg", urls: ["https://upload.wikimedia.org/wikipedia/fr/2/25/France_Inter_logo.svg", commons("France Inter logo 2021.svg")] },
  { file: "franceinfo.svg", urls: [commons("Franceinfo.svg")] },
  { file: "ici.svg", urls: [commons("Ici Logo 2025.png")], pages: ["https://www.radiofrance.fr/ici"] },
  { file: "rtl.svg", urls: [commons("RTL logo.svg")], pages: ["https://www.rtl.fr/"] },
  { file: "europe-1.svg", urls: [commons("Europe1-logo.svg")], pages: ["https://www.europe1.fr/"] },
  { file: "happy-radio.svg", pages: ["https://happyradio.fr/"] },
  { file: "rcf.svg", urls: [commons("RCF logo.svg"), commons("Logo RCF.svg")], pages: ["https://www.rcf.fr/"] },
  { file: "rmc.svg", urls: [commons("RMC 2025.svg")], pages: ["https://rmc.bfmtv.com/"] },
  { file: "nrj.svg", urls: [commons("NRJ 2014 logo.svg"), commons("NRJ logo.svg")], pages: ["https://www.nrj.fr/"] },
  { file: "skyrock.svg", urls: [commons("Skyrock 2010 logo.png")], pages: ["https://skyrock.fm/"] },
  { file: "fun-radio.svg", urls: [commons("Logo Fun Radio (2021).svg")], pages: ["https://www.funradio.fr/"] },
  { file: "rfm.svg", urls: [commons("RFM logo.svg"), commons("Logo RFM.svg")], pages: ["https://www.rfm.fr/"] },
  { file: "europe-2.svg", urls: [commons("Europe 2 logo 2023.svg"), commons("Europe 2 logo.svg")], pages: ["https://www.europe2.fr/"] },
  { file: "sud-radio.svg", urls: [commons("Logo Sud Radio vectorise.svg")], pages: ["https://www.sudradio.fr/"] },
  { file: "radio-classique.svg", urls: [commons("Logo Radio Classique.svg")], pages: ["https://www.radioclassique.fr/"] },
];

const headers = { "user-agent": "Mozilla/5.0 (compatible; Angel-Leclerc-site-logo-cache/1.1)" };

async function fetchWithTimeout(url) {
  return fetch(url, { redirect: "follow", headers, signal: AbortSignal.timeout(12000) });
}

function absoluteUrl(value, base) {
  try { return new URL(value, base).href; } catch { return null; }
}

async function discoverLogo(pageUrl) {
  const response = await fetchWithTimeout(pageUrl);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const scored = imgTags.map((tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
    if (!src) return null;
    const text = tag.toLowerCase();
    let score = 0;
    if (/logo/.test(text)) score += 6;
    if (/header|brand|navbar|site-logo/.test(text)) score += 3;
    if (/footer/.test(text)) score -= 1;
    return { url: absoluteUrl(src, pageUrl), score };
  }).filter(Boolean).filter((item) => item.url).sort((a, b) => b.score - a.score);
  if (scored[0]?.score > 0) return scored[0].url;
  throw new Error("aucun logo identifiable dans la page");
}

async function getImage(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const type = (response.headers.get("content-type") ?? "").split(";")[0];
  if (!type.startsWith("image/") && type !== "application/svg+xml") throw new Error(`type inattendu: ${type}`);
  return { bytes: Buffer.from(await response.arrayBuffer()), type: type || "image/png", source: response.url };
}

function svgContainer(bytes, mime) {
  const data = bytes.toString("base64");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet"><image href="data:${mime};base64,${data}" x="0" y="0" width="1200" height="600" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

await mkdir(OUT_DIR, { recursive: true });
let downloaded = 0;

for (const logo of logos) {
  const candidates = [...(logo.urls ?? [])];
  for (const page of logo.pages ?? []) {
    try { candidates.push(await discoverLogo(page)); }
    catch (error) { console.warn(`[logos] découverte impossible sur ${page}: ${error.message}`); }
  }

  let success = false;
  for (const url of [...new Set(candidates)]) {
    try {
      const image = await getImage(url);
      await writeFile(join(OUT_DIR, logo.file), svgContainer(image.bytes, image.type), "utf8");
      console.log(`[logos] ${logo.file} <- ${image.source}`);
      downloaded += 1;
      success = true;
      break;
    } catch (error) {
      console.warn(`[logos] source indisponible pour ${logo.file}: ${url} (${error.message})`);
    }
  }
  if (!success) console.warn(`[logos] ${logo.file}: aucun fichier récupéré, fallback texte côté interface.`);
}

console.log(`[logos] ${downloaded}/${logos.length} logos mis en cache dans ${OUT_DIR}.`);
