/** Types et libellés partagés du système « Avis et soutiens ». */

export type FeedbackContentType = "article" | "service" | "parcours" | "page";

export const RATING_LABELS: Record<number, string> = {
  1: "Très décevant",
  2: "À améliorer",
  3: "Correct",
  4: "Très bien",
  5: "Excellent",
};

export const DEFAULT_QUESTIONS: Record<FeedbackContentType, string> = {
  article: "Qu'avez-vous pensé de cet article ?",
  service: "Qu'avez-vous pensé de ce service ?",
  parcours: "Que pensez-vous de mon parcours ?",
  page: "Qu'avez-vous pensé de cette page ?",
};

export const CONTENT_TYPE_LABELS: Record<FeedbackContentType, string> = {
  article: "Article",
  service: "Service",
  parcours: "Parcours / CV",
  page: "Page",
};

export type PublicDisplay = "none" | "average" | "average_count";

export type PublicFeedbackSettings = {
  enabled: boolean;
  supportEnabled: boolean;
  commentEnabled: boolean;
  publicDisplay: PublicDisplay;
  minRatingForSupport: number;
  amountsCents: number[];
  minAmountCents: number;
  questions: Partial<Record<FeedbackContentType, string>>;
  confirmationTexts: {
    thanksTitle?: string;
    thanksBody?: string;
    supportTitle?: string;
    supportBody?: string;
  };
  hasCustomLink: boolean;
};

export type FeedbackContext = {
  settings: PublicFeedbackSettings;
  average: number | null;
  count: number;
  visible: boolean;
};

export function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export function thanksMessage(rating: number): string {
  if (rating >= 4) return "Merci, votre retour me fait vraiment plaisir.";
  if (rating === 3) return "Merci pour votre retour. Qu'est-ce qui pourrait être amélioré ?";
  return "Merci pour votre franchise. Votre avis peut m'aider à progresser.";
}