import type { FeedbackContentType, PublicFeedbackSettings } from "./feedback";
import { DEFAULT_QUESTIONS } from "./feedback";

export type SettingsRow = {
  enabled: boolean;
  support_enabled: boolean;
  comment_enabled: boolean;
  public_display: string;
  min_rating_for_support: number;
  amounts_cents: unknown;
  min_amount_cents: number;
  revolut_links: unknown;
  questions: unknown;
  confirmation_texts: unknown;
  disabled_paths: unknown;
};

export function amountsOf(row: SettingsRow): number[] {
  const raw = Array.isArray(row.amounts_cents) ? row.amounts_cents : [];
  const list = raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 100 && v <= 500000);
  return list.length ? list : [200, 500, 1000, 2000];
}

export function linksOf(row: SettingsRow): Record<string, string> {
  const raw = row.revolut_links;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && /^https:\/\//i.test(v.trim())) out[k] = v.trim();
  }
  return out;
}

export function disabledPathsOf(row: SettingsRow): string[] {
  const raw = Array.isArray(row.disabled_paths) ? row.disabled_paths : [];
  return raw.filter((v): v is string => typeof v === "string");
}

export function toPublicSettings(row: SettingsRow): PublicFeedbackSettings {
  const questions = (
    row.questions && typeof row.questions === "object" && !Array.isArray(row.questions)
      ? row.questions
      : {}
  ) as Partial<Record<FeedbackContentType, string>>;
  const texts = (
    row.confirmation_texts &&
    typeof row.confirmation_texts === "object" &&
    !Array.isArray(row.confirmation_texts)
      ? row.confirmation_texts
      : {}
  ) as PublicFeedbackSettings["confirmationTexts"];
  const links = linksOf(row);
  const display = ["none", "average", "average_count"].includes(row.public_display)
    ? (row.public_display as PublicFeedbackSettings["publicDisplay"])
    : "average_count";

  return {
    enabled: row.enabled,
    supportEnabled: row.support_enabled && Object.keys(links).length > 0,
    commentEnabled: row.comment_enabled,
    publicDisplay: display,
    minRatingForSupport: row.min_rating_for_support,
    amountsCents: amountsOf(row),
    minAmountCents: Math.max(100, row.min_amount_cents || 100),
    questions: { ...DEFAULT_QUESTIONS, ...questions },
    confirmationTexts: texts ?? {},
    hasCustomLink: Boolean(links["custom"]),
  };
}

/** Supprime balises, scripts et caractères de contrôle d'un commentaire visiteur. */
export function sanitizeComment(input: string): string {
  return (
    input
      .replace(/<[^>]*>/g, " ")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
      .slice(0, 1000)
  );
}

/** Empreinte anonyme et non réversible du visiteur (IP + navigateur). */
export async function visitorHash(ip: string, userAgent: string): Promise<string> {
  const salt = process.env["CAPTCHA_SECRET"] ?? "alc-feedback";
  const bytes = new TextEncoder().encode(`${salt}|${ip}|${userAgent}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}
