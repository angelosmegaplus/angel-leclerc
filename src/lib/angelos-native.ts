import {
  deleteRow as legacyDeleteRow,
  listRows as legacyListRows,
  logActivity as legacyLogActivity,
  upsertRow as legacyUpsertRow,
  type AngelTable,
  type Row,
} from "@/lib/angelos";
import {
  listAngelRows,
  recordAngelActivity,
  removeAngelRow,
  saveAngelRow,
} from "@/lib/angelos-native.functions";

export type { AngelTable, Row } from "@/lib/angelos";
export { str, tagsOf } from "@/lib/angelos";

export async function listRows(table: AngelTable, orderBy = "created_at"): Promise<Row[]> {
  try {
    return await listAngelRows({ data: { table, orderBy } });
  } catch (error) {
    console.warn("[Angel OS] Angel Data indisponible, fallback CRUD Supabase", error);
    return legacyListRows(table, orderBy);
  }
}

export async function upsertRow(table: AngelTable, values: Record<string, unknown>, id?: string | null): Promise<Row> {
  try {
    return await saveAngelRow({ data: { table, values, id: id ?? null } });
  } catch (error) {
    console.warn("[Angel OS] écriture Angel Data indisponible, fallback Supabase", error);
    return legacyUpsertRow(table, values, id);
  }
}

export async function deleteRow(table: AngelTable, id: string) {
  try {
    await removeAngelRow({ data: { table, id } });
  } catch (error) {
    console.warn("[Angel OS] suppression Angel Data indisponible, fallback Supabase", error);
    await legacyDeleteRow(table, id);
  }
}

export async function logActivity(action: string, entityType: string, entityId?: string | null, details: Record<string, unknown> = {}, source: "user" | "ai" | "system" = "user") {
  try {
    await recordAngelActivity({ data: { action, entityType, entityId: entityId ?? null, details, source } });
  } catch {
    await legacyLogActivity(action, entityType, entityId, details, source);
  }
}
