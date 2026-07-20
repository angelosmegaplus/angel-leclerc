// Server-only helper for sending emails via Resend through the Lovable connector gateway.
// Requires the Resend connector to be linked to this project (RESEND_API_KEY env var).

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

type EmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "provider_error"; status?: number; body?: string }
> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn(
      "[email] Resend connector not configured — skipping email send.",
      { hasLovableKey: !!LOVABLE_API_KEY, hasResendKey: !!RESEND_API_KEY },
    );
    return { ok: false, reason: "not_configured" };
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[email] Resend gateway failed [${response.status}]: ${body}`);
    return { ok: false, reason: "provider_error", status: response.status, body };
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
