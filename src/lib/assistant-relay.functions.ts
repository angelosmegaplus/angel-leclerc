import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { sendTemplateEmail } from "./email-templates/send-email";

const relaySchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message trop court").max(3000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentement requis" }),
  }),
  // Honeypot anti-spam : doit rester vide.
  website: z.string().max(0).optional().or(z.literal("")),
  // Derniers échanges publics du chat, uniquement pour donner du contexte.
  transcript: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(600),
      }),
    )
    .max(8)
    .optional(),
});

export type AssistantRelayInput = z.infer<typeof relaySchema>;

export const sendAssistantRelay = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => relaySchema.parse(data))
  .handler(async ({ data }) => {
    // Bot ayant rempli le honeypot : succès silencieux, rien n'est envoyé.
    if (data.website && data.website.length > 0) {
      return { ok: true as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;

    // Limite simple : 5 messages par heure et par connexion.
    if (ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("contact_requests")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= 5) {
        throw new Error(
          "Trop de messages envoyés récemment. Merci de réessayer plus tard ou d'écrire à contact@angel-leclerc.fr.",
        );
      }
    }

    const transcript = (data.transcript ?? [])
      .map((m) => `${m.role === "user" ? "Visiteur" : "Assistant"} : ${m.content}`)
      .join("\n");

    const description = transcript
      ? `${data.message}\n\n— Contexte de la conversation —\n${transcript}`
      : data.message;

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("contact_requests")
      .insert({
        full_name: data.name,
        email: data.email,
        phone: data.phone || null,
        project_type: "Assistant ALC",
        description,
        ip_address: ip,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[assistant-relay] insert failed", insertError);
      throw new Error("Le message n'a pas pu être enregistré.");
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
          projectType: "Assistant ALC",
          description,
          sentAt,
        },
        idempotencyKey: `assistant-relay-${inserted!.id}`,
        replyTo: data.email,
      },
    );
    if (!notification.sent) {
      console.warn("[assistant-relay] notification suppressed");
    }

    return { ok: true as const };
  });
