import * as React from "react";
import { createAuthEmailHandler } from "@lovable.dev/email-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignupEmail } from "@/lib/email-templates/signup";
import { InviteEmail } from "@/lib/email-templates/invite";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";
import { RecoveryEmail } from "@/lib/email-templates/recovery";
import { EmailChangeEmail } from "@/lib/email-templates/email-change";
import { ReauthenticationEmail } from "@/lib/email-templates/reauthentication";

const SITE_NAME = "Angel Leclerc Communication";
const SENDER_DOMAIN = "notify.angel-leclerc.fr";
const ROOT_DOMAIN = "angel-leclerc.fr";
const FROM_DOMAIN = "angel-leclerc.fr";
const SITE_URL = `https://${ROOT_DOMAIN}`;

/**
 * Lovable email delivery is now an optional compatibility layer.
 * Do not instantiate it at module load: Vercel must be able to boot Angel OS
 * even when LOVABLE_API_KEY is intentionally absent.
 */
function getHandler() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;

  return createAuthEmailHandler({
    apiKey,
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    senderDomain: SENDER_DOMAIN,
    sendUrl: process.env["LOVABLE_SEND_URL"],
    emails: {
      signup: {
        subject: "Confirmez votre adresse e-mail",
        render: (data) =>
          React.createElement(SignupEmail, {
            siteName: SITE_NAME,
            siteUrl: SITE_URL,
            recipient: data.email,
            confirmationUrl: data.url,
          }),
      },
      invite: {
        subject: "Vous avez été invité",
        render: (data) =>
          React.createElement(InviteEmail, {
            siteName: SITE_NAME,
            siteUrl: SITE_URL,
            confirmationUrl: data.url,
          }),
      },
      magiclink: {
        subject: "Votre lien de connexion",
        render: (data) =>
          React.createElement(MagicLinkEmail, {
            siteName: SITE_NAME,
            confirmationUrl: data.url,
          }),
      },
      recovery: {
        subject: "Réinitialisez votre mot de passe",
        render: (data) =>
          React.createElement(RecoveryEmail, {
            siteName: SITE_NAME,
            confirmationUrl: data.url,
          }),
      },
      email_change: {
        subject: "Confirmez votre nouvelle adresse e-mail",
        render: (data) =>
          React.createElement(EmailChangeEmail, {
            siteName: SITE_NAME,
            oldEmail: data.old_email ?? "",
            email: data.email,
            newEmail: data.new_email ?? "",
            confirmationUrl: data.url,
          }),
      },
      reauthentication: {
        subject: "Votre code de vérification",
        render: (data) => React.createElement(ReauthenticationEmail, { token: data.token ?? "" }),
      },
    },
  });
}

export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const handler = getHandler();
        if (!handler) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Email provider not configured",
              provider: "lovable-compat",
            }),
            {
              status: 503,
              headers: { "content-type": "application/json; charset=utf-8" },
            },
          );
        }
        return handler(request);
      },
    },
  },
});
