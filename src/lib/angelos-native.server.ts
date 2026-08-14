import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const TABLES = ["projects", "project_tasks", "applications", "contacts_sources", "reportages", "interviews", "investigations", "press_review", "notifications", "activity_log", "ai_messages"] as const;
export type AngelTable = (typeof TABLES)[number];
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type NativeRow = { id: string; created_at?: string; updated_at?: string; [key: string]: JsonValue | undefined };

const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);
async function dataClient(): Promise<AngelDataClient> { return adapters.connect<AngelDataClient>("angel.data.native"); }
function namespace(table: AngelTable) { return `crud.${table}`; }

async function importLegacyIfNeeded(data: AngelDataClient, table: AngelTable): Promise<NativeRow[]> {
  const existing = await data.list<NativeRow>(namespace(table));
  if (existing.length) return existing.map((item) => item.value);
  const { data: legacy, error } = await (supabaseAdmin as any).from(table).select("*").order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  const rows = (legacy ?? []) as NativeRow[];
  for (const row of rows) await data.set(namespace(table), row.id, row);
  if (rows.length) await data.set("migration.status", `crud.${table}`, { source: "supabase", destination: `angel-data:${namespace(table)}`, imported: rows.length, migratedAt: new Date().toISOString() });
  return rows;
}

export async function listNativeRows(table: AngelTable, orderBy: string) {
  const data = await dataClient();
  const rows = await importLegacyIfNeeded(data, table);
  return [...rows].sort((a, b) => String(b[orderBy] ?? "").localeCompare(String(a[orderBy] ?? ""))).slice(0, 500);
}

export async function saveNativeRow(table: AngelTable, values: Record<string, JsonValue>, requestedId?: string | null) {
  const data = await dataClient();
  await importLegacyIfNeeded(data, table);
  const now = new Date().toISOString();
  const id = requestedId ?? crypto.randomUUID();
  const previous = requestedId ? await data.get<NativeRow>(namespace(table), id) : null;
  const row = { ...(previous ?? {}), ...values, id, created_at: previous?.created_at ?? now, updated_at: now } as NativeRow;
  await data.set(namespace(table), id, row);
  await data.set("activity.native", crypto.randomUUID(), { source: "user", action: requestedId ? "update" : "create", entityType: table, entityId: id, at: now });
  return row;
}

export async function removeNativeRow(table: AngelTable, id: string) {
  const data = await dataClient();
  await data.delete(namespace(table), id);
  await data.set("activity.native", crypto.randomUUID(), { source: "user", action: "delete", entityType: table, entityId: id, at: new Date().toISOString() });
}

export async function recordNativeActivity(input: { action: string; entityType: string; entityId?: string | null; details: Record<string, JsonValue>; source: "user" | "ai" | "system" }) {
  const data = await dataClient();
  await data.set("activity.native", crypto.randomUUID(), { ...input, at: new Date().toISOString() });
}
