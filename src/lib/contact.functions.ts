import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { sendTemplateEmail } from "./email-templates/send-email";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const ACCEPTED_EXT = /\.(pdf|doc|docx|png|jpe?g|webp|pptx?)$/i;

const submissionSchema = z.object({
  fullName: z.string().trim().min(1, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  structure: z.string().trim().max(200).optional().or(z.literal("")),
  projectType: z.string().trim().min(1, "Type requis").max(160),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Description trop courte").max(5000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentement requis" }),
  }),
  // Honeypot: must be empty
  website: z.string().max(0).optional().or(z.literal("")),
  // Optional file (base64-encoded)
  file: z
    .object({
      name: z.string().min(1).max(200),
      type: z.string().min(1).max(120),
      size: z.number().int().nonnegative().max(MAX_FILE_SIZE),
      dataBase64: z.string().min(1),
    })
    .optional()
    .nullable(),
});

export type ContactSubmissionInput = z.infer<typeof submissionSchema>;

export const submitProjectRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submissionSchema.parse(data))
  .handler(async ({ data }) => {
    // Reject bots that filled the honeypot silently (act as success).
    if (data.website && data.website.length > 0) {
      return { ok: true as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    // Simple rate limit: max 5 submissions per hour per IP.
    if (ip) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("contact_requests")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= 5) {
        throw new Error(
          "Trop de demandes envoyées récemment depuis votre connexion. Merci de réessayer plus tard.",
        );
      }
    }

    // Upload attachment if provided.
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let signedUrl: string | null = null;

    if (data.file) {
      const file = data.file;
      if (!ACCEPTED_MIME.has(file.type) && !ACCEPTED_EXT.test(file.name)) {
        throw new Error("Format de fichier non accepté.");
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Le fichier dépasse 10 Mo.");
      }

      const bytes = Uint8Array.from(atob(file.dataBase64), (c) => c.charCodeAt(0));
      if (bytes.byteLength > MAX_FILE_SIZE) {
        throw new Error("Le fichier dépasse 10 Mo.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
      const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("contact-uploads")
        .upload(key, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) {
        console.error("[contact] upload failed", uploadError);
        throw new Error("Le fichier n'a pas pu être enregistré.");
      }

      attachmentPath = key;
      attachmentName = file.name;

      // 7 days signed URL (max recommended for internal review).
      const { data: signed } = await supabaseAdmin.storage
        .from("contact-uploads")
        .createSignedUrl(key, 60 * 60 * 24 * 7);
      signedUrl = signed?.signedUrl ?? null;
    }

    // Persist the request.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("contact_requests")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        structure: data.structure || null,
        project_type: data.projectType,
        budget: data.budget || null,
        deadline: data.deadline || null,
        description: data.description,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[contact] insert failed", insertError);
      throw new Error("La demande n'a pas pu être enregistrée.");
    }

    // Send transactional emails via Lovable's managed email API.
    const sentAt = new Date(inserted!.created_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    });

    const notificationResult = await sendTemplateEmail(
      'contact-notification',
      'contact@angel-leclerc.fr',
      {
        templateData: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          structure: data.structure || undefined,
          projectType: data.projectType,
          budget: data.budget || undefined,
          deadline: data.deadline || undefined,
          description: data.description,
          sentAt,
          attachmentName: attachmentName ?? undefined,
          signedUrl: signedUrl ?? undefined,
        },
        idempotencyKey: `contact-notification-${inserted!.id}`,
        replyTo: data.email,
      },
    );
    if (!notificationResult.sent) {
      console.warn('[contact] notification suppressed for recipient');
    }

    const confirmationResult = await sendTemplateEmail(
      'contact-confirmation',
      data.email,
      {
        templateData: {
          firstName: data.fullName.split(' ')[0],
        },
        idempotencyKey: `contact-confirmation-${inserted!.id}`,
      },
    );
    if (!confirmationResult.sent) {
      console.warn('[contact] confirmation suppressed for', data.email);
    }

    return { ok: true as const };
  });
