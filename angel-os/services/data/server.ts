import { SQL } from "bun";

const databaseUrl = process.env.DATABASE_URL;
const token = process.env.ANGEL_DATA_TOKEN;
const port = Number(process.env.PORT ?? 3100);

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!token) throw new Error("ANGEL_DATA_TOKEN is required");

const sql = new SQL(databaseUrl);

await sql`
  create table if not exists angel_documents (
    namespace text not null,
    key text not null,
    value jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (namespace, key)
  )
`;

function authorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${token}`;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      const result = await sql`select 1 as ok`;
      return json({ ok: result[0]?.ok === 1, service: "angel-data" });
    }
    if (!authorized(request)) return json({ error: "unauthorized" }, 401);

    const match = url.pathname.match(/^\/v1\/documents\/([^/]+)(?:\/([^/]+))?$/);
    if (!match) return json({ error: "not_found" }, 404);

    const namespace = decodeURIComponent(match[1]);
    const key = match[2] ? decodeURIComponent(match[2]) : undefined;

    if (request.method === "GET" && key) {
      const rows = await sql`select value, created_at, updated_at from angel_documents where namespace = ${namespace} and key = ${key} limit 1`;
      return rows.length ? json({ key, ...rows[0] }) : json({ error: "not_found" }, 404);
    }

    if (request.method === "GET" && !key) {
      const rows = await sql`select key, value, created_at, updated_at from angel_documents where namespace = ${namespace} order by updated_at desc`;
      return json({ items: rows });
    }

    if (request.method === "PUT" && key) {
      const body = await request.json() as { value?: unknown };
      if (!("value" in body)) return json({ error: "value_required" }, 400);
      const encoded = JSON.stringify(body.value);
      const rows = await sql`
        insert into angel_documents (namespace, key, value)
        values (${namespace}, ${key}, ${encoded}::jsonb)
        on conflict (namespace, key) do update set value = excluded.value, updated_at = now()
        returning value, created_at, updated_at
      `;
      return json({ key, ...rows[0] });
    }

    if (request.method === "DELETE" && key) {
      await sql`delete from angel_documents where namespace = ${namespace} and key = ${key}`;
      return new Response(null, { status: 204 });
    }

    return json({ error: "method_not_allowed" }, 405);
  },
});

console.log(`Angel Data listening on :${port}`);
