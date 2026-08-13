import { createServerFn } from "@tanstack/react-start";

/** Vérification serveur Google reCAPTCHA. */
export const verifyCaptchaAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; answer?: string }) => ({
    token: String(input?.token ?? "").slice(0, 4096),
  }))
  .handler(async ({ data }) => {
    const { verifyRecaptchaToken } = await import("./captcha.server");
    const ok = await verifyRecaptchaToken(data.token);
    if (!ok) throw new Error("Vérification anti-robot échouée ou expirée. Merci de réessayer.");
    return { ok: true as const };
  });
