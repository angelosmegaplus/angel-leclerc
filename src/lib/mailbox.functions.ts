import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resilientAngelAi } from "@/lib/ai-resilient.server";
import { aiMemoryPrompt } from "@/lib/ai-memory.server";
import type {
  MailAction,
  MailDetail,
  MailFolder,
  MailSummary,
  MailboxStatus,
} from "./mailbox.server";

export type { MailAction, MailFolder };

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Accès réservé à l'administrateur.");
}

function cleanMailBody(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export const mailboxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MailboxStatus> => {
    await assertAdmin(context);
    const { getStatus } = await import("./mailbox.server");
    return getStatus(context.userId);
  });

export const mailboxList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { folder: MailFolder; search: string }) => input)
  .handler(async ({ data, context }): Promise<MailSummary[]> => {
    await assertAdmin(context);
    const { listMail } = await import("./mailbox.server");
    return listMail(context.userId, data.folder, data.search ?? "");
  });

export const mailboxRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<MailDetail> => {
    await assertAdmin(context);
    const { readMail, actOnMail } = await import("./mailbox.server");
    const mail = await readMail(context.userId, data.id);
    if (mail.unread) await actOnMail(context.userId, data.id, "read").catch(() => undefined);
    return mail;
  });

export const mailboxDraftReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => {
    const id = input.id?.trim();
    if (!id) throw new Error("Message introuvable.");
    return { id };
  })
  .handler(async ({ data, context }): Promise<{ to: string; subject: string; body: string; threadId: string }> => {
    await assertAdmin(context);
    const { readMail } = await import("./mailbox.server");
    const mail = await readMail(context.userId, data.id);
    const memory = await aiMemoryPrompt("private");
    const recipient = (mail.from ?? "").replace(/.*<(.+)>.*/, "$1").trim();
    const bodyText = cleanMailBody(mail.body).slice(0, 9000);

    const ai = await resilientAngelAi({
      messages: [
        {
          role: "system",
          content: "Tu rédiges un brouillon d'email privé pour Angel Leclerc dans Angel OS. Base-toi uniquement sur le message réel et le contexte privé fourni. Réponds au besoin concret, reste naturel, professionnel et concis. N'invente jamais une pièce jointe, une disponibilité, un accord, une compétence ou un fait. Pour une candidature/alternance, tiens compte du contexte connu et privilégie une formulation humaine. Tu produis uniquement le corps du brouillon, sans objet, sans métadonnées et sans commentaire autour.",
        },
        {
          role: "user",
          content: `Message reçu\nDe: ${mail.from}\nÀ: ${mail.to}\nObjet: ${mail.subject}\nDate: ${mail.date}\nFil: ${mail.threadId}\nContenu: ${bodyText}${memory}`,
        },
      ],
      priority: "interactive",
      maxTokens: 700,
      temperature: 0.3,
      cacheTtlMs: 1,
    });

    const draft = ai.text?.trim();
    if (!draft) throw new Error("Angel OS IA n’a pas généré de brouillon exploitable.");
    return {
      to: recipient,
      subject: /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`,
      body: draft.slice(0, 12000),
      threadId: mail.threadId,
    };
  });

export const mailboxAct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string; action: MailAction }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { actOnMail } = await import("./mailbox.server");
    await actOnMail(context.userId, data.id, data.action);
    return { ok: true };
  });

export const mailboxSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (input: { to: string; subject: string; body: string; threadId?: string }) => {
      const to = input.to?.trim() ?? "";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error("Adresse invalide.");
      if (!input.body?.trim()) throw new Error("Message vide.");
      return {
        to,
        subject: (input.subject ?? "").trim().slice(0, 200),
        body: input.body.trim().slice(0, 20000),
        threadId: input.threadId,
      };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { sendMail } = await import("./mailbox.server");
    await sendMail(context.userId, data);
    return { ok: true };
  });
