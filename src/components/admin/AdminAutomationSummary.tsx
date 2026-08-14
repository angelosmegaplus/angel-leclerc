import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Inbox, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CacheRow = { key: string; payload: Record<string, any>; updated_at: string };
type ApplicationRow = {
  id: string;
  company: string | null;
  city: string | null;
  position: string | null;
  sent_at: string | null;
  follow_up_at: string | null;
  status: string | null;
  response: string | null;
  notes: string | null;
};

const anyDb = supabase as unknown as { from: (table: string) => any };

async function loadSummaries(): Promise<Record<string, CacheRow>> {
  const { data, error } = await anyDb
    .from("angel_os_cache")
    .select("key,payload,updated_at")
    .in("key", ["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary"]);
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as CacheRow[]).map((row) => [row.key, row]));
}

async function loadApplications(): Promise<ApplicationRow[]> {
  const { data, error } = await anyDb
    .from("applications")
    .select("id,company,city,position,sent_at,follow_up_at,status,response,notes")
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApplicationRow[];
}

function formatEventDate(value?: string) {
  if (!value) return "Date non précisée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(date);
}

function formatShortDate(value?: string | null) {
  if (!value) return "date inconnue";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

function readable(value: any) {
  if (!value) return "Aucune synthèse récente disponible.";
  if (typeof value === "string") return value;
  if (typeof value.summary === "string") return value.summary;
  return Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .map(([key, item]) => `${key.replace(/_/g, " ")} : ${String(item)}`)
    .join(" · ") || "Synthèse disponible dans les données détaillées.";
}

function applicationLabel(app: ApplicationRow) {
  return [app.company || "Entreprise non identifiée", app.city].filter(Boolean).join(" — ");
}

function ApplicationsSummary({ applications }: { applications: ApplicationRow[] }) {
  if (applications.length === 0) {
    return (
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passé</p><p className="mt-1 text-sm">Aucune candidature enregistrée pour le moment.</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Présent</p><p className="mt-1 text-sm">Le suivi attend les premières candidatures synchronisées ou ajoutées.</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Futur</p><p className="mt-1 text-sm">Prochaine action : synchroniser Gmail ou ajouter les candidatures déjà envoyées.</p></div>
      </div>
    );
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const rejected = applications.filter((app) => app.status === "refusee");
  const accepted = applications.filter((app) => ["acceptee", "acceptée", "entretien"].includes(app.status ?? ""));
  const active = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? ""));
  const withResponse = applications.filter((app) => !!app.response);
  const dueFollowUps = active.filter((app) => app.follow_up_at && app.follow_up_at <= today);
  const futureFollowUps = active.filter((app) => app.follow_up_at && app.follow_up_at > today).sort((a, b) => (a.follow_up_at ?? "").localeCompare(b.follow_up_at ?? ""));
  const latest = applications.slice(0, 3);

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passé</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground"><strong>{applications.length}</strong> candidature(s) enregistrée(s), dont <strong>{rejected.length}</strong> refus et <strong>{withResponse.length}</strong> réponse(s) reçue(s).</p>
        {latest.length > 0 && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Dernières démarches : {latest.map((app) => `${applicationLabel(app)} (${formatShortDate(app.sent_at)})`).join(" · ")}</p>}
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Présent</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground"><strong>{active.length}</strong> candidature(s) encore active(s){accepted.length > 0 ? ` · ${accepted.length} piste(s) avancée(s)` : ""}.</p>
        {dueFollowUps.length > 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><strong>{dueFollowUps.length} relance(s) à faire maintenant :</strong> {dueFollowUps.slice(0, 4).map(applicationLabel).join(" · ")}</p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Aucune relance arrivée à échéance aujourd’hui.</p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Futur</p>
        {futureFollowUps.length > 0 ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-foreground"><strong>{futureFollowUps.length}</strong> relance(s) déjà planifiée(s).</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Prochaine : {applicationLabel(futureFollowUps[0])}, le {formatShortDate(futureFollowUps[0].follow_up_at)}.</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-foreground">Aucune relance future programmée. Priorité : relancer les candidatures sans réponse et continuer les nouvelles démarches.</p>
        )}
      </div>
    </div>
  );
}

export function AdminAutomationSummary({ mode = "dashboard" }: { mode?: "dashboard" | "applications" | "mail" | "messages" | "stats" | "publications" }) {
  const { data = {}, isLoading } = useQuery({
    queryKey: ["admin-automation-summaries"],
    queryFn: loadSummaries,
    refetchInterval: 5 * 60 * 1000,
  });
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["admin-application-summary"],
    queryFn: loadApplications,
    refetchInterval: 5 * 60 * 1000,
    enabled: mode === "applications" || mode === "dashboard",
  });

  if (isLoading || ((mode === "applications" || mode === "dashboard") && applicationsLoading)) {
    return <p className="text-sm text-muted-foreground">Chargement de la synthèse automatique…</p>;
  }

  const calendar = data.google_calendar_dashboard?.payload;
  const gmail = data.gmail_dashboard?.payload;
  const cockpit = data.admin_cockpit_summary?.payload;
  const next = calendar?.nextEvent;
  const waiting = !calendar && !gmail && !cockpit && applications.length === 0;

  if (waiting && mode !== "applications") return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Synthèse automatique en attente du prochain passage horaire.</p>;

  if (mode !== "dashboard") {
    if (mode === "applications") {
      return (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 font-medium text-foreground"><Inbox className="h-4 w-4 text-primary" />Point candidatures</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Bilan automatique construit à partir des candidatures enregistrées et synchronisées.</p>
          <ApplicationsSummary applications={applications} />
        </div>
      );
    }

    const mapping: Record<string, { icon: typeof Inbox; title: string; value: any }> = {
      mail: { icon: Mail, title: "Point Gmail", value: gmail?.summary ?? gmail?.otherSummary },
      messages: { icon: Mail, title: "Point messages", value: cockpit?.messages },
      stats: { icon: TrendingUp, title: "Point statistiques", value: cockpit?.stats },
      publications: { icon: FileText, title: "Point publications", value: cockpit?.publications },
    };
    const item = mapping[mode];
    const text = readable(item.value);
    return <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4"><p className="flex items-center gap-2 font-medium text-foreground"><item.icon className="h-4 w-4 text-primary" />{item.title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-primary" />Prochain rendez-vous</p>
        <p className="mt-2 font-medium text-foreground">{next?.title ?? "Aucun rendez-vous remonté"}</p>
        {next?.start && <p className="mt-1 text-sm text-muted-foreground">{formatEventDate(next.start)}</p>}
        {next?.advice && <p className="mt-2 text-sm text-muted-foreground">Conseil : {next.advice}</p>}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-primary" />Gmail important</p>
        <p className="mt-2 text-2xl font-bold">{gmail?.important?.length ?? cockpit?.gmail?.important ?? 0}</p>
        <p className="text-sm text-muted-foreground">message(s) à regarder, aucune réponse envoyée automatiquement.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" />État Angel OS</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cockpit?.summary ?? `${applications.length} candidature(s) suivie(s). Publications, messages et statistiques sont synthétisés à chaque passage.`}</p>
      </div>
    </div>
  );
}
