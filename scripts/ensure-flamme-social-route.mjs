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

replaceOnce(
  "import { Route as FlammeRouteImport } from './routes/flamme'\n",
  "import { Route as FlammeRouteImport } from './routes/flamme'\nimport { Route as FlammeSocialRouteImport } from './routes/flamme_.social'\n",
  "import Flamme",
);

replaceOnce(
  "const FlammeRoute = FlammeRouteImport.update({\n  id: '/flamme',\n  path: '/flamme',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "const FlammeRoute = FlammeRouteImport.update({\n  id: '/flamme',\n  path: '/flamme',\n  getParentRoute: () => rootRouteImport,\n} as any)\nconst FlammeSocialRoute = FlammeSocialRouteImport.update({\n  id: '/flamme/social',\n  path: '/flamme/social',\n  getParentRoute: () => rootRouteImport,\n} as any)\n",
  "définition route Flamme",
);

replaceOnce(
  "  '/flamme': typeof FlammeRoute\n",
  "  '/flamme': typeof FlammeRoute\n  '/flamme/social': typeof FlammeSocialRoute\n",
  "FileRoutesByFullPath",
);

replaceOnce(
  "export interface FileRoutesByTo {\n  '/': typeof IndexRoute",
  "export interface FileRoutesByTo {\n  '/': typeof IndexRoute",
  "début FileRoutesByTo",
);
const byToStart = source.indexOf("export interface FileRoutesByTo {");
const byIdStart = source.indexOf("export interface FileRoutesById {");
const fileTypesStart = source.indexOf("export interface FileRouteTypes {");
if (byToStart < 0 || byIdStart < 0 || fileTypesStart < 0) throw new Error("[routes] Interfaces générées introuvables.");

function insertInSection(start, end, needle, addition, label) {
  const before = source.slice(0, start);
  let section = source.slice(start, end);
  const after = source.slice(end);
  if (!section.includes(needle)) throw new Error(`[routes] ${label} introuvable.`);
  section = section.replace(needle, `${needle}${addition}`);
  source = before + section + after;
}

let toStart = source.indexOf("export interface FileRoutesByTo {");
let idStart = source.indexOf("export interface FileRoutesById {");
insertInSection(toStart, idStart, "  '/flamme': typeof FlammeRoute\n", "  '/flamme/social': typeof FlammeSocialRoute\n", "Flamme dans FileRoutesByTo");

idStart = source.indexOf("export interface FileRoutesById {");
let typesStart = source.indexOf("export interface FileRouteTypes {");
insertInSection(idStart, typesStart, "  '/flamme': typeof FlammeRoute\n", "  '/flamme/social': typeof FlammeSocialRoute\n", "Flamme dans FileRoutesById");

let cursor = source.indexOf("export interface FileRouteTypes {");
for (let index = 0; index < 3; index += 1) {
  const position = source.indexOf("    | '/flamme'\n", cursor);
  if (position < 0) throw new Error(`[routes] Union Flamme #${index + 1} introuvable.`);
  const end = position + "    | '/flamme'\n".length;
  source = source.slice(0, end) + "    | '/flamme/social'\n" + source.slice(end);
  cursor = end + "    | '/flamme/social'\n".length;
}

replaceOnce(
  "  FlammeRoute: typeof FlammeRoute\n",
  "  FlammeRoute: typeof FlammeRoute\n  FlammeSocialRoute: typeof FlammeSocialRoute\n",
  "RootRouteChildren interface",
);

replaceOnce(
  "    '/flamme': {\n      id: '/flamme'\n      path: '/flamme'\n      fullPath: '/flamme'\n      preLoaderRoute: typeof FlammeRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "    '/flamme': {\n      id: '/flamme'\n      path: '/flamme'\n      fullPath: '/flamme'\n      preLoaderRoute: typeof FlammeRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n    '/flamme/social': {\n      id: '/flamme/social'\n      path: '/flamme/social'\n      fullPath: '/flamme/social'\n      preLoaderRoute: typeof FlammeSocialRouteImport\n      parentRoute: typeof rootRouteImport\n    }\n",
  "FileRoutesByPath Flamme",
);

replaceOnce(
  "  FlammeRoute: FlammeRoute,\n",
  "  FlammeRoute: FlammeRoute,\n  FlammeSocialRoute: FlammeSocialRoute,\n",
  "rootRouteChildren",
);

await writeFile(routeTreePath, source, "utf8");
console.log("[routes] /flamme/social ajouté à l’arbre TanStack généré comme route non imbriquée.");
