import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(process.env.ANGEL_STORAGE_PATH ?? "/var/lib/angel-os/storage");
const token = process.env.ANGEL_STORAGE_TOKEN;
const port = Number(process.env.PORT ?? 3300);
if (!token) throw new Error("ANGEL_STORAGE_TOKEN is required");
await mkdir(root, { recursive: true });

function authorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${token}`;
}
function safePath(input: string) {
  const clean = input.split("/").filter(Boolean).map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_")).join("/");
  const target = resolve(root, clean);
  if (!target.startsWith(root + "/") && target !== root) throw new Error("invalid_path");
  return target;
}
function json(value: unknown, status = 200) { return Response.json(value, { status }); }

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true, service: "angel-storage", root });
    if (!authorized(request)) return json({ error: "unauthorized" }, 401);

    if (url.pathname === "/v1/files" && request.method === "GET") {
      const dir = safePath(url.searchParams.get("prefix") ?? "");
      await mkdir(dir, { recursive: true });
      const items = await readdir(dir, { withFileTypes: true });
      const output = await Promise.all(items.map(async (entry) => {
        const path = join(dir, entry.name);
        const meta = await stat(path);
        return { name: entry.name, directory: entry.isDirectory(), size: meta.size, updatedAt: meta.mtime.toISOString() };
      }));
      return json({ items: output });
    }

    const match = url.pathname.match(/^\/v1\/files\/(.+)$/);
    if (!match) return json({ error: "not_found" }, 404);
    let path: string;
    try { path = safePath(decodeURIComponent(match[1])); } catch { return json({ error: "invalid_path" }, 400); }

    if (request.method === "PUT") {
      await mkdir(resolve(path, ".."), { recursive: true });
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (bytes.byteLength > 25 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
      await Bun.write(path, bytes);
      const meta = await stat(path);
      return json({ ok: true, size: meta.size, updatedAt: meta.mtime.toISOString() });
    }
    if (request.method === "GET") {
      try { return new Response(Bun.file(path)); } catch { return json({ error: "not_found" }, 404); }
    }
    if (request.method === "DELETE") {
      try { await unlink(path); } catch { /* idempotent */ }
      return new Response(null, { status: 204 });
    }
    return json({ error: "method_not_allowed" }, 405);
  },
});

console.log(`Angel Storage listening on :${port}`);
