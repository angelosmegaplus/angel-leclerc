import { createServerFn } from "@tanstack/react-start";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import type { NativeBusinessMigrationReport } from "./native-business-migration.server";

export const migrateBusinessCoreToAngelData = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<NativeBusinessMigrationReport> => {
    await assertAngelAdmin(context);
    const { migrateApplicationsAndArticlesToAngelData } = await import("./native-business-migration.server");
    return migrateApplicationsAndArticlesToAngelData();
  });
