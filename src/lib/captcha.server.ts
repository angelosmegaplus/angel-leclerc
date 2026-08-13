/** Validation Google reCAPTCHA côté serveur. */

type RecaptchaResponse = {
  success?: boolean;
  hostname?: string;
};

function recaptchaSecret(): string {
  const value = process.env["RECAPTCHA_SECRET_KEY"];
  if (!value) throw new Error("Vérification anti-robot indisponible.");
  return value;
}

export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const responseToken = token.trim();
  if (!responseToken) return false;

  const body = new URLSearchParams();
  body.set("secret", recaptchaSecret());
  body.set("response", responseToken);

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;
  const result = (await response.json()) as RecaptchaResponse;
  return result.success === true;
}
