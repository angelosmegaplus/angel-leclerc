/**
 * Envoi d'e-mails transactionnels via le connecteur Resend (passerelle Lovable).
 * Utilisé comme expéditeur de secours quand aucune boîte Gmail/Outlook n'est
 * disponible, et pour les envois depuis le domaine vérifié d'Angel.
 */

import { gatewayConfigured, gatewayRequest } from "./lovable-gateway.server";

export function resendAvailable(): boolean {
  return gatewayConfigured("resend");
}

export type ResendDomain = { name: string; status: string };

export async function listResendDomains(): Promise<ResendDomain[]> {
  const result = await gatewayRequest("resend", "/domains");
  const list = (result?.data ?? []) as Array<{ name?: string; status?: string }>;
  return list
    .filter((entry) => Boolean(entry.name))
    .map((entry) => ({ name: entry.name as string, status: entry.status ?? "unknown" }));
}

/** Adresse d'expédition réelle : uniquement un domaine vérifié. */
export async function resendSenderAddress(): Promise<string | null> {
  const domains = await listResendDomains().catch(() => []);
  const verified = domains.find((domain) => domain.status === "verified");
  return verified ? `Angel Leclerc <contact@${verified.name}>` : null;
}

export async function sendViaResend(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ id: string; from: string }> {
  const from = await resendSenderAddress();
  if (!from) {
    throw new Error(
      "Aucun domaine vérifié pour l’envoi d’e-mails. Vérifie le domaine d’envoi avant d’utiliser ce mode.",
    );
  }
  const result = await gatewayRequest("resend", "/emails", {
    method: "POST",
    body: {
      from,
      to: [input.to],
      subject: input.subject || "(sans objet)",
      text: input.body,
    },
  });
  return { id: String(result?.id ?? ""), from };
}
