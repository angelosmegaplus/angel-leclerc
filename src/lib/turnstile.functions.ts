import { createServerFn } from "@tanstack/react-start";

/** Vérification serveur du jeton Cloudflare Turnstile. */
export const verifyTurnstileToken = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: String(input?.token ?? "").slice(0, 4000) }))
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    // Sans clé configurée, on ne bloque personne.
    if (!secret) return { ok: true as const, configured: false };
    if (!data.token) return { ok: false as const, configured: true };

    const body = new URLSearchParams({ secret, response: data.token });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    return { ok: Boolean(result?.success), configured: true };
  });
