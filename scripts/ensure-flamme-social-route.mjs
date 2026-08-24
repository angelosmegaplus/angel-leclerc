import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const routeTreePath = path.resolve(process.cwd(), "src/routeTree.gen.ts");
let source = await readFile(routeTreePath, "utf8");

if (source.includes("FlammeSocialRouteImport")) {
  console.log("[routes] /flamme/social est déjà enregistré.");
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
  "import { Route as FlammeRouteImport } from './routes/flamme'\n",
  "import { Route as FlammeRouteImport } from './routes/flamme'\nimport { Route as FlammeSocialRouteImport } from './routes/flamme_.social'\n",
  "import Flamme",
);

replaceOnce(
  "const FlammeRoute = FlammeRouteImport.update({\n  id: '/flamme',\n  path: '/flamme',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "const FlammeRoute = FlammeRouteImport.update({\n  id: '/flamme',\n  path: '/flamme',\n  getParentRoute: () => rootRouteImport,\n} as any)\nconst FlammeSocialRoute = FlammeSocialRouteImport.update({\n  id: '/flamme_/social',\n  path: '/flamme/social',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "définition route Flamme",
);

insertInSection(
  "export interface FileRoutesByFullPath {",
  "export interface FileRoutesByTo {",
  "  '/flamme': typeof FlammeRoute\n",
  "  '/flamme/social': typeof FlammeSocialRoute\n",
  "FileRoutesByFullPath",
);

insertInSection(
  "export interface FileRoutesByTo {",
  "export interface FileRoutesById {",
  "  '/flamme': typeof FlammeRoute\n",
  "  '/flamme/social': typeof FlammeSocialRoute\n",
  "FileRoutesByTo",
);

insertInSection(
  "export interface FileRoutesById {",
  "export interface FileRouteTypes {",
  "  '/flamme': typeof FlammeRoute\n",
  "  '/flamme_/social': typeof FlammeSocialRoute\n",
  "FileRoutesById",
);

insertInSection(
  "  fullPaths:",
  "  to:",
  "    | '/flamme'\n",
  "    | '/flamme/social'\n",
  "FileRouteTypes.fullPaths",
);

insertInSection(
  "  to:",
  "  id:",
  "    | '/flamme'\n",
  "    | '/flamme/social'\n",
  "FileRouteTypes.to",
);

insertInSection(
  "  id:",
  "  fileRoutesByFullPath:",
  "    | '/flamme'\n",
  "    | '/flamme_/social'\n",
  "FileRouteTypes.id",
);

replaceOnce(
  "  FlammeRoute: typeof FlammeRoute\n",
  "  FlammeRoute: typeof FlammeRoute\n  FlammeSocialRoute: typeof FlammeSocialRoute\n",
  "RootRouteChildren interface",
);

replaceOnce(
  "    '/flamme': {\n      id: '/flamme'\n      path: '/flamme'\n      fullPath: '/flamme'\n      preLoaderRoute: typeof FlammeRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "    '/flamme': {\n      id: '/flamme'\n      path: '/flamme'\n      fullPath: '/flamme'\n      preLoaderRoute: typeof FlammeRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n    '/flamme_/social': {\n      id: '/flamme_/social'\n      path: '/flamme/social'\n      fullPath: '/flamme/social'\n      preLoaderRoute: typeof FlammeSocialRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "FileRoutesByPath Flamme",
);

replaceOnce(
  "  FlammeRoute: FlammeRoute,\n",
  "  FlammeRoute: FlammeRoute,\n  FlammeSocialRoute: FlammeSocialRoute,\n",
  "rootRouteChildren",
);

await writeFile(routeTreePath, source, "utf8");
console.log("[routes] /flamme/social enregistré comme route non imbriquée (id /flamme_/social).");
