import { SQL } from "bun";

const databaseUrl = process.env.DATABASE_URL;
const dataUrl = process.env.ANGEL_DATA_URL ?? "http://angel-data:3100";
const dataToken = process.env.ANGEL_DATA_TOKEN;
const jobToken = process.env.ANGEL_JOBS_TOKEN;
const intervalMs = Math.max(60_000, Number(process.env.ANGEL_JOBS_INTERVAL_MS ?? 300_000));
const port = Number(process.env.PORT ?? 3400);
if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!dataToken) throw new Error("ANGEL_DATA_TOKEN is required");
if (!jobToken) throw new Error("ANGEL_JOBS_TOKEN is required");
const sql = new SQL(databaseUrl);

async function writeStatus(key: string, value: unknown) {
  const response = await fetch(`${dataUrl}/v1/documents/jobs.status/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${dataToken}` },
    body: JSON.stringify({ value }),
  });
  if (!response.ok) throw new Error(`Angel Data status write failed: ${response.status}`);
}

async function health(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch { return false; }
}

async function cleanupExpiredIdentitySessions() {
  const result = await sql`delete from angel_identity_sessions where expires_at < now() returning id`;
  return result.length;
}

async function runCycle(trigger: "timer" | "manual") {
  const startedAt = new Date().toISOString();
  const services = {
    data: await health(`${dataUrl}/health`),
    identity: await health(process.env.ANGEL_IDENTITY_URL ? `${process.env.ANGEL_IDENTITY_URL}/health` : "http://angel-identity:3200/health"),
    storage: await health(process.env.ANGEL_STORAGE_URL ? `${process.env.ANGEL_STORAGE_URL}/health` : "http://angel-storage:3300/health"),
  };
  let expiredSessionsRemoved = 0;
  try { expiredSessionsRemoved = await cleanupExpiredIdentitySessions(); } catch { /* identity may not be initialized yet */ }
  const result = { trigger, startedAt, finishedAt: new Date().toISOString(), services, expiredSessionsRemoved };
  await writeStatus("latest", result);
  await writeStatus(`run-${Date.now()}`, result);
  return result;
}

let running = false;
async function guardedCycle(trigger: "timer" | "manual") {
  if (running) return { skipped: true, reason: "already_running" };
  running = true;
  try { return await runCycle(trigger); } finally { running = false; }
}

setInterval(() => { void guardedCycle("timer"); }, intervalMs);
setTimeout(() => { void guardedCycle("timer"); }, 5_000);

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true, service: "angel-jobs", intervalMs, running });
    if (request.headers.get("authorization") !== `Bearer ${jobToken}`) return Response.json({ error: "unauthorized" }, { status: 401 });
    if (url.pathname === "/v1/run" && request.method === "POST") return Response.json(await guardedCycle("manual"));
    return Response.json({ error: "not_found" }, { status: 404 });
  },
});

console.log(`Angel Jobs listening on :${port}, interval=${intervalMs}ms`);
