import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

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

const PROJECT_TYPES = [
  "Gestion de projet",
  "Conseil en communication",
  "Rédaction ou contenu éditorial",
  "Affiche ou flyer",
  "Identité visuelle",
  "Recherche de prestataires",
  "Production audio, vidéo ou numérique",
  "Autre demande",
] as const;

const submissionSchema = z.object({
  fullName: z.string().trim().min(1, "Nom requis").max(120),
  email: z.string().trim().email("E-mail invalide").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  structure: z.string().trim().max(200).optional().or(z.literal("")),
  projectType: z.enum(PROJECT_TYPES),
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
    const { sendEmail, escapeHtml } = await import("./email.server");

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

    // Emails
    const now = new Date(inserted!.created_at).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    });

    const fromAddress =
      process.env.CONTACT_FROM_ADDRESS || "Angel Leclerc Communication <onboarding@resend.dev>";
    const notifyAddress = process.env.CONTACT_NOTIFY_ADDRESS || "contact@angel-leclerc.fr";

    const brandCream = "#F6F1E8";
    const brandWarmWhite = "#FFFDF9";
    const brandInk = "#181716";
    const brandTerracotta = "#CE654B";
    const fontHead =
      "'Manrope','Helvetica Neue','Segoe UI',Arial,sans-serif";
    const fontBody =
      "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
    const fontsLink = `<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700&display=swap" rel="stylesheet"/><!--<![endif]-->`;

    const rowsHtml = [
      ["Nom", data.fullName],
      ["E-mail", data.email],
      ["Téléphone", data.phone || "—"],
      ["Structure", data.structure || "—"],
      ["Type de projet", data.projectType],
      ["Budget approximatif", data.budget || "—"],
      ["Date ou délai souhaité", data.deadline || "—"],
      ["Envoyé le", now],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 16px 8px 0;color:#6b6b6b;font-family:${fontBody};font-size:14px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;color:${brandInk};font-weight:500;font-family:${fontBody};font-size:14px;">${escapeHtml(value)}</td></tr>`,
      )
      .join("");

    const attachmentBlock = signedUrl
      ? `<p style="margin:20px 0 0 0;font-family:${fontBody};font-size:14px;color:${brandInk};line-height:1.6;">Fichier joint&nbsp;: <strong>${escapeHtml(attachmentName ?? "fichier")}</strong><br/><a href="${signedUrl}" style="color:${brandTerracotta};text-decoration:underline;">Télécharger le fichier (lien valable 7 jours)</a></p>`
      : "";

    const wrap = (inner: string) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>${fontsLink}</head><body style="margin:0;padding:0;background:${brandCream};font-family:${fontBody};color:${brandInk};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brandCream};padding:32px 16px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${brandWarmWhite};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(24,23,22,0.06);"><tr><td style="padding:28px 32px 8px 32px;border-bottom:3px solid ${brandTerracotta};"><div style="font-family:${fontHead};font-size:18px;font-weight:700;color:${brandInk};letter-spacing:-0.01em;">Angel Leclerc Communication</div><div style="font-family:${fontBody};font-size:13px;color:#6b6b6b;margin-top:2px;">Donner du souffle à vos idées</div></td></tr><tr><td style="padding:28px 32px;font-family:${fontBody};font-size:15px;line-height:1.6;color:${brandInk};">${inner}</td></tr><tr><td style="padding:20px 32px;background:${brandCream};font-family:${fontBody};font-size:12px;color:#8a8a8a;text-align:center;">Angel Leclerc Communication · <a href="https://angel-leclerc.fr" style="color:${brandTerracotta};text-decoration:none;">angel-leclerc.fr</a></td></tr></table></td></tr></table></body></html>`;

    const notifyHtml = wrap(`
      <h2 style="margin:0 0 20px 0;font-family:${fontHead};font-weight:700;font-size:22px;color:${brandInk};letter-spacing:-0.01em;">Nouvelle demande de projet</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">${rowsHtml}</table>
      <h3 style="margin:24px 0 8px 0;font-family:${fontHead};font-weight:600;font-size:16px;color:${brandInk};">Description</h3>
      <p style="white-space:pre-wrap;line-height:1.6;margin:0;font-family:${fontBody};font-size:14px;color:${brandInk};">${escapeHtml(data.description)}</p>
      ${attachmentBlock}
    `);

    await sendEmail({
      from: fromAddress,
      to: notifyAddress,
      reply_to: data.email,
      subject: `Nouvelle demande de projet – ${data.fullName} – ${data.projectType}`,
      html: notifyHtml,
    });

    const confirmationHtml = wrap(`
      <h2 style="margin:0 0 16px 0;font-family:${fontHead};font-weight:700;font-size:22px;color:${brandInk};letter-spacing:-0.01em;">Votre demande a bien été reçue</h2>
      <p style="margin:0 0 12px 0;">Bonjour ${escapeHtml(data.fullName.split(" ")[0] || "")},</p>
      <p style="margin:0 0 12px 0;">Votre demande a bien été transmise à <strong>Angel Leclerc Communication</strong>.</p>
      <p style="margin:0 0 20px 0;">Je reviendrai vers vous dès que possible afin d'échanger sur votre projet.</p>
      <p style="margin:0;">Cordialement,<br/><span style="color:${brandTerracotta};font-weight:600;">Angel Leclerc</span></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:12px;color:#8a8a8a;margin:0;">Cet e-mail confirme la bonne réception de votre demande. Il ne contient pas d'information confidentielle.</p>
    `);

    await sendEmail({
      from: fromAddress,
      to: data.email,
      subject: "Votre demande a bien été reçue",
      html: confirmationHtml,
    });

    return { ok: true as const };
  });
