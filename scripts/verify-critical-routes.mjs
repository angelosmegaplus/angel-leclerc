import fs from "node:fs";

const routeTreePath = "src/routeTree.gen.ts";
const source = fs.readFileSync(routeTreePath, "utf8");

const requiredRoutes = [
  "/auth",
  "/admin",
  "/admin-integrations",
  "/admin-movix",
  "/parcours",
  "/articles",
  "/contact",
  "/api/angel-os/health",
  "/api/assistant",
];

const missing = requiredRoutes.filter((route) => !source.includes(`'${route}'`) && !source.includes(`\"${route}\"`));

if (missing.length > 0) {
  console.error(`Critical route contract broken: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`Critical route contract OK: ${requiredRoutes.length}/${requiredRoutes.length}`);
