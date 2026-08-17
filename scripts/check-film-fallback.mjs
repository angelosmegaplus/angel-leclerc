import { readFile } from "node:fs/promises";

const files = {
  catalog: await readFile("src/lib/film-catalog.ts", "utf8"),
  list: await readFile("src/routes/admin-movix.tsx", "utf8"),
  localDetail: await readFile("src/routes/admin-movix.$id.tsx", "utf8"),
  tmdbDetail: await readFile("src/routes/admin-movix.tmdb.$mediaType.$tmdbId.tsx", "utf8"),
  artwork: await readFile("src/components/admin/MovieArtwork.tsx", "utf8"),
};

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const catalogEntries = [...files.catalog.matchAll(/\{ id: "[^"]+"[\s\S]*?\},/g)].map((match) => match[0]);
expect(catalogEntries.length >= 8, "Le catalogue local contient trop peu de fiches de secours.");
for (const entry of catalogEntries) {
  const id = entry.match(/id: "([^"]+)"/)?.[1] ?? "inconnu";
  expect(/pitch: "[^\"]{30,}"/.test(entry), `${id}: synopsis local absent ou trop court.`);
  expect(/genreLabel: "[^"]+"/.test(entry), `${id}: genre local absent.`);
  expect(/rating: [0-9]/.test(entry), `${id}: note locale absente.`);
}

expect(files.list.includes("<MoviePoster candidate={item}"), "Le catalogue n'utilise plus le composant d'affiche résilient.");
expect(files.artwork.includes("BINARY_CACHE_NAME"), "Le cache binaire interne des affiches a disparu.");
expect(files.artwork.includes("wikipediaArtwork"), "Le secours d'affiche indépendant de TMDB a disparu.");
expect(files.localDetail.includes("Synopsis complet"), "La fiche locale n'affiche plus le synopsis complet.");
expect(files.localDetail.includes("ProviderList"), "La fiche locale n'affiche plus les plateformes remontées.");
expect(files.tmdbDetail.includes("Disponible en France"), "La fiche TMDB n'affiche plus la disponibilité France.");
expect(files.tmdbDetail.includes("detail.providers"), "Les fournisseurs TMDB ne sont plus exploités.");

if (failures.length) {
  console.error("Maintenance Films & séries en échec :");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Maintenance Films & séries OK · ${catalogEntries.length} fiches locales contrôlées · affiches cache interne · synopsis · disponibilités.`);
