import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { sendTemplateEmail } from "./email-templates/send-email";

const TRACK_LABELS = {
  projet: "Projet de communication",
  alternance: "Proposition d'alternance (BTS Communication)",
  autre: "Autre question",
} as const;

const schema = z.object({
  track: z.enum(["projet", "alternance", "autre"]),
  answers: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(3000),
      }),
    )
    .min(1)
    .max(20),
  name: z.string().trim().min(1, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  preference: z.string().trim().max(60).optional().or(z.literal("")),
  structure: z.string().trim().max(200).optional().or(z.literal("")),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Consentement requis" }) }),
  // Honeypot : doit rester vide.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ConversationalContactInput = z.infer<typeof schema>;

export const submitConversationalContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    if (data.website && data.website.length > 0) return { ok: true as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    if (ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("contact_requests")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= 5) {
        throw new Error(
          "Trop de demandes envoyées récemment depuis votre connexion. Merci de réessayer plus tard ou d'écrire à contact@angel-leclerc.fr.",
        );
      }
    }

    const projectType = TRACK_LABELS[data.track];
    const description = [
      ...data.answers.map((a) => `${a.question}\n→ ${a.answer}`),
      data.preference ? `Préférence de contact\n→ ${data.preference}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("contact_requests")
      .insert({
        full_name: data.name,
        email: data.email,
        phone: data.phone || null,
        structure: data.structure || null,
        project_type: projectType,
        budget: data.budget || null,
        deadline: data.deadline || null,
        description,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[contact-chat] insert failed", insertError);
      throw new Error("La demande n'a pas pu être enregistrée.");
    }

    const sentAt = new Date(inserted!.created_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    });

    const notification = await sendTemplateEmail(
      "contact-notification",
      "contact@angel-leclerc.fr",
      {
        templateData: {
          fullName: data.name,
          email: data.email,
          phone: data.phone || undefined,
          structure: data.structure || undefined,
          projectType,
          budget: data.budget || undefined,
          deadline: data.deadline || undefined,
          description,
          sentAt,
        },
        idempotencyKey: `contact-chat-${inserted!.id}`,
        replyTo: data.email,
      },
    );
    if (!notification.sent) console.warn("[contact-chat] notification suppressed");

    const confirmation = await sendTemplateEmail("contact-confirmation", data.email, {
      templateData: {
        firstName: data.name.split(" ")[0],
        subject: projectType,
      },
      idempotencyKey: `contact-chat-confirm-${inserted!.id}`,
    });
    if (!confirmation.sent) console.warn("[contact-chat] confirmation suppressed");

    return { ok: true as const };
  });
