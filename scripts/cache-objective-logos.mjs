import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "public/logos/objectives";
const commons = (file) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;

const logos = [
  { file: "ibsac.svg", pages: ["https://www.ibsac.fr/"] },
  { file: "cned.svg", pages: ["https://www.cned.fr/"], urls: [commons("Logo CNED.svg"), commons("CNED logo.svg")] },
  { file: "cfj.svg", pages: ["https://cfjparis.com/"], urls: ["https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_CFJ.svg", commons("Logo CFJ.svg")] },
  { file: "ipj.svg", pages: ["https://ipj.eu/"], urls: [commons("Logo de l'Université Paris Dauphine - PSL.jpg"), commons("Dauphine logo 2019 - Bleu.png")] },
  { file: "esj-lille.svg", pages: ["https://esj-lille.fr/"], urls: ["https://upload.wikimedia.org/wikipedia/commons/f/f8/New_logo_ESJ_Lille.svg", commons("New logo ESJ Lille.svg")] },
  { file: "ejt.svg", pages: ["https://ejt.fr/"], urls: [commons("EjTlogo.png")] },
  { file: "ina.svg", pages: ["https://www.ina.fr/"], urls: [commons("Logo INA.svg")] },
  { file: "iscpa.svg", pages: ["https://www.iscpa-ecoles.com/", "https://www.iscpa-ecoles.com/ecole/presse"] },
  { file: "la-skol.svg", pages: ["https://www.laskol.fr/"] },
  { file: "france-inter.svg", pages: ["https://www.radiofrance.fr/franceinter"], urls: ["https://upload.wikimedia.org/wikipedia/fr/2/25/France_Inter_logo.svg", commons("France Inter logo 2021.svg")] },
  { file: "franceinfo.svg", pages: ["https://www.franceinfo.fr/"], urls: [commons("Franceinfo.svg")] },
  { file: "ici.svg", pages: ["https://www.radiofrance.fr/ici"], urls: [commons("Ici Logo 2025.png")] },
  { file: "rtl.svg", pages: ["https://www.rtl.fr/"], urls: [commons("RTL logo.svg")] },
  { file: "europe-1.svg", pages: ["https://www.europe1.fr/"], urls: [commons("Europe1-logo.svg")] },
  { file: "happy-radio.svg", pages: ["https://happyradio.fr/"] },
  { file: "rcf.svg", pages: ["https://www.rcf.fr/"], urls: [commons("RCF logo.svg"), commons("Logo RCF.svg")] },
  { file: "rmc.svg", pages: ["https://rmc.bfmtv.com/"], urls: [commons("RMC 2025.svg")] },
  { file: "nrj.svg", pages: ["https://www.nrj.fr/"], urls: [commons("NRJ 2014 logo.svg"), commons("NRJ logo.svg")] },
  { file: "skyrock.svg", pages: ["https://skyrock.fm/"], urls: [commons("Skyrock 2010 logo.png")] },
  { file: "fun-radio.svg", pages: ["https://www.funradio.fr/"], urls: [commons("Logo Fun Radio (2021).svg")] },
  { file: "rfm.svg", pages: ["https://www.rfm.fr/"], urls: [commons("RFM logo.svg"), commons("Logo RFM.svg")] },
  { file: "europe-2.svg", pages: ["https://www.europe2.fr/"], urls: [commons("Europe 2 logo 2023.svg"), commons("Europe 2 logo.svg")] },
  { file: "sud-radio.svg", pages: ["https://www.sudradio.fr/"], urls: [commons("Logo Sud Radio vectorise.svg")] },
  { file: "radio-classique.svg", pages: ["https://www.radioclassique.fr/"], urls: [commons("Logo Radio Classique.svg")] },
];

const headers = { "user-agent": "Mozilla/5.0 (compatible; Angel-Leclerc-site-logo-cache/1.2)" };

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
    if (/logo/.test(text)) score += 8;
    if (/header|brand|navbar|site-logo|custom-logo/.test(text)) score += 5;
    if (/footer|partner|sponsor|social/.test(text)) score -= 4;
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
  const candidates = [];

  // Priorité absolue au logo actuellement publié sur le site officiel.
  for (const page of logo.pages ?? []) {
    try { candidates.push(await discoverLogo(page)); }
    catch (error) { console.warn(`[logos] découverte impossible sur ${page}: ${error.message}`); }
  }

  // Les sources de secours ne sont utilisées que si le site officiel ne fournit rien d'exploitable.
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
    } catch (error) {
      console.warn(`[logos] source indisponible pour ${logo.file}: ${url} (${error.message})`);
    }
  }
  if (!success) console.warn(`[logos] ${logo.file}: aucun fichier récupéré, ancien logo local conservé si présent.`);
}

console.log(`[logos] ${downloaded}/${logos.length} logos actualisés depuis les sites officiels dans ${OUT_DIR}.`);
