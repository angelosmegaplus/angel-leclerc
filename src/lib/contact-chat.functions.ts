import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { emitAngelOSEvent } from "./angel-os-runtime";

const TRACK_LABELS = {
  projet: "Projet de communication",
  alternance: "Proposition d'alternance (BTS Communication)",
  autre: "Autre demande",
} as const;

export const conversationalContactSchema = z.object({
  track: z.enum(["projet", "alternance", "autre"]),
  answers: z.array(z.object({ question: z.string().trim().min(1).max(200), answer: z.string().trim().min(1).max(3000) })).min(1).max(20),
  name: z.string().trim().min(1, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preference: z.string().trim().max(60).optional().or(z.literal("")),
  structure: z.string().trim().max(200).optional().or(z.literal("")),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  transcript: z.string().trim().max(6000).optional().or(z.literal("")),
  nextSteps: z.string().trim().max(600).optional().or(z.literal("")),
  consent: z.literal(true, { error: "Consentement requis" }),
  captchaToken: z.string().trim().min(1, "Vérification requise").max(300),
  captchaAnswer: z.string().trim().min(1, "Vérification requise").max(10),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ConversationalContactInput = z.infer<typeof conversationalContactSchema>;

function buildDescription(data: ConversationalContactInput): string {
  return [...data.answers.map((a) => `${a.question}\n→ ${a.answer}`), data.preference ? `Préférence de contact\n→ ${data.preference}` : null, data.nextSteps ? `Prochaines étapes possibles\n→ ${data.nextSteps}` : null, data.transcript ? `— — —\nTranscription condensée de la conversation\n\n${data.transcript}` : null].filter(Boolean).join("\n\n");
}

async function sendIndependentFallback(data: ConversationalContactInput, projectType: string, description: string): Promise<void> {
  const response = await fetch("https://formsubmit.co/ajax/contact@angel-leclerc.fr", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ _subject: `[Site] ${projectType} — ${data.name}`, _template: "table", nom: data.name, email: data.email, telephone: data.phone || "Non renseigné", structure: data.structure || "Non renseignée", type_de_demande: projectType, budget: data.budget || "Non renseigné", echeance: data.deadline || "Non renseignée", preference_de_contact: data.preference || "Non renseignée", message: description, source: "angel-leclerc.fr — formulaire conversationnel" }),
  });
  if (!response.ok) throw new Error("La demande n'a pas pu être transmise. Merci de réessayer dans quelques instants.");
  const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (result && result.success === false) throw new Error("La demande n'a pas pu être transmise. Merci de réessayer dans quelques instants.");
}

async function emitContactEvent(data: ConversationalContactInput, requestId: string | null, channel: string) {
  await emitAngelOSEvent("angel-os:contact:submitted", {
    requestId,
    track: data.track,
    structure: data.structure || null,
    channel,
    submittedAt: new Date().toISOString(),
  });
}

export async function processConversationalContact(data: ConversationalContactInput) {
  if (data.website && data.website.length > 0) return { ok: true as const };
  const { verifyChallenge } = await import("./captcha.server");
  if (!(await verifyChallenge(data.captchaToken, data.captchaAnswer))) throw new Error("Vérification anti-robot incorrecte ou expirée.");

  const ip = getRequestIP({ xForwardedFor: true }) ?? null;
  const userAgent = getRequestHeader("user-agent") ?? null;
  const projectType = TRACK_LABELS[data.track];
  const description = buildDescription(data);
  const hasSupabaseAdmin = Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
  const hasLovableEmail = Boolean(process.env["LOVABLE_API_KEY"]);

  if (hasSupabaseAdmin) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin.from("contact_requests").select("*", { count: "exact", head: true }).eq("ip_address", ip).gte("created_at", since);
      if ((count ?? 0) >= 5) throw new Error("Trop de demandes envoyées récemment depuis votre connexion. Merci de réessayer plus tard.");
    }
    const { data: inserted, error: insertError } = await supabaseAdmin.from("contact_requests").insert({ full_name: data.name, email: data.email, phone: data.phone || null, structure: data.structure || null, project_type: projectType, budget: data.budget || null, deadline: data.deadline || null, description, ip_address: ip, user_agent: userAgent }).select("id, created_at").single();
    if (insertError) throw new Error("La demande n'a pas pu être enregistrée.");

    if (hasLovableEmail) {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      const sentAt = new Date(inserted!.created_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
      await sendTemplateEmail("contact-notification", "contact@angel-leclerc.fr", { templateData: { fullName: data.name, email: data.email, phone: data.phone || undefined, structure: data.structure || undefined, projectType, budget: data.budget || undefined, deadline: data.deadline || undefined, description, sentAt }, idempotencyKey: `contact-chat-${inserted!.id}`, replyTo: data.email });
      await sendTemplateEmail("contact-confirmation", data.email, { templateData: { firstName: data.name.split(" ")[0], subject: projectType }, idempotencyKey: `contact-chat-confirm-${inserted!.id}` });
      await emitContactEvent(data, inserted!.id, "supabase+email");
      return { ok: true as const };
    }
    await sendIndependentFallback(data, projectType, description);
    await emitContactEvent(data, inserted!.id, "supabase+fallback");
    return { ok: true as const };
  }

  await sendIndependentFallback(data, projectType, description);
  await emitContactEvent(data, null, "independent-fallback");
  return { ok: true as const };
}

export const submitConversationalContact = createServerFn({ method: "POST" }).validator((data: unknown) => conversationalContactSchema.parse(data)).handler(async ({ data }) => processConversationalContact(data));
