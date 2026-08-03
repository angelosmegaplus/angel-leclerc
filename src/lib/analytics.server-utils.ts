export type ViewRow = {
  path: string;
  referrer: string | null;
  device: string | null;
  country: string | null;
  session_id: string | null;
  created_at: string;
};

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
  };
  daily: { date: string; views: number; visitors: number }[];
  topPages: { label: string; value: number }[];
  referrers: { label: string; value: number }[];
  devices: { label: string; value: number }[];
  countries: { label: string; value: number }[];
  hours: { hour: number; views: number }[];
};

function rank(map: Map<string, number>, limit: number) {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function buildSiteStats(input: {
  views: ViewRow[];
  articles: { published: boolean | null }[];
  subscribers: { active: boolean | null }[];
  messages: { is_read: boolean | null }[];
}): SiteStats {
  const { views, articles, subscribers, messages } = input;
  const now = Date.now();
  const d7 = now - 7 * 864e5;
  const d30 = now - 30 * 864e5;
  const todayKey = dayKey(new Date());
  const yesterdayKey = dayKey(new Date(now - 864e5));

  const pages = new Map<string, number>();
  const refs = new Map<string, number>();
  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  const perDay = new Map<string, { views: number; visitors: Set<string> }>();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0 }));
  const allVisitors = new Set<string>();
  const visitors7 = new Set<string>();

  let views7 = 0;
  let views30 = 0;
  let viewsToday = 0;
  let viewsYesterday = 0;

  for (const v of views) {
    const t = new Date(v.created_at);
    const ts = t.getTime();
    const key = dayKey(t);
    const sid = v.session_id ?? `anon-${key}-${v.path}`;

    pages.set(v.path, (pages.get(v.path) ?? 0) + 1);
    const host = (() => {
      if (!v.referrer) return "Direct / inconnu";
      try {
        return new URL(v.referrer).hostname.replace(/^www\./, "");
      } catch {
        return "Direct / inconnu";
      }
    })();
    refs.set(host, (refs.get(host) ?? 0) + 1);
    devices.set(v.device ?? "inconnu", (devices.get(v.device ?? "inconnu") ?? 0) + 1);
    if (v.country) countries.set(v.country, (countries.get(v.country) ?? 0) + 1);
    hours[t.getHours()]!.views += 1;
    allVisitors.add(sid);

    const bucket = perDay.get(key) ?? { views: 0, visitors: new Set<string>() };
    bucket.views += 1;
    bucket.visitors.add(sid);
    perDay.set(key, bucket);

    if (ts >= d7) {
      views7 += 1;
      visitors7.add(sid);
    }
    if (ts >= d30) views30 += 1;
    if (key === todayKey) viewsToday += 1;
    if (key === yesterdayKey) viewsYesterday += 1;
  }

  const daily = Array.from({ length: 30 }, (_, i) => {
    const key = dayKey(new Date(now - (29 - i) * 864e5));
    const b = perDay.get(key);
    return { date: key, views: b?.views ?? 0, visitors: b?.visitors.size ?? 0 };
  });

  const published = articles.filter((a) => a.published).length;

  return {
    totals: {
      views: views.length,
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
    },
    daily,
    topPages: rank(pages, 10),
    referrers: rank(refs, 8),
    devices: rank(devices, 5),
    countries: rank(countries, 8),
    hours,
  };
}
