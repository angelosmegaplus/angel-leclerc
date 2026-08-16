import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const OWNER_EMAILS = new Set([
  "contact@angel-leclerc.fr",
  "angel.leclerc@icloud.com",
]);

const resetSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().min(4).max(32),
  password: z.string().min(8).max(128),
});

function adminClient() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new Error("Configuration d’authentification serveur incomplète.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

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
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function findUserByEmail(client: ReturnType<typeof adminClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 100) break;
  }
  return null;
}

export const resetOwnerPasswordWithEmergencyCode = createServerFn({ method: "POST" })
  .validator((input) => resetSchema.parse(input))
  .handler(async ({ data }) => {
    const configuredCode = String(process.env.ANGEL_ADMIN_PASSWORD_RESET_CODE ?? "").trim();
    if (!configuredCode) throw new Error("Le code d’urgence de récupération n’est pas configuré côté serveur.");

    const email = data.email.toLowerCase();
    if (!configuredOwnerEmails().has(email)) throw new Error("Ce compte n’est pas autorisé à utiliser la récupération propriétaire.");

    const client = adminClient();
    const user = await findUserByEmail(client, email);
    if (!user) throw new Error("Compte propriétaire introuvable.");

    const { data: attempt } = await client
      .from("admin_owner_recovery_attempts")
      .select("failed_attempts, locked_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      throw new Error("Trop de codes incorrects. Réessayez plus tard.");
    }

    if (!safeEqual(data.code, configuredCode)) {
      const failures = Number(attempt?.failed_attempts ?? 0) + 1;
      const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await client.from("admin_owner_recovery_attempts").upsert({
        user_id: user.id,
        failed_attempts: failures >= 5 ? 0 : failures,
        locked_until: lockedUntil,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      throw new Error(failures >= 5 ? "Trop de codes incorrects. Récupération bloquée 15 minutes." : "Code d’urgence incorrect.");
    }

    const { error: updateError } = await client.auth.admin.updateUserById(user.id, { password: data.password });
    if (updateError) throw updateError;

    await client.from("admin_owner_recovery_attempts").upsert({
      user_id: user.id,
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { ok: true };
  });
