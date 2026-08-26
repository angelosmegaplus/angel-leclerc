import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "public/logos/scoutisme";
const logos = [
  ["fraternite.jpg", "https://www.fraternite.net/images/officiel/logofrat.jpg"],
  ["scoutisme-francais.jpg", "https://static.wixstatic.com/media/2280b3_21db838b8d7748dc9391884b65fe85b2~mv2.jpg"],
  ["reseau-baden-powell.png", "https://www.reseau-bp.fr/wp-content/uploads/2022/01/cropped-150px-Insigne_du_RBP.png"],
];

await mkdir(OUT_DIR, { recursive: true });
for (const [file, url] of logos) {
  const outPath = join(OUT_DIR, file);
  try { await access(outPath); console.log(`[scout-logos] ${file}: deja en cache, ignore.`); continue; } catch { /* absent, on telecharge */ }
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "user-agent": "Mozilla/5.0 Angel-Leclerc-site" } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) throw new Error(`type inattendu: ${type}`);
    await writeFile(join(OUT_DIR, file), Buffer.from(await response.arrayBuffer()));
    console.log(`[scout-logos] ${file} mis en cache`);
  } catch (error) {
    console.warn(`[scout-logos] ${file}: ${error.message}`);
  }
}
