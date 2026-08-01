// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Existing line — do NOT change: loads VITE_* env vars for client code
  const env = loadEnv(mode, process.cwd(), "VITE_");

  // Load all env vars into process.env for server-side code (server routes / server functions).
  // Do NOT add these keys to the returned envDefine — that would leak secrets into the client bundle.
  const serverEnv = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, serverEnv);

  return {
    tanstackStart: {
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    },
    vite: {
      // React Email's htmlparser2 needs entities v4.5.0; pin every import path to the hoisted copy.
      resolve: {
        alias: {
          "entities/lib/decode.js": path.resolve(process.cwd(), "node_modules/entities/lib/decode.js"),
          "entities/lib/encode.js": path.resolve(process.cwd(), "node_modules/entities/lib/encode.js"),
          entities: path.resolve(process.cwd(), "node_modules/entities"),
        },
      },
    },
  };
});
