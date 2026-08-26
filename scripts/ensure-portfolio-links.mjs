import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const enterprisePath = path.resolve(process.cwd(), "src/routes/entreprise.tsx");
let source = await readFile(enterprisePath, "utf8");

const oldBlock = `  {
    icon: FolderOpen,
    eyebrow: "Portfolio",
    title: "Mes réalisations",
    text: "Découvrez des projets concrets, les missions réalisées et les résultats obtenus.",
    href: "/parcours#realisations",
    cta: "Voir les réalisations",
  },`;

const newBlock = `  {
    icon: FolderOpen,
    eyebrow: "Portfolio",
    title: "Mon portfolio créatif",
    text: "Logos, affiches, identités visuelles, projets et expérimentations : une sélection de créations faites pour des projets ou simplement pour le plaisir de créer.",
    href: "/portfolio",
    cta: "Voir mon portfolio",
  },`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
  await writeFile(enterprisePath, source, "utf8");
  console.log("[portfolio] carte Entreprise reliée à /portfolio.");
} else if (source.includes('href: "/portfolio"')) {
  console.log("[portfolio] carte Entreprise déjà reliée à /portfolio.");
} else {
  throw new Error("[portfolio] carte Portfolio de la page Entreprise introuvable.");
}
