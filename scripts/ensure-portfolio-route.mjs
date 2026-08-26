import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const routeTreePath = path.resolve(process.cwd(), "src/routeTree.gen.ts");
let source = await readFile(routeTreePath, "utf8");

if (source.includes("PortfolioRouteImport")) {
  console.log("[routes] /portfolio est déjà enregistré.");
  process.exit(0);
}

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`[routes] Point d’insertion introuvable : ${label}`);
  }
  source = source.replace(search, replacement);
}

function insertInSection(startMarker, endMarker, needle, addition, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`[routes] Section introuvable : ${label}`);
  const before = source.slice(0, start);
  let section = source.slice(start, end);
  const after = source.slice(end);
  if (!section.includes(needle)) throw new Error(`[routes] Point d’insertion introuvable : ${label}`);
  section = section.replace(needle, `${needle}${addition}`);
  source = before + section + after;
}

replaceOnce(
  "import { Route as ParcoursRouteImport } from './routes/parcours'\n",
  "import { Route as ParcoursRouteImport } from './routes/parcours'\nimport { Route as PortfolioRouteImport } from './routes/portfolio'\n",
  "import Parcours",
);

replaceOnce(
  "const ParcoursRoute = ParcoursRouteImport.update({\n  id: '/parcours',\n  path: '/parcours',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "const ParcoursRoute = ParcoursRouteImport.update({\n  id: '/parcours',\n  path: '/parcours',\n  getParentRoute: () => rootRouteImport,\n} as any)\nconst PortfolioRoute = PortfolioRouteImport.update({\n  id: '/portfolio',\n  path: '/portfolio',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "définition route Parcours",
);

insertInSection(
  "export interface FileRoutesByFullPath {",
  "export interface FileRoutesByTo {",
  "  '/parcours': typeof ParcoursRoute\n",
  "  '/portfolio': typeof PortfolioRoute\n",
  "FileRoutesByFullPath",
);

insertInSection(
  "export interface FileRoutesByTo {",
  "export interface FileRoutesById {",
  "  '/parcours': typeof ParcoursRoute\n",
  "  '/portfolio': typeof PortfolioRoute\n",
  "FileRoutesByTo",
);

insertInSection(
  "export interface FileRoutesById {",
  "export interface FileRouteTypes {",
  "  '/parcours': typeof ParcoursRoute\n",
  "  '/portfolio': typeof PortfolioRoute\n",
  "FileRoutesById",
);

insertInSection(
  "  fullPaths:",
  "  fileRoutesByTo:",
  "    | '/parcours'\n",
  "    | '/portfolio'\n",
  "FileRouteTypes.fullPaths",
);

insertInSection(
  "  to:",
  "  id:",
  "    | '/parcours'\n",
  "    | '/portfolio'\n",
  "FileRouteTypes.to",
);

insertInSection(
  "  id:",
  "  fileRoutesById:",
  "    | '/parcours'\n",
  "    | '/portfolio'\n",
  "FileRouteTypes.id",
);

replaceOnce(
  "  ParcoursRoute: typeof ParcoursRoute\n",
  "  ParcoursRoute: typeof ParcoursRoute\n  PortfolioRoute: typeof PortfolioRoute\n",
  "RootRouteChildren interface",
);

replaceOnce(
  "    '/parcours': {\n      id: '/parcours'\n      path: '/parcours'\n      fullPath: '/parcours'\n      preLoaderRoute: typeof ParcoursRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "    '/parcours': {\n      id: '/parcours'\n      path: '/parcours'\n      fullPath: '/parcours'\n      preLoaderRoute: typeof ParcoursRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n    '/portfolio': {\n      id: '/portfolio'\n      path: '/portfolio'\n      fullPath: '/portfolio'\n      preLoaderRoute: typeof PortfolioRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "FileRoutesByPath Portfolio",
);

replaceOnce(
  "  ParcoursRoute: ParcoursRoute,\n",
  "  ParcoursRoute: ParcoursRoute,\n  PortfolioRoute: PortfolioRoute,\n",
  "rootRouteChildren",
);

await writeFile(routeTreePath, source, "utf8");
console.log("[routes] /portfolio enregistré.");
