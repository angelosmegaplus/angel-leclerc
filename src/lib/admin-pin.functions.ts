import { createServerFn } from "@tanstack/react-start";

const ADMIN_PIN = "2005";

export const verifyAdminPinCode = createServerFn({ method: "POST" })
  .validator((input: { pin: string }) => ({
    pin: String(input?.pin ?? "").trim().slice(0, 8),
  }))
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN) throw new Error("Code PIN incorrect.");
    return { ok: true as const };
  });
