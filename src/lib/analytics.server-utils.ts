export type ViewRow = {
  path: string;
  referrer: string | null;
  device: string | null;
  country: string | null;
  session_id: string | null;
  created_at: string;
  visitor_id?: string | null;
  event_type?: string | null;
  event_name?: string | null;
  title?: string | null;
  referrer_host?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  browser?: string | null;
  os?: string | null;
  language?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  city?: string | null;
  metadata?: Record<string, unknown> | null;
  user_id?: string | null;
};

export type Bar = { label: string; value: number };

export type SiteStats = {
  totals: {
    views: number;
    visitors: number;
    views7: number;
    visitors7: number;
    views30: number;
    viewsToday: number;
    viewsYesterday: number;
    articles: number;
    published: number;
    drafts: number;
    subscribers: number;
    messages: number;
    unreadMessages: number;
    sessions: number;
    pagesPerSession: number;
    avgEngagementSeconds: number;
    clicks: number;
  };
  daily: { date: string; views: number; visitors: number }[];
  topPages: Bar[];
  referrers: Bar[];
  devices: Bar[];
  countries: Bar[];
  cities: Bar[];
  browsers: Bar[];
  systems: Bar[];
  languages: Bar[];
  screens: Bar[];
  sources: Bar[];
  campaigns: Bar[];
  utmSources: Bar[];
  utmMediums: Bar[];
  clicks: Bar[];
  scrollDepth: Bar[];
  hours: { hour: number; views: number }[];
  journeys: {
    sessionId: string;
    label: string;
    identified: boolean;
    start: string;
    durationSeconds: number;
    pages: { path: string; at: string }[];
    clicks: number;
  }[];
  filterOptions: {
    paths: string[];
    sources: string[];
    utmSources: string[];
    utmMediums: string[];
    campaigns: string[];
    devices: string[];
    browsers: string[];
    systems: string[];
    languages: string[];
    countries: string[];
    cities: string[];
    eventTypes: string[];
  };
};

export const UNKNOWN = "Inconnu";

/** Petit parseur d'UA maison, volontairement grossier (aucun fingerprint). */
export function parseUserAgent(ua: string): { browser: string; os: string } {
  const u = ua || "";
  let browser = UNKNOWN;
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/Chrome\//i.test(u) && !/Chromium/i.test(u)) browser = "Chrome";
  else if (/Firefox\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u) && /Version\//i.test(u)) browser = "Safari";
  else if (u) browser = "Autre";

  let os = UNKNOWN;
  if (/Windows NT/i.test(u)) os = "Windows";
  else if (/Android/i.test(u)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Mac OS X/i.test(u)) os = "macOS";
  else if (/Linux/i.test(u)) os = "Linux";
  else if (u) os = "Autre";

  return { browser, os };
}

export function hostFromReferrer(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Classe l'acquisition : utm / organic / social / referral / direct. */
export function classifySource(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrerHost?: string | null;
  currentHost?: string | null;
}): string {
  if (input.utmSource) return `utm:${input.utmSource.toLowerCase()}`;
  const host = (input.referrerHost ?? "").toLowerCase();
  if (!host) return "direct";
  if (input.currentHost && host === input.currentHost.replace(/^www\./, "")) return "direct";
  if (/google|bing|duckduckgo|qwant|ecosia|yahoo|yandex|brave/.test(host)) return "recherche";
  if (
    /facebook|instagram|linkedin|twitter|x\.com|threads|tiktok|youtube|reddit|substack|whatsapp|t\.co/.test(
      host,
    )
  )
    return `social:${host}`;
  return `referral:${host}`;
}

function rank(map: Map<string, number>, limit: number): Bar[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function bump(map: Map<string, number>, key: string | null | undefined) {
  const k = key && String(key).trim() ? String(key) : UNKNOWN;
  map.set(k, (map.get(k) ?? 0) + 1);
}

export type AnalyticsFilters = Partial<{
  path: string;
  source: string;
  utmSource: string;
  utmMedium: string;
  campaign: string;
  device: string;
  browser: string;
  os: string;
  language: string;
  country: string;
  city: string;
  eventType: string;
}>;

export function matchesFilters(v: ViewRow, f: AnalyticsFilters): boolean {
  const eq = (val: string | null | undefined, want?: string) =>
    !want || want === "all" || (val && String(val) ? String(val) === want : want === UNKNOWN);
  return (
    (!f.path || f.path === "all" || v.path === f.path) &&
    eq(v.source, f.source) &&
    eq(v.utm_source, f.utmSource) &&
    eq(v.utm_medium, f.utmMedium) &&
    eq(v.utm_campaign, f.campaign) &&
    eq(v.device, f.device) &&
    eq(v.browser, f.browser) &&
    eq(v.os, f.os) &&
    eq(v.language, f.language) &&
    eq(v.country, f.country) &&
    eq(v.city, f.city) &&
    eq(v.event_type ?? "pageview", f.eventType)
  );
}

function distinct(rows: ViewRow[], pick: (v: ViewRow) => string | null | undefined): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const val = pick(r);
    set.add(val && String(val).trim() ? String(val) : UNKNOWN);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr")).slice(0, 200);
}

