import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import { AngelOSAdapterRegistry } from "../../angel-os/core/adapter-registry";
import { angelDataServerAdapter, type AngelDataClient } from "../../angel-os/adapters/data.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TABLES = [
  "projects",
  "project_tasks",
  "applications",
  "contacts_sources",
  "reportages",
  "interviews",
  "investigations",
  "press_review",
  "notifications",
  "activity_log",
  "ai_messages",
] as const;

type AngelTable = (typeof TABLES)[number];
type Row = Record<string, unknown> & { id: string; created_at?: string; updated_at?: string };

const tableSchema = z.enum(TABLES);
const adapters = new AngelOSAdapterRegistry();
adapters.register(angelDataServerAdapter);

async function dataClient(): Promise<AngelDataClient> {
  return adapters.connect<AngelDataClient>("angel.data.native");
}

function namespace(table: AngelTable) {
  return `crud.${table}`;
}

async function importLegacyIfNeeded(data: AngelDataClient, table: AngelTable): Promise<Row[]> {
  const existing = await data.list<Row>(namespace(table));
  if (existing.length) return existing.map((item) => item.value);

  const { data: legacy, error } = await (supabaseAdmin as any)
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const rows = (legacy ?? []) as Row[];
  for (const row of rows) await data.set(namespace(table), row.id, row);
  if (rows.length) {
    await data.set("migration.status", `crud.${table}`, {
      source: "supabase",
      destination: `angel-data:${namespace(table)}`,
      imported: rows.length,
      migratedAt: new Date().toISOString(),
    });
  }
  return rows;
}

export const listAngelRows = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, orderBy: z.string().default("created_at") }).parse(input))
  .handler(async ({ context, data: input }): Promise<Row[]> => {
    await assertAngelAdmin(context);
    const data = await dataClient();
    const rows = await importLegacyIfNeeded(data, input.table);
    return [...rows].sort((a, b) => String(b[input.orderBy] ?? "").localeCompare(String(a[input.orderBy] ?? ""))).slice(0, 500);
  });

export const saveAngelRow = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, values: z.record(z.string(), z.unknown()), id: z.string().nullable().optional() }).parse(input))
  .handler(async ({ context, data: input }): Promise<Row> => {
    await assertAngelAdmin(context);
    const data = await dataClient();
    await importLegacyIfNeeded(data, input.table);
    const now = new Date().toISOString();
    const id = input.id ?? crypto.randomUUID();
    const previous = input.id ? await data.get<Row>(namespace(input.table), id) : null;
    const row: Row = {
      ...(previous ?? {}),
      ...input.values,
      id,
      created_at: previous?.created_at ?? now,
      updated_at: now,
    };
    await data.set(namespace(input.table), id, row);
    await data.set("activity.native", crypto.randomUUID(), {
      source: "user",
      action: input.id ? "update" : "create",
      entityType: input.table,
      entityId: id,
      at: now,
    });
    return row;
  });

export const removeAngelRow = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const data = await dataClient();
    await data.delete(namespace(input.table), input.id);
    await data.set("activity.native", crypto.randomUUID(), {
      source: "user",
      action: "delete",
      entityType: input.table,
      entityId: input.id,
      at: new Date().toISOString(),
    });
    return { ok: true };
  });

export const recordAngelActivity = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ action: z.string(), entityType: z.string(), entityId: z.string().nullable().optional(), details: z.record(z.string(), z.unknown()).default({}), source: z.enum(["user", "ai", "system"]).default("user") }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const data = await dataClient();
    await data.set("activity.native", crypto.randomUUID(), { ...input, at: new Date().toISOString() });
    return { ok: true };
  });
