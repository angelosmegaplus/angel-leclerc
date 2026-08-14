import { SQL } from "bun";

const databaseUrl = process.env.DATABASE_URL;
const serviceToken = process.env.ANGEL_IDENTITY_TOKEN;
const sessionTtlDays = Number(process.env.ANGEL_IDENTITY_SESSION_DAYS ?? 30);
const port = Number(process.env.PORT ?? 3200);

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!serviceToken) throw new Error("ANGEL_IDENTITY_TOKEN is required");

const sql = new SQL(databaseUrl);

await sql`
  create table if not exists angel_identity_users (
    id uuid primary key,
    email text unique not null,
    password_hash text not null,
    role text not null default 'user',
    enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`;
await sql`
  create table if not exists angel_identity_sessions (
    id uuid primary key,
    user_id uuid not null references angel_identity_users(id) on delete cascade,
    token_hash text unique not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
  )
`;
await sql`create index if not exists angel_identity_sessions_user_idx on angel_identity_sessions(user_id)`;
await sql`create index if not exists angel_identity_sessions_expiry_idx on angel_identity_sessions(expires_at)`;

const bootstrapEmail = process.env.ANGEL_IDENTITY_ADMIN_EMAIL?.trim().toLowerCase();
const bootstrapPassword = process.env.ANGEL_IDENTITY_ADMIN_PASSWORD;
if (bootstrapEmail && bootstrapPassword) {
  const existing = await sql`select id from angel_identity_users where email = ${bootstrapEmail} limit 1`;
  if (!existing.length) {
    const passwordHash = await Bun.password.hash(bootstrapPassword, { algorithm: "argon2id" });
    await sql`insert into angel_identity_users (id, email, password_hash, role) values (${crypto.randomUUID()}, ${bootstrapEmail}, ${passwordHash}, 'admin')`;
    console.log(`Angel Identity bootstrap admin created: ${bootstrapEmail}`);
  }
}

function json(data: unknown, status = 200) { return Response.json(data, { status }); }
function serviceAuthorized(request: Request) { return request.headers.get("x-angel-service-token") === serviceToken; }
function bearer(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice(7) : null;
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function publicUser(row: any) { return { id: row.id, email: row.email, role: row.role }; }

async function resolveSession(rawToken: string) {
  const tokenHash = await sha256(rawToken);
  const rows = await sql`
    select u.id, u.email, u.role, u.enabled, s.id as session_id, s.expires_at
    from angel_identity_sessions s
    join angel_identity_users u on u.id = s.user_id
    where s.token_hash = ${tokenHash} and s.expires_at > now()
    limit 1
  `;
  if (!rows.length || !rows[0].enabled) return null;
  await sql`update angel_identity_sessions set last_seen_at = now() where id = ${rows[0].session_id}`;
  return rows[0];
}

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      const result = await sql`select 1 as ok`;
      return json({ ok: result[0]?.ok === 1, service: "angel-identity" });
    }

    if (url.pathname === "/v1/login" && request.method === "POST") {
      const body = await request.json() as { email?: string; password?: string };
      const email = body.email?.trim().toLowerCase();
      if (!email || !body.password) return json({ error: "credentials_required" }, 400);
      const users = await sql`select id, email, password_hash, role, enabled from angel_identity_users where email = ${email} limit 1`;
      if (!users.length || !users[0].enabled || !(await Bun.password.verify(body.password, users[0].password_hash))) {
        return json({ error: "invalid_credentials" }, 401);
      }
      const rawToken = `${crypto.randomUUID()}.${crypto.randomUUID()}.${crypto.randomUUID()}`;
      const tokenHash = await sha256(rawToken);
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + sessionTtlDays * 86400000);
      await sql`insert into angel_identity_sessions (id, user_id, token_hash, expires_at) values (${sessionId}, ${users[0].id}, ${tokenHash}, ${expiresAt})`;
      return json({ token: rawToken, expiresAt: expiresAt.toISOString(), user: publicUser(users[0]) });
    }

    if (url.pathname === "/v1/session" && request.method === "GET") {
      const token = bearer(request);
      if (!token) return json({ error: "unauthorized" }, 401);
      const session = await resolveSession(token);
      return session ? json({ user: publicUser(session), expiresAt: session.expires_at }) : json({ error: "unauthorized" }, 401);
    }

    if (url.pathname === "/v1/logout" && request.method === "POST") {
      const token = bearer(request);
      if (!token) return new Response(null, { status: 204 });
      const tokenHash = await sha256(token);
      await sql`delete from angel_identity_sessions where token_hash = ${tokenHash}`;
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/v1/users" && request.method === "POST") {
      if (!serviceAuthorized(request)) return json({ error: "unauthorized" }, 401);
      const body = await request.json() as { email?: string; password?: string; role?: string };
      const email = body.email?.trim().toLowerCase();
      if (!email || !body.password) return json({ error: "email_and_password_required" }, 400);
      const passwordHash = await Bun.password.hash(body.password, { algorithm: "argon2id" });
      const id = crypto.randomUUID();
      const rows = await sql`insert into angel_identity_users (id, email, password_hash, role) values (${id}, ${email}, ${passwordHash}, ${body.role ?? "user"}) returning id, email, role`;
      return json({ user: publicUser(rows[0]) }, 201);
    }

    if (url.pathname === "/v1/maintenance" && request.method === "POST") {
      if (!serviceAuthorized(request)) return json({ error: "unauthorized" }, 401);
      const result = await sql`delete from angel_identity_sessions where expires_at <= now()`;
      return json({ ok: true, removed: result.count ?? 0 });
    }

    return json({ error: "not_found" }, 404);
  },
});

console.log(`Angel Identity listening on :${port}`);
