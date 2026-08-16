import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const OWNER_EMAILS = new Set([
  "contact@angel-leclerc.fr",
  "angel.leclerc@icloud.com",
]);

const inputSchema = z.object({
  code: z.string().trim().min(4).max(32),
});

function configuredOwnerEmails() {
  const extra = String(process.env.ANGEL_ADMIN_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...OWNER_EMAILS, ...extra]);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export const claimOwnerAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const configuredCode = String(process.env.ANGEL_ADMIN_RECOVERY_CODE ?? "").trim();
    if (!configuredCode) {
      throw new Error("Le code de secours administrateur n’est pas configuré côté serveur.");
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (userError || !userData.user) throw new Error("Compte introuvable.");

    const email = String(userData.user.email ?? "").trim().toLowerCase();
    if (!configuredOwnerEmails().has(email)) {
      throw new Error("Ce compte n’est pas autorisé à devenir propriétaire d’Angel OS.");
    }

    const now = new Date();
    const { data: attempt } = await supabaseAdmin
      .from("admin_owner_recovery_attempts")
      .select("failed_attempts, locked_until")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (attempt?.locked_until && new Date(attempt.locked_until) > now) {
      throw new Error("Trop de codes incorrects. Réessayez plus tard.");
    }

    if (!safeEqual(data.code, configuredCode)) {
      const failures = Number(attempt?.failed_attempts ?? 0) + 1;
      const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await supabaseAdmin.from("admin_owner_recovery_attempts").upsert({
        user_id: context.userId,
        failed_attempts: failures >= 5 ? 0 : failures,
        locked_until: lockedUntil,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      throw new Error(failures >= 5 ? "Trop de codes incorrects. Accès bloqué 15 minutes." : "Code de secours incorrect.");
    }

    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("admin_owner_recovery_attempts").upsert({
      user_id: context.userId,
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { ok: true, email };
  });
