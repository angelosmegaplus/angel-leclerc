import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { reconcileApplicationsFromMail } from "@/lib/angel-os-ia/applications-reconcile.server";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/hooks/applications-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided =
          request.headers.get("x-cron-token") ??
          request.headers.get("authorization")?.replace("Bearer ", "") ??
          "";
        const expected = process.env["NEWSLETTER_CRON_SECRET"];
        if (!expected || !provided || !safeEqual(provided, expected)) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        try {
          if (!supabaseAdmin) {
            return Response.json(
              { ok: false, error: "Supabase service role indisponible sur le serveur." },
              { status: 503 },
            );
          }

          const { data: adminRole, error } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin")
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          if (!adminRole?.user_id) {
            return Response.json({ ok: false, error: "Aucun administrateur trouvé." }, { status: 404 });
          }

          const result = await reconcileApplicationsFromMail(adminRole.user_id, supabaseAdmin);
          return Response.json({ ok: result.status !== "not_connected", ...result });
        } catch (error) {
          console.error("[applications-sync] Angel OS IA reconciliation failed", error);
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
