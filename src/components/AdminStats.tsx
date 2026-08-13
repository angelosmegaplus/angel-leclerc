import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  Eye,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Monitor,
  MousePointerClick,
  Route,
  Smartphone,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  exportAnalyticsCsv,
  getRealtimeActivity,
  getSiteStats,
} from "@/lib/analytics.functions";

type Filters = {
  path?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  campaign?: string;
  device?: string;
  browser?: string;
  os?: string;
  language?: string;
  country?: string;
  city?: string;
  eventType?: string;
};

type FilterKey = keyof Filters;

const PERIODS = [
  { value: 1, label: "Aujourd’hui" },
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
] as const;

export function AdminStats() {
  const [days, setDays] = useState(30);
  const [filters, setFilters] = useState<Filters>({});
  const [exporting, setExporting] = useState(false);
  const fetchStats = useServerFn(getSiteStats);
  const fetchRealtime = useServerFn(getRealtimeActivity);
  const fetchCsv = useServerFn(exportAnalyticsCsv);

  const request = useMemo(() => ({ days, filters }), [days, filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-site-stats", request],
    queryFn: () => fetchStats({ data: request }),
    refetchInterval: 60_000,
  });

  const { data: realtime } = useQuery({
    queryKey: ["admin-site-stats-realtime"],
    queryFn: () => fetchRealtime(),
    refetchInterval: 15_000,
  });

  const setFilter = (key: FilterKey, value: string) => {
    setFilters((current) => {
      const next = { ...current };
      if (!value || value === "all") delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const resetFilters = () => setFilters({});

  const exportCsv = async () => {
    setExporting(true);
    try {
      const result = await fetchCsv({ data: request });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-angel-leclerc-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des statistiques…
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="mt-8 text-sm text-destructive">
        Impossible de charger les statistiques pour le moment.
      </p>
    );
  }

  const t = data.totals;
  const trend = t.viewsToday - t.viewsYesterday;
  const max = Math.max(1, ...data.daily.map((d) => d.views));
  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Filtres d’analyse</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Tous les indicateurs et l’export suivent la période et les filtres sélectionnés.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réinitialiser{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Période"
            value={String(days)}
            options={PERIODS.map((p) => ({ label: p.label, value: String(p.value) }))}
            includeAll={false}
            onChange={(value) => setDays(Number(value))}
          />
          <FilterSelect label="Page" value={filters.path} options={data.filterOptions.paths} onChange={(v) => setFilter("path", v)} />
          <FilterSelect label="Source" value={filters.source} options={data.filterOptions.sources} onChange={(v) => setFilter("source", v)} />
          <FilterSelect label="UTM source" value={filters.utmSource} options={data.filterOptions.utmSources} onChange={(v) => setFilter("utmSource", v)} />
          <FilterSelect label="UTM medium" value={filters.utmMedium} options={data.filterOptions.utmMediums} onChange={(v) => setFilter("utmMedium", v)} />
          <FilterSelect label="Campagne" value={filters.campaign} options={data.filterOptions.campaigns} onChange={(v) => setFilter("campaign", v)} />
          <FilterSelect label="Appareil" value={filters.device} options={data.filterOptions.devices} onChange={(v) => setFilter("device", v)} />
          <FilterSelect label="Navigateur" value={filters.browser} options={data.filterOptions.browsers} onChange={(v) => setFilter("browser", v)} />
          <FilterSelect label="OS" value={filters.os} options={data.filterOptions.systems} onChange={(v) => setFilter("os", v)} />
          <FilterSelect label="Langue" value={filters.language} options={data.filterOptions.languages} onChange={(v) => setFilter("language", v)} />
          <FilterSelect label="Pays" value={filters.country} options={data.filterOptions.countries} onChange={(v) => setFilter("country", v)} />
          <FilterSelect label="Ville" value={filters.city} options={data.filterOptions.cities} onChange={(v) => setFilter("city", v)} />
          <FilterSelect label="Événement" value={filters.eventType} options={data.filterOptions.eventTypes} onChange={(v) => setFilter("eventType", v)} />
        </div>
      </section>

      <Panel title="En ce moment" icon={<Activity className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniKpi label="Visiteurs actifs (5 min)" value={realtime?.activeVisitors ?? 0} />
          <MiniKpi label="Sessions actives (5 min)" value={realtime?.activeSessions ?? 0} />
          <MiniKpi label="Pages actives" value={realtime?.pages.length ?? 0} />
          <MiniKpi label="Dernières interactions" value={realtime?.recent.length ?? 0} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages consultées</p>
            <Bars rows={realtime?.pages ?? []} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activité récente</p>
            {realtime?.recent?.length ? (
              <ul className="max-h-56 space-y-2 overflow-auto pr-1 text-xs">
                {realtime.recent.map((item, index) => (
                  <li key={`${item.at}-${index}`} className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">Visiteur {item.visitor}… · {eventLabel(item.type)}</span>
                      <time className="shrink-0 text-muted-foreground">
                        {new Date(item.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </time>
                    </div>
                    <p className="mt-1 truncate text-muted-foreground">{item.path}{item.label ? ` · ${item.label}` : ""}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité sur les cinq dernières minutes.</p>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Eye className="h-4 w-4" />} label="Vues aujourd’hui" value={t.viewsToday}>
          <span className={`inline-flex items-center gap-1 text-xs ${trend >= 0 ? "text-primary" : "text-muted-foreground"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? "+" : ""}{trend} vs hier
          </span>
        </Kpi>
        <Kpi icon={<Users className="h-4 w-4" />} label="Visiteurs" value={t.visitors}>
          <span className="text-xs text-muted-foreground">pseudonymes sur la période</span>
        </Kpi>
        <Kpi icon={<Route className="h-4 w-4" />} label="Sessions" value={t.sessions}>
          <span className="text-xs text-muted-foreground">{t.pagesPerSession.toLocaleString("fr-FR")} pages/session</span>
        </Kpi>
        <Kpi icon={<Timer className="h-4 w-4" />} label="Engagement moyen" value={t.avgEngagementSeconds} suffix=" s" />
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Vues (7 jours)" value={t.views7}>
          <span className="text-xs text-muted-foreground">{t.visitors7} visiteurs</span>
        </Kpi>
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Vues (30 jours)" value={t.views30} />
        <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Clics utiles" value={t.clicks} />
        <Kpi icon={<Eye className="h-4 w-4" />} label="Pages vues" value={t.views} />
      </div>

      <Panel title={`Visites · ${PERIODS.find((p) => p.value === days)?.label ?? `${days} jours`}`}>
        <div className="flex h-40 items-end gap-1">
          {data.daily.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(2, (d.views / max) * 150)}px` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                {new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} · {d.views} vues · {d.visitors} visiteurs
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pages les plus vues" icon={<Eye className="h-4 w-4" />}><Bars rows={data.topPages} /></Panel>
        <Panel title="Sources d’acquisition" icon={<Globe className="h-4 w-4" />}><Bars rows={data.sources} /></Panel>
        <Panel title="UTM source" icon={<Globe className="h-4 w-4" />}><Bars rows={data.utmSources} /></Panel>
        <Panel title="UTM medium" icon={<Globe className="h-4 w-4" />}><Bars rows={data.utmMediums} /></Panel>
        <Panel title="Campagnes" icon={<BarChart3 className="h-4 w-4" />}><Bars rows={data.campaigns} /></Panel>
        <Panel title="Référents" icon={<Globe className="h-4 w-4" />}><Bars rows={data.referrers} /></Panel>
        <Panel title="Navigateurs" icon={<Globe className="h-4 w-4" />}><Bars rows={data.browsers} /></Panel>
        <Panel title="Systèmes" icon={<Monitor className="h-4 w-4" />}><Bars rows={data.systems} /></Panel>
        <Panel title="Langues" icon={<Languages className="h-4 w-4" />}><Bars rows={data.languages} /></Panel>
        <Panel title="Appareils" icon={<Smartphone className="h-4 w-4" />}><Bars rows={data.devices} /></Panel>
        <Panel title="Écrans" icon={<Monitor className="h-4 w-4" />}><Bars rows={data.screens} /></Panel>
        <Panel title="Pays" icon={<Globe className="h-4 w-4" />}><Bars rows={data.countries} /></Panel>
        <Panel title="Villes" icon={<MapPin className="h-4 w-4" />}><Bars rows={data.cities} /></Panel>
        <Panel title="Clics les plus fréquents" icon={<MousePointerClick className="h-4 w-4" />}><Bars rows={data.clicks} /></Panel>
        <Panel title="Profondeur de lecture" icon={<Eye className="h-4 w-4" />}><Bars rows={data.scrollDepth} /></Panel>
      </div>

      <Panel title="Parcours et sessions pseudonymes" icon={<Route className="h-4 w-4" />}>
        {data.journeys.length ? (
          <div className="space-y-3">
            {data.journeys.slice(0, 20).map((journey) => (
              <details key={journey.sessionId} className="rounded-lg border border-border bg-muted/20 p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">
                      {journey.label}{journey.identified ? " · utilisateur identifié volontairement" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {journey.pages.length} page(s) · {journey.clicks} clic(s) · {formatDuration(journey.durationSeconds)}
                    </span>
                  </div>
                </summary>
                <ol className="mt-3 space-y-2 border-l border-border pl-4 text-xs">
                  {journey.pages.map((page, index) => (
                    <li key={`${page.at}-${index}`}>
                      <span className="font-medium text-foreground">{page.path}</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(page.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Pas encore de parcours disponible sur cette sélection.</p>
        )}
      </Panel>

      <Panel title="Heures de visite" icon={<Clock className="h-4 w-4" />}>
        <div className="flex h-24 items-end gap-[3px]">
          {data.hours.map((h) => {
            const hmax = Math.max(1, ...data.hours.map((x) => x.views));
            return (
              <div key={h.hour} className="group relative flex-1">
                <div className="w-full rounded-t bg-primary/50 group-hover:bg-primary" style={{ height: `${Math.max(2, (h.views / hmax) * 90)}px` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                  {h.hour}h · {h.views}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Articles publiés" value={t.published}><span className="text-xs text-muted-foreground">{t.drafts} brouillon(s)</span></Kpi>
        <Kpi label="Abonnés au blog" value={t.subscribers} />
        <Kpi label="Messages reçus" value={t.messages}><span className="text-xs text-muted-foreground">{t.unreadMessages} non lu(s)</span></Kpi>
        <Kpi label="Total des vues" value={t.views}><span className="text-xs text-muted-foreground">période et filtres actifs</span></Kpi>
      </div>

      <p className="text-xs text-muted-foreground">
        Mesure first-party sans cookie publicitaire ni fingerprinting. Les identifiants visiteur et session sont aléatoires et pseudonymes ; aucune IP brute n’est stockée. L’espace administrateur et l’authentification ne sont pas suivis. Une identité n’est reliée qu’après identification volontaire sur le site.
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  includeAll = true,
}: {
  label: string;
  value?: string;
  options: readonly string[] | readonly { label: string; value: string }[];
  onChange: (value: string) => void;
  includeAll?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        value={value ?? "all"}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
      >
        {includeAll && <option value="all">Tous</option>}
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function Kpi({ icon, label, value, suffix = "", children }: { icon?: React.ReactNode; label: string; value: number; suffix?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{icon}{label}</div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">{value.toLocaleString("fr-FR")}{suffix}</p>
      {children}
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">{icon}{title}</h3>
      {children}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Pas encore de données.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-foreground">{r.label}</span>
            <span className="shrink-0 text-muted-foreground">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function eventLabel(type: string) {
  if (type === "pageview") return "page vue";
  if (type === "click") return "clic";
  if (type === "scroll") return "lecture";
  if (type === "engagement") return "engagement";
  return type;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} min ${rest.toString().padStart(2, "0")} s`;
}
