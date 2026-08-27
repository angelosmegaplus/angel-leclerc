// Génère src/lib/public-assets.generated.ts à partir du dossier public/.
// Usage : node scripts/generate-public-index.mjs
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = "public";
const SKIP_DIRS = new Set(["icons"]);
const SKIP_FILES = new Set([
  "robots.txt",
  "security.txt",
  "sw.js",
  "sw-push.js",
  "offline.html",
  "admin-lovable.css",
  "flamme.webmanifest",
  "angel-release.json",
  "favicon.png",
]);

const KIND_BY_EXT = {
  ".pdf": "Document",
  ".mp4": "Vidéo",
  ".webp": "Image",
  ".png": "Image",
  ".jpg": "Image",
  ".jpeg": "Image",
  ".svg": "Image",
  ".webmanifest": "Fichier",
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walk(full));
    } else {
      if (SKIP_FILES.has(entry)) continue;
      if (entry.startsWith(".")) continue;
      out.push(full);
    }
  }
  return out;
}

function titleize(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

const files = walk(ROOT).sort();
const entries = files.map((file) => {
  const href = "/" + file.slice(ROOT.length + 1).split("\\").join("/");
  const ext = extname(file).toLowerCase();
  const kind = KIND_BY_EXT[ext] ?? "Fichier";
  const folder = href.split("/").slice(1, -1).join(" ");
  const title = titleize(basename(file));
  const keywords = Array.from(
    new Set(
      `${title} ${folder} ${ext.slice(1)}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 1),
    ),
  );
  return { title, href, kind, folder, keywords };
});

const body = `// Fichier généré par scripts/generate-public-index.mjs — ne pas éditer à la main.
export type PublicAsset = {
  title: string;
  href: string;
  kind: string;
  folder: string;
  keywords: string[];
};

export const PUBLIC_ASSETS: PublicAsset[] = ${JSON.stringify(entries, null, 2)};
`;

writeFileSync("src/lib/public-assets.generated.ts", body);
console.log(`public-assets.generated.ts : ${entries.length} fichiers indexés`);
