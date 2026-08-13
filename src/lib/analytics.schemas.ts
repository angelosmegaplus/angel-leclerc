import { z } from "zod";

export const SELECT_COLUMNS =
  "path, referrer, device, country, session_id, created_at, visitor_id, event_type, event_name, title, referrer_host, source, utm_source, utm_medium, utm_campaign, browser, os, language, screen_width, screen_height, city, metadata, user_id";

export const filtersSchema = z
  .object({
    path: z.string().max(300).optional(),
    source: z.string().max(120).optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    device: z.string().max(40).optional(),
    browser: z.string().max(40).optional(),
    os: z.string().max(40).optional(),
    language: z.string().max(20).optional(),
    country: z.string().max(60).optional(),
    city: z.string().max(80).optional(),
    eventType: z.string().max(30).optional(),
  })
  .optional();

export const statsInputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  filters: filtersSchema,
});

export const trackSchema = z.object({
  eventType: z.enum(["pageview", "click", "scroll", "engagement"]).default("pageview"),
  eventName: z.string().trim().max(60).optional(),
  path: z.string().trim().min(1).max(300),
  title: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  device: z.enum(["mobile", "tablette", "ordinateur"]).optional(),
  visitorId: z.string().trim().max(64).optional().or(z.literal("")),
  sessionId: z.string().trim().max(64).optional().or(z.literal("")),
  language: z.string().trim().max(20).optional(),
  screenWidth: z.number().int().min(0).max(20000).optional(),
  screenHeight: z.number().int().min(0).max(20000).optional(),
  viewportWidth: z.number().int().min(0).max(20000).optional(),
  viewportHeight: z.number().int().min(0).max(20000).optional(),
  source: z.string().trim().max(120).optional(),
  referrerHost: z.string().trim().max(160).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmTerm: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
