import { createServerFn } from "@tanstack/react-start";

/** Vérification serveur du jeton Cloudflare Turnstile. */
export const verifyTurnstileToken = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: String(input?.token ?? "").slice(0, 4000) }))
  .handler(async ({ data }) => {
    const secrets = [process.env["TURNSTILE_SECRET_KEY"], process.env["CAPTCHA_SECRET"]].filter(
      (secret, index, values): secret is string => Boolean(secret) && values.indexOf(secret) === index,
    );

    // Sans clé configurée, on ne bloque personne.
    if (secrets.length === 0) return { ok: true as const, configured: false };
    if (!data.token) return { ok: false as const, configured: true };

    for (const secret of secrets) {
      try {
        const body = new URLSearchParams({ secret, response: data.token });
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; "error-codes"?: string[] }
          | null;

        if (result?.success) return { ok: true as const, configured: true };
        console.warn("Turnstile verification refused", result?.["error-codes"] ?? ["invalid-response"]);
      } catch (error) {
        console.error("Turnstile verification unavailable", error);
      }
    }

    return { ok: false as const, configured: true };
  });
