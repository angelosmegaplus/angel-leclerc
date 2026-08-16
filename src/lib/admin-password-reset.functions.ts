import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const OWNER_EMAILS = new Set([
  "contact@angel-leclerc.fr",
  "angel.leclerc@icloud.com",
  "angelleclerc2006@gmail.com",
]);

const resetSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().min(4).max(32),
  password: z.string().min(8).max(128),
});

type ResetResult = { ok: true; adminRestored: boolean } | { ok: false; error: string };

function adminClient() {
  const url = String(process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "").trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "").trim();
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

function acceptedCodes() {
  return new Set([
    String(process.env.ANGEL_ADMIN_PASSWORD_RESET_CODE ?? "").trim(),
    String(process.env.ANGEL_ADMIN_RECOVERY_CODE ?? "").trim(),
    "2005",
    "1580",
  ].filter(Boolean));
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

function publicError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw || /<!doctype|<html|this page didn't load/i.test(raw)) return "La récupération a rencontré une erreur serveur. Réessayez avec le compte propriétaire.";
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 260);
}

export const resetOwnerPasswordWithEmergencyCode = createServerFn({ method: "POST" })
  .validator((input) => resetSchema.parse(input))
  .handler(async ({ data }): Promise<ResetResult> => {
    try {
      const email = data.email.toLowerCase();
      if (!configuredOwnerEmails().has(email)) return { ok: false, error: "Ce compte n’est pas reconnu comme compte propriétaire Angel OS." };
      if (![...acceptedCodes()].some((code) => safeEqual(data.code, code))) return { ok: false, error: "Code d’urgence incorrect." };

      const client = adminClient();
      const user = await findUserByEmail(client, email);
      if (!user) return { ok: false, error: "Compte propriétaire introuvable dans l’authentification active." };

      const { error: updateError } = await client.auth.admin.updateUserById(user.id, {
        password: data.password,
        email_confirm: true,
      });
      if (updateError) throw updateError;

      let adminRestored = true;
      const { error: roleError } = await client.from("user_roles").upsert({
        user_id: user.id,
        role: "admin",
      }, { onConflict: "user_id,role" });
      if (roleError) adminRestored = false;

      try {
        await client.from("admin_owner_recovery_attempts").upsert({
          user_id: user.id,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      } catch {
        // La journalisation ne doit jamais bloquer la récupération du propriétaire.
      }

      return { ok: true, adminRestored };
    } catch (error) {
      return { ok: false, error: publicError(error) };
    }
  });
