import { supabase } from "@/integrations/supabase/client";

export async function queueAdminRefresh(section: string, details?: Record<string, unknown>) {
  const requestedAt = new Date().toISOString();
  const title = `Actualiser et contrôler : ${section}`;

  const { error } = await supabase.from("ai_actions").insert({
    kind: "refresh_check",
    title,
    description:
      "Demande créée depuis un bouton Actualiser de l’espace administrateur. Contrôler les données réelles de la section, signaler les incohérences et mettre à jour ce qui peut l’être sans action sensible.",
    payload: {
      section,
      requested_at: requestedAt,
      source: "admin_refresh_button",
      ...details,
    },
    status: "pending",
    target_type: "system",
    sensitive: false,
  });

  if (error) throw error;

  try {
    await supabase.from("activity_log").insert({
      source: "user",
      action: "request_refresh_check",
      entity_type: "system",
      details: { section, requested_at: requestedAt, ...details },
    });
  } catch {
    // Le journal est secondaire : la demande principale est déjà enregistrée.
  }
}
