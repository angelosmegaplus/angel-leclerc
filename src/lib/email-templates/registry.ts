import type { ComponentType } from "react";

import { ContactConfirmationEmail } from "./contact-confirmation";
import { ContactNotificationEmail } from "./contact-notification";
import { template as orderConfirmationTemplate } from "./order-confirmation";
import { template as orderShippedTemplate } from "./order-shipped";
import { SubscribeWelcomeEmail } from "./subscribe-welcome";
import { WeeklyNewsletterEmail } from "./weekly-newsletter";

export interface TemplateEntry {
  component: ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  "order-confirmation": orderConfirmationTemplate,
  "order-shipped": orderShippedTemplate,
  "contact-confirmation": {
    component: ContactConfirmationEmail,
    subject: "Votre message a bien été reçu",
    displayName: "Confirmation de demande de contact",
    previewData: { firstName: "Marie", subject: "Conseil en communication" },
  },
  "contact-notification": {
    component: ContactNotificationEmail,
    subject: (data) =>
      data.projectType === "Assistant ALC"
        ? `Nouveau message depuis l'Assistant ALC – ${data.fullName}`
        : `Nouveau message – ${data.fullName} – ${data.projectType}`,
    displayName: "Notification administrateur",
    to: "contact@angel-leclerc.fr",
    previewData: {
      fullName: "Marie Dupont",
      email: "marie@example.com",
      phone: "06 01 02 03 04",
      structure: "Association Exemple",
      projectType: "Conseil",
      budget: "1 000 – 2 000 €",
      deadline: "Septembre 2026",
      description: "Je souhaite obtenir un conseil sur la communication de mon association.",
      sentAt: "1 août 2026 à 16:17",
      attachmentName: "cahier-des-charges.pdf",
      signedUrl: "https://example.com/signed-url",
    },
  },
  "subscribe-welcome": {
    component: SubscribeWelcomeEmail,
    subject: "Confirmez votre inscription aux articles",
    displayName: "Bienvenue / confirmation d’inscription",
    previewData: {
      firstName: "Marie",
      confirmUrl:
        "https://www.angel-leclerc.fr/confirmation-abonnement?token=00000000-0000-0000-0000-000000000000",
      unsubscribeUrl:
        "https://www.angel-leclerc.fr/desabonnement?token=00000000-0000-0000-0000-000000000000",
    },
  },
  "weekly-newsletter": {
    component: WeeklyNewsletterEmail,
    subject: (data) =>
      data.articles?.length === 1
        ? `Les articles de la semaine : ${data.articles[0].title}`
        : "Les articles de la semaine",
    displayName: "Newsletter hebdomadaire",
    previewData: {
      articles: [
        {
          title: "Titre de l’article",
          excerpt: "Un court extrait de l’article pour donner envie de cliquer.",
          url: "https://www.angel-leclerc.fr/articles/titre-de-l-article",
          date: "2 août 2026",
        },
      ],
      unsubscribeUrl:
        "https://www.angel-leclerc.fr/desabonnement?token=00000000-0000-0000-0000-000000000000",
    },
  },
};
