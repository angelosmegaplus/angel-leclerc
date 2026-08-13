import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export const mailboxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MailboxStatus> => {
    await assertAdmin(context);
    const { getStatus } = await import("./mailbox.server");
    return getStatus(context.userId);
  });

export const mailboxList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { folder: MailFolder; search: string }) => input)
  .handler(async ({ data, context }): Promise<MailSummary[]> => {
    await assertAdmin(context);
    const { listMail } = await import("./mailbox.server");
    return listMail(context.userId, data.folder, data.search ?? "");
  });

export const mailboxRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<MailDetail> => {
    await assertAdmin(context);
    const { readMail, actOnMail } = await import("./mailbox.server");
    const mail = await readMail(context.userId, data.id);
    if (mail.unread) await actOnMail(context.userId, data.id, "read").catch(() => undefined);
    return mail;
  });

export const mailboxAct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; action: MailAction }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { actOnMail } = await import("./mailbox.server");
    await actOnMail(context.userId, data.id, data.action);
    return { ok: true };
  });

export const mailboxSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string; subject: string; body: string; threadId?: string }) => {
    const to = input.to?.trim() ?? "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new Error("Adresse invalide.");
    if (!input.body?.trim()) throw new Error("Message vide.");
    return {
      to,
      subject: (input.subject ?? "").trim().slice(0, 200),
      body: input.body.trim().slice(0, 20000),
      threadId: input.threadId,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { sendMail } = await import("./mailbox.server");
    await sendMail(context.userId, data);
    return { ok: true };
  });
