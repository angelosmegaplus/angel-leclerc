import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const schema = z.object({
  captchaToken: z.string().trim().min(1).max(300),
  captchaAnswer: z.string().trim().min(1).max(10),
  confirmed: z.literal(true),
  // Honeypot : doit rester vide.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const revealDirectContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    if (data.website && data.website.length > 0) {
      throw new Error("Vérification impossible pour le moment.");
    }

    const { allowReveal, getDirectContact } = await import("./private-contact.server");
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    if (!allowReveal(ip)) {
      console.warn("[reveal] rate limited");
      throw new Error(
        "Trop de demandes. Merci de réessayer plus tard ou d'utiliser la page Contact.",
      );
    }

    const { verifyChallenge } = await import("./captcha.server");
    const ok = await verifyChallenge(data.captchaToken, data.captchaAnswer);
    if (!ok) {
      console.warn("[reveal] captcha refused");
      throw new Error("Vérification anti-robot incorrecte ou expirée.");
    }

    return getDirectContact();
  });
