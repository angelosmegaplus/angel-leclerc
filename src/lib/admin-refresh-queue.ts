import { supabase } from "@/integrations/supabase/client";

const recentRequests = new Map<string, number>();
const DEDUPE_MS = 5_000;

export async function queueAdminRefresh(section: string, details?: Record<string, unknown>) {
  const normalizedSection = section.trim() || "Espace administrateur";
  const now = Date.now();
  const dedupeKey = normalizedSection.toLocaleLowerCase("fr-FR");
  const previous = recentRequests.get(dedupeKey) ?? 0;
  if (now - previous < DEDUPE_MS) return;
  recentRequests.set(dedupeKey, now);

  const requestedAt = new Date(now).toISOString();
  const title = `Actualiser et contrôler : ${normalizedSection}`;

  const { error } = await supabase.from("ai_actions").insert({
    kind: "refresh_check",
    title,
    description:
      "Demande créée depuis un bouton Actualiser de l’espace administrateur. ChatGPT doit lire cette demande, contrôler les données réelles de la section à partir des meilleures sources récentes disponibles et des informations déjà accessibles dans ChatGPT, confronter les sources, signaler clairement toute incohérence, donnée périmée ou information incertaine, puis mettre à jour automatiquement ce qui peut l’être sans action sensible. Toute donnée susceptible d’avoir changé doit être vérifiée avant mise à jour et aucune information ne doit être inventée pour combler un manque.",
    payload: {
      section: normalizedSection,
      requested_at: requestedAt,
      source: "admin_refresh_button",
      execution: "chatgpt_operator",
      verification: {
        prefer_recent_sources: true,
        cross_check_sources: true,
        use_chatgpt_context: true,
        flag_inconsistencies: true,
        flag_uncertainty: true,
        auto_update_non_sensitive_only: true,
        never_invent_missing_data: true,
      },
      ...details,
    },
    status: "pending",
    target_type: "chatgpt",
    sensitive: false,
  });

  if (error) {
    recentRequests.delete(dedupeKey);
    throw error;
  }

  try {
    await supabase.from("activity_log").insert({
      source: "user",
      action: "request_refresh_check",
      entity_type: "chatgpt",
      details: { section: normalizedSection, requested_at: requestedAt, ...details },
    });
  } catch {
    // Le journal est secondaire : la demande principale est déjà enregistrée.
  }
}
