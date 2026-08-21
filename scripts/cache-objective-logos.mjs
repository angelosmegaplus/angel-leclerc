import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "public/logos/objectives";
const commons = (file) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}`;

const logos = [
  ["cfj.svg", ["https://upload.wikimedia.org/wikipedia/commons/7/7c/Logo_CFJ.svg", commons("Logo CFJ.svg")]],
  ["ipj.jpg", [commons("Logo de l'Université Paris Dauphine - PSL.jpg"), commons("Dauphine logo 2019 - Bleu.png")]],
  ["esj-lille.svg", ["https://upload.wikimedia.org/wikipedia/commons/f/f8/New_logo_ESJ_Lille.svg", commons("New logo ESJ Lille.svg")]],
  ["ejt.png", [commons("EjTlogo.png")]],
  ["ina.svg", [commons("Logo INA.svg")]],
  ["france-inter.svg", ["https://upload.wikimedia.org/wikipedia/fr/2/25/France_Inter_logo.svg", commons("France Inter logo 2021.svg")]],
  ["franceinfo.svg", [commons("Franceinfo.svg")]],
  ["ici.png", [commons("Ici Logo 2025.png")]],
  ["rtl.svg", [commons("RTL logo.svg")]],
  ["europe-1.svg", [commons("Europe1-logo.svg")]],
  ["rmc.svg", [commons("RMC 2025.svg")]],
  ["nrj.svg", [commons("NRJ 2014 logo.svg"), commons("NRJ logo.svg")]],
  ["skyrock.png", [commons("Skyrock 2010 logo.png")]],
  ["fun-radio.svg", [commons("Logo Fun Radio (2021).svg")]],
  ["rfm.svg", [commons("RFM logo.svg"), commons("Logo RFM.svg")]],
  ["europe-2.svg", [commons("Europe 2 logo 2023.svg"), commons("Europe 2 logo.svg")]],
  ["sud-radio.svg", [commons("Logo Sud Radio vectorise.svg")]],
  ["radio-classique.svg", [commons("Logo Radio Classique.svg")]],
  ["rcf.svg", [commons("RCF logo.svg"), commons("Logo RCF.svg")]],
  ["cned.svg", [commons("Logo CNED.svg"), commons("CNED logo.svg")]],
];

async function download(url, destination) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Angel-Leclerc-site-logo-cache/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("image/") && !type.includes("svg")) throw new Error(`type inattendu: ${type}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

await mkdir(OUT_DIR, { recursive: true });
let downloaded = 0;

for (const [filename, candidates] of logos) {
  let success = false;
  for (const url of candidates) {
    try {
      await download(url, join(OUT_DIR, filename));
      console.log(`[logos] ${filename} <- ${url}`);
      downloaded += 1;
      success = true;
      break;
    } catch (error) {
      console.warn(`[logos] source indisponible pour ${filename}: ${url} (${error.message})`);
    }
  }
  if (!success) console.warn(`[logos] ${filename}: aucun fichier récupéré, le fallback typographique sera utilisé.`);
}

console.log(`[logos] ${downloaded}/${logos.length} logos mis en cache localement.`);
