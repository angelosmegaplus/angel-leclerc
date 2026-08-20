import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().trim().min(3).max(1200),
  userId: z.string().trim().max(120).optional().nullable(),
  userEmail: z.string().trim().email().max(255).optional().nullable(),
});

const recentByIp = new Map<string, number[]>();

function checkRateLimit(ip: string | null) {
  if (!ip) return;
  const now = Date.now();
  const recent = (recentByIp.get(ip) || []).filter((time) => now - time < 60 * 60_000);
  if (recent.length >= 8) throw new Error("Trop de suggestions envoyées récemment. Réessaie un peu plus tard.");
  recent.push(now);
  recentByIp.set(ip, recent);
}

async function sendEmailFallback(message: string, email?: string | null) {
  const response = await fetch("https://formsubmit.co/ajax/contact@angel-leclerc.fr", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: "[Angel Movies] Nouvelle idée de mise à jour",
      _template: "table",
      message,
      utilisateur: email || "Compte Angel Movies",
      source: "Angel Movies — formulaire ampoule",
    }),
  });
  if (!response.ok) throw new Error("La suggestion n’a pas pu être envoyée.");
}

export const submitMovieFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    checkRateLimit(ip);
    const createdAt = new Date().toISOString();
    const hasSupabaseAdmin = Boolean(
      process.env["SUPABASE_URL"] &&
      (process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["SUPABASE_SECRET_KEY"]),
    );

    if (hasSupabaseAdmin) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("ai_actions").insert({
        kind: "user_feedback",
        title: "Idée Angel Movies",
        description: data.message,
        payload: {
          message: data.message,
          source: "angel_movies_feedback",
          route: "/films-series",
          created_at: createdAt,
          user_id: data.userId || null,
          user_email: data.userEmail || null,
        },
        status: "pending",
        target_type: "admin",
        sensitive: false,
      });
      if (!error) return { ok: true as const, channel: "admin" as const };
    }

    await sendEmailFallback(data.message, data.userEmail);
    return { ok: true as const, channel: "email" as const };
  });
