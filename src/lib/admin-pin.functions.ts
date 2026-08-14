import { createServerFn } from "@tanstack/react-start";

export const verifyAdminPinCode = createServerFn({ method: "POST" })
  .inputValidator((input: { pin: string }) => ({
    pin: String(input?.pin ?? "").slice(0, 8),
  }))
  .handler(async ({ data }) => {
    const { verifyAdminPin } = await import("./admin-pin.server");
    const ok = await verifyAdminPin(data.pin);
    if (!ok) throw new Error("Code PIN incorrect.");
    return { ok: true as const };
  });
