import { createServerFn } from "@tanstack/react-start";
import { requireAngelAuth } from "@/lib/auth/require-angel-auth";
import { assertAngelAdmin } from "@/lib/auth/require-admin";
import type {
  MailAction,
  MailDetail,
  MailFolder,
  MailSummary,
  MailboxStatus,
} from "./mailbox.server";

export type { MailAction, MailFolder };

export const mailboxStatus = createServerFn({ method: "GET" })
  .middleware([requireAngelAuth])
  .handler(async ({ context }): Promise<MailboxStatus> => {
    await assertAngelAdmin(context);
    const { getStatus } = await import("./mailbox.server");
    return getStatus(context.userId);
  });

export const mailboxList = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: { folder: MailFolder; search: string }) => input)
  .handler(async ({ data, context }): Promise<MailSummary[]> => {
    await assertAngelAdmin(context);
    const { listMail } = await import("./mailbox.server");
    return listMail(context.userId, data.folder, data.search ?? "");
  });

export const mailboxRead = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<MailDetail> => {
    await assertAngelAdmin(context);
    const { readMail, actOnMail } = await import("./mailbox.server");
    const mail = await readMail(context.userId, data.id);
    if (mail.unread) await actOnMail(context.userId, data.id, "read").catch(() => undefined);
    return mail;
  });

export const mailboxAct = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator((input: { id: string; action: MailAction }) => input)
  .handler(async ({ data, context }) => {
    await assertAngelAdmin(context);
    const { actOnMail } = await import("./mailbox.server");
    await actOnMail(context.userId, data.id, data.action);
    return { ok: true };
  });

export const mailboxSend = createServerFn({ method: "POST" })
  .middleware([requireAngelAuth])
  .inputValidator(
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
    await assertAngelAdmin(context);
    const { sendMail } = await import("./mailbox.server");
    await sendMail(context.userId, data);
    return { ok: true };
  });
