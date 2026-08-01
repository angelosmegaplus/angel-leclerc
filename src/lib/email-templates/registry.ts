import type { ComponentType } from 'react'

import { ContactConfirmationEmail } from './contact-confirmation'
import { ContactNotificationEmail } from './contact-notification'
import { BlogNewArticleEmail } from './blog-new-article'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': {
    component: ContactConfirmationEmail,
    subject: 'Votre demande a bien été reçue',
    displayName: 'Confirmation de demande de contact',
    previewData: { firstName: 'Marie' },
  },
  'contact-notification': {
    component: ContactNotificationEmail,
    subject: (data) => `Nouvelle demande de projet – ${data.fullName} – ${data.projectType}`,
    displayName: 'Notification de nouvelle demande',
    to: 'contact@angel-leclerc.fr',
    previewData: {
      fullName: 'Marie Dupont',
      email: 'marie@example.com',
      phone: '06 01 02 03 04',
      structure: 'Association Exemple',
      projectType: 'Conseil',
      budget: '1 000 – 2 000 €',
      deadline: 'Septembre 2026',
      description: 'Je souhaite obtenir un conseil sur la communication de mon association.',
      sentAt: '1 août 2026 à 16:17',
      attachmentName: 'cahier-des-charges.pdf',
      signedUrl: 'https://example.com/signed-url',
    },
  },
  'blog-new-article': {
    component: BlogNewArticleEmail,
    subject: (data) => `Nouvel article : ${data.title}`,
    displayName: 'Notification de nouvel article',
    previewData: {
      title: 'Titre de l’article',
      excerpt: 'Un court extrait de l’article pour donner envie de cliquer.',
      url: 'https://angel-leclerc.fr/articles/titre-de-l-article',
      unsubscribeUrl: 'https://angel-leclerc.fr/desabonnement?token=00000000-0000-0000-0000-000000000000',
    },
  },
}
