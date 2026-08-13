import { createServerFn } from "@tanstack/react-start";

export const getCaptchaChallenge = createServerFn({ method: "GET" }).handler(async () => {
  const { createChallenge } = await import("./captcha.server");
  return createChallenge();
});

/** Vérification serveur du calcul anti-robot local. */
export const verifyCaptchaAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; answer: string }) => ({
    token: String(input?.token ?? "").slice(0, 300),
    answer: String(input?.answer ?? "").slice(0, 20),
  }))
  .handler(async ({ data }) => {
    const { verifyChallenge } = await import("./captcha.server");
    const ok = await verifyChallenge(data.token, data.answer);
    if (!ok) throw new Error("Vérification anti-robot incorrecte ou expirée.");
    return { ok: true as const };
  });
