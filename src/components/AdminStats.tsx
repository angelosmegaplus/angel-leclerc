import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Eye,
  Users,
  Globe,
  Smartphone,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { getSiteStats } from "@/lib/analytics.functions";

export function AdminStats() {
  const fetchStats = useServerFn(getSiteStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-site-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });

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

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Eye className="h-4 w-4" />} label="Vues aujourd'hui" value={t.viewsToday}>
          <span
            className={`inline-flex items-center gap-1 text-xs ${trend >= 0 ? "text-primary" : "text-muted-foreground"}`}
          >
            {trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend >= 0 ? "+" : ""}
            {trend} vs hier
          </span>
        </Kpi>
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Vues (7 jours)" value={t.views7}>
          <span className="text-xs text-muted-foreground">{t.visitors7} visiteurs</span>
        </Kpi>
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Vues (30 jours)" value={t.views30} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Visiteurs uniques" value={t.visitors}>
          <span className="text-xs text-muted-foreground">sur 90 jours</span>
        </Kpi>
      </div>

      <Panel title="Visites des 30 derniers jours">
        <div className="flex h-40 items-end gap-1">
          {data.daily.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                style={{ height: `${Math.max(2, (d.views / max) * 150)}px` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                {new Date(d.date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })}{" "}
                · {d.views} vues · {d.visitors} visiteurs
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pages les plus vues" icon={<Eye className="h-4 w-4" />}>
          <Bars rows={data.topPages} />
        </Panel>
        <Panel title="Provenance du trafic" icon={<Globe className="h-4 w-4" />}>
          <Bars rows={data.referrers} />
        </Panel>
        <Panel title="Appareils" icon={<Smartphone className="h-4 w-4" />}>
          <Bars rows={data.devices} />
        </Panel>
        <Panel title="Pays" icon={<Globe className="h-4 w-4" />}>
          <Bars rows={data.countries} />
        </Panel>
      </div>

      <Panel title="Heures de visite" icon={<Clock className="h-4 w-4" />}>
        <div className="flex h-24 items-end gap-[3px]">
          {data.hours.map((h) => {
            const hmax = Math.max(1, ...data.hours.map((x) => x.views));
            return (
              <div key={h.hour} className="group relative flex-1">
                <div
                  className="w-full rounded-t bg-primary/50 group-hover:bg-primary"
                  style={{ height: `${Math.max(2, (h.views / hmax) * 90)}px` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">
                  {h.hour}h · {h.views}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Articles publiés" value={t.published}>
          <span className="text-xs text-muted-foreground">{t.drafts} brouillon(s)</span>
        </Kpi>
        <Kpi label="Abonnés au blog" value={t.subscribers} />
        <Kpi label="Messages reçus" value={t.messages}>
          <span className="text-xs text-muted-foreground">{t.unreadMessages} non lu(s)</span>
        </Kpi>
        <Kpi label="Total des vues" value={t.views}>
          <span className="text-xs text-muted-foreground">90 derniers jours</span>
        </Kpi>
      </div>

      <p className="text-xs text-muted-foreground">
        Statistiques mesurées directement sur le site, sans cookie publicitaire ni service
        tiers. Les visites de l'espace administrateur ne sont pas comptabilisées.
      </p>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-foreground">
        {value.toLocaleString("fr-FR")}
      </p>
      {children}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Pas encore de données.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-foreground">{r.label}</span>
            <span className="shrink-0 text-muted-foreground">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