export function buildSiteStats(input: {
  views: ViewRow[];
  articles: { published: boolean | null }[];
  subscribers: { active: boolean | null }[];
  messages: { is_read: boolean | null }[];
  filters?: AnalyticsFilters;
  days?: number;
}): SiteStats {
  const { articles, subscribers, messages } = input;
  const filters = input.filters ?? {};
  const days = input.days ?? 30;
  const all = input.views;
  const rows = all.filter((v) => matchesFilters(v, filters));
  const pageviews = rows.filter((v) => (v.event_type ?? "pageview") === "pageview");
  const clickRows = rows.filter((v) => v.event_type === "click");
  const scrollRows = rows.filter((v) => v.event_type === "scroll");
  const engagementRows = rows.filter((v) => v.event_type === "engagement");

  const now = Date.now();
  const d7 = now - 7 * 864e5;
  const d30 = now - 30 * 864e5;
  const todayKey = dayKey(new Date());
  const yesterdayKey = dayKey(new Date(now - 864e5));

  const pages = new Map<string, number>();
  const refs = new Map<string, number>();
  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  const browsers = new Map<string, number>();
  const systems = new Map<string, number>();
  const languages = new Map<string, number>();
  const screens = new Map<string, number>();
  const sources = new Map<string, number>();
  const campaigns = new Map<string, number>();
  const utmSources = new Map<string, number>();
  const utmMediums = new Map<string, number>();
  const clicksMap = new Map<string, number>();
  const scrollMap = new Map<string, number>();
  const perDay = new Map<string, { views: number; visitors: Set<string> }>();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0 }));
  const allVisitors = new Set<string>();
  const visitors7 = new Set<string>();
  const sessions = new Set<string>();

  let views7 = 0;
  let views30 = 0;
  let viewsToday = 0;
  let viewsYesterday = 0;

  for (const v of pageviews) {
    const t = new Date(v.created_at);
    const ts = t.getTime();
    const key = dayKey(t);
    const vid = v.visitor_id ?? v.session_id ?? `anon-${key}-${v.path}`;
    if (v.session_id) sessions.add(v.session_id);

    bump(pages, v.path);
    bump(refs, v.referrer_host ?? hostFromReferrer(v.referrer) ?? "Direct / inconnu");
    bump(devices, v.device);
    if (v.country) bump(countries, v.country);
    bump(cities, v.city);
    bump(browsers, v.browser);
    bump(systems, v.os);
    bump(languages, v.language);
    bump(
      screens,
      v.screen_width && v.screen_height ? `${v.screen_width}×${v.screen_height}` : UNKNOWN,
    );
    bump(sources, v.source);
    bump(campaigns, v.utm_campaign);
    bump(utmSources, v.utm_source);
    bump(utmMediums, v.utm_medium);
    hours[t.getHours()]!.views += 1;
    allVisitors.add(vid);

    const bucket = perDay.get(key) ?? { views: 0, visitors: new Set<string>() };
    bucket.views += 1;
    bucket.visitors.add(vid);
    perDay.set(key, bucket);

    if (ts >= d7) {
      views7 += 1;
      visitors7.add(vid);
    }
    if (ts >= d30) views30 += 1;
    if (key === todayKey) viewsToday += 1;
    if (key === yesterdayKey) viewsYesterday += 1;
  }

  for (const c of clickRows) {
    const meta = (c.metadata ?? {}) as Record<string, unknown>;
    const label = String(meta["label"] ?? c.event_name ?? UNKNOWN).slice(0, 60);
    const dest = meta["href"] ? ` → ${String(meta["href"]).slice(0, 60)}` : "";
    bump(clicksMap, `${label}${dest}`);
  }
  for (const s of scrollRows) {
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    bump(scrollMap, `${meta["depth"] ?? s.event_name ?? "?"} %`);
  }

  let engagementTotal = 0;
  for (const e of engagementRows) {
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const s = Number(meta["seconds"] ?? 0);
    if (Number.isFinite(s) && s > 0 && s < 3600) engagementTotal += s;
  }

  const daily = Array.from({ length: days }, (_, i) => {
    const key = dayKey(new Date(now - (days - 1 - i) * 864e5));
    const b = perDay.get(key);
    return { date: key, views: b?.views ?? 0, visitors: b?.visitors.size ?? 0 };
  });

  // Parcours pseudonymes
  const bySession = new Map<string, ViewRow[]>();
  for (const v of rows) {
    if (!v.session_id) continue;
    const arr = bySession.get(v.session_id) ?? [];
    arr.push(v);
    bySession.set(v.session_id, arr);
  }
  const journeys = [...bySession.entries()]
    .map(([sessionId, evts]) => {
      const sorted = [...evts].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const first = sorted[0]!;
      const last = sorted[sorted.length - 1]!;
      const pvs = sorted.filter((e) => (e.event_type ?? "pageview") === "pageview");
      return {
        sessionId,
        label: `Visiteur ${(first.visitor_id ?? sessionId).slice(0, 4)}…`,
        identified: Boolean(first.user_id),
        start: first.created_at,
        durationSeconds: Math.max(
          0,
          Math.round(
            (new Date(last.created_at).getTime() - new Date(first.created_at).getTime()) / 1000,
          ),
        ),
        pages: pvs.map((p) => ({ path: p.path, at: p.created_at })),
        clicks: sorted.filter((e) => e.event_type === "click").length,
      };
    })
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
    .slice(0, 40);

  const published = articles.filter((a) => a.published).length;
  const sessionCount = sessions.size;

  return {
    totals: {
      views: pageviews.length,
      visitors: allVisitors.size,
      views7,
      visitors7: visitors7.size,
      views30,
      viewsToday,
      viewsYesterday,
      articles: articles.length,
      published,
      drafts: articles.length - published,
      subscribers: subscribers.filter((s) => s.active !== false).length,
      messages: messages.length,
      unreadMessages: messages.filter((m) => !m.is_read).length,
      sessions: sessionCount,
      pagesPerSession: sessionCount ? Math.round((pageviews.length / sessionCount) * 10) / 10 : 0,
      avgEngagementSeconds: engagementRows.length
        ? Math.round(engagementTotal / engagementRows.length)
        : 0,
      clicks: clickRows.length,
    },
    daily,
    topPages: rank(pages, 10),
    referrers: rank(refs, 8),
    devices: rank(devices, 5),
    countries: rank(countries, 8),
    cities: rank(cities, 8),
    browsers: rank(browsers, 8),
    systems: rank(systems, 8),
    languages: rank(languages, 8),
    screens: rank(screens, 8),
    sources: rank(sources, 10),
    campaigns: rank(campaigns, 8),
    utmSources: rank(utmSources, 8),
    utmMediums: rank(utmMediums, 8),
    clicks: rank(clicksMap, 10),
    scrollDepth: rank(scrollMap, 5),
    hours,
    journeys,
    filterOptions: {
      paths: distinct(all, (v) => v.path),
      sources: distinct(all, (v) => v.source),
      utmSources: distinct(all, (v) => v.utm_source),
      utmMediums: distinct(all, (v) => v.utm_medium),
      campaigns: distinct(all, (v) => v.utm_campaign),
      devices: distinct(all, (v) => v.device),
      browsers: distinct(all, (v) => v.browser),
      systems: distinct(all, (v) => v.os),
      languages: distinct(all, (v) => v.language),
      countries: distinct(all, (v) => v.country),
      cities: distinct(all, (v) => v.city),
      eventTypes: distinct(all, (v) => v.event_type ?? "pageview"),
    },
  };
}

const CSV_COLUMNS: (keyof ViewRow)[] = [
  "created_at",
  "event_type",
  "event_name",
  "path",
  "title",
  "source",
  "referrer_host",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "device",
  "browser",
  "os",
  "language",
  "screen_width",
  "screen_height",
  "country",
  "city",
  "session_id",
  "visitor_id",
];

export function toCsv(rows: ViewRow[]): string {
  const esc = (val: unknown) => {
    const s = val === null || val === undefined ? "" : String(val);
    return `"${s.replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
  };
  const head = CSV_COLUMNS.join(";");
  const body = rows.map((r) => CSV_COLUMNS.map((c) => esc(r[c])).join(";")).join("\n");
  return `\uFEFF${head}\n${body}`;
}
