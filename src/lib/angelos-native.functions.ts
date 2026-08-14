import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";

const TABLES = ["projects", "project_tasks", "applications", "contacts_sources", "reportages", "interviews", "investigations", "press_review", "notifications", "activity_log", "ai_messages"] as const;
const tableSchema = z.enum(TABLES);

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const listAngelRows = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, orderBy: z.string().default("created_at") }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const { listNativeRows } = await import("./angelos-native.server");
    return (await listNativeRows(input.table, input.orderBy)) as any;
  });

export const saveAngelRow = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, values: z.record(z.string(), z.any()), id: z.string().nullable().optional() }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const { saveNativeRow } = await import("./angelos-native.server");
    return (await saveNativeRow(input.table, input.values as Record<string, JsonValue>, input.id)) as any;
  });

export const removeAngelRow = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const { removeNativeRow } = await import("./angelos-native.server");
    await removeNativeRow(input.table, input.id);
    return { ok: true };
  });

export const recordAngelActivity = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: unknown) => z.object({ action: z.string(), entityType: z.string(), entityId: z.string().nullable().optional(), details: z.record(z.string(), z.any()).default({}), source: z.enum(["user", "ai", "system"]).default("user") }).parse(input))
  .handler(async ({ context, data: input }) => {
    await assertAngelAdmin(context);
    const { recordNativeActivity } = await import("./angelos-native.server");
    await recordNativeActivity({ ...input, details: input.details as Record<string, JsonValue> });
    return { ok: true };
  });
