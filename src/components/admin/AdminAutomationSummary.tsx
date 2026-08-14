import { useQuery } from "@tanstack/react-query";
import { FileText, Inbox, Mail, TrendingUp, Sparkles } from "lucide-react";
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
    .in("key", ["google_calendar_dashboard", "gmail_dashboard", "admin_cockpit_summary", "news_dashboard"]);
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

function formatShortDate(value?: string | null) {
  if (!value) return "date inconnue";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

function readable(value: any, fallback = "Aucune donnée récente remontée.") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value.summary === "string") return value.summary;
  return Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .map(([key, item]) => `${key.replace(/_/g, " ")} : ${String(item)}`)
    .join(" · ") || fallback;
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

  const today = new Date().toISOString().slice(0, 10);
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
        <p className="mt-2 text-sm leading-relaxed text-foreground"><strong>{applications.length}</strong> candidature(s), dont <strong>{rejected.length}</strong> refus et <strong>{withResponse.length}</strong> réponse(s).</p>
        {latest.length > 0 && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Dernières démarches : {latest.map((app) => `${applicationLabel(app)} (${formatShortDate(app.sent_at)})`).join(" · ")}</p>}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Présent</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground"><strong>{active.length}</strong> candidature(s) active(s){accepted.length > 0 ? ` · ${accepted.length} piste(s) avancée(s)` : ""}.</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{dueFollowUps.length > 0 ? `${dueFollowUps.length} relance(s) à faire : ${dueFollowUps.slice(0, 4).map(applicationLabel).join(" · ")}` : "Aucune relance arrivée à échéance aujourd’hui."}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Futur</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{futureFollowUps.length > 0 ? `${futureFollowUps.length} relance(s) planifiée(s). Prochaine : ${applicationLabel(futureFollowUps[0])}, le ${formatShortDate(futureFollowUps[0].follow_up_at)}.` : "Aucune relance future programmée. Priorité : relancer les dossiers sans réponse et poursuivre les nouvelles démarches."}</p>
      </div>
    </div>
  );
}

export function AdminAutomationSummary({ mode = "dashboard" }: { mode?: "dashboard" | "applications" | "mail" | "messages" | "stats" | "publications" }) {
  const { data = {}, isLoading } = useQuery({ queryKey: ["admin-automation-summaries"], queryFn: loadSummaries, refetchInterval: 5 * 60 * 1000 });
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({ queryKey: ["admin-application-summary"], queryFn: loadApplications, refetchInterval: 5 * 60 * 1000, enabled: mode === "applications" || mode === "dashboard" });

  if (isLoading || ((mode === "applications" || mode === "dashboard") && applicationsLoading)) return <p className="text-sm text-muted-foreground">Chargement du bilan Angel OS…</p>;

  const gmail = data.gmail_dashboard?.payload;
  const cockpit = data.admin_cockpit_summary?.payload;
  const news = data.news_dashboard?.payload;
  const waiting = !data.google_calendar_dashboard && !gmail && !cockpit && !news && applications.length === 0;
  if (waiting && mode !== "applications") return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Bilan général en attente du prochain passage de la veille existante.</p>;

  if (mode !== "dashboard") {
    if (mode === "applications") return <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4"><p className="flex items-center gap-2 font-medium text-foreground"><Inbox className="h-4 w-4 text-primary" />Point candidatures</p><ApplicationsSummary applications={applications} /></div>;
    const mapping: Record<string, { icon: typeof Inbox; title: string; value: any }> = {
      mail: { icon: Mail, title: "Point Gmail", value: gmail?.summary ?? gmail?.otherSummary },
      messages: { icon: Mail, title: "Point messages", value: cockpit?.messages },
      stats: { icon: TrendingUp, title: "Point statistiques", value: cockpit?.stats },
      publications: { icon: FileText, title: "Point publications", value: cockpit?.publications },
    };
    const item = mapping[mode];
    return <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4"><p className="flex items-center gap-2 font-medium text-foreground"><item.icon className="h-4 w-4 text-primary" />{item.title}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{readable(item.value)}</p></div>;
  }

  const activeApplications = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? "")).length;
  const importantMail = gmail?.important?.length ?? cockpit?.gmail?.important ?? 0;
  const newsCount = Array.isArray(news?.items) ? news.items.length : 0;

  const fallbackText = `Voici le bilan du moment. Angel OS suit actuellement ${applications.length} candidature${applications.length > 1 ? "s" : ""}, dont ${activeApplications} encore active${activeApplications > 1 ? "s" : ""}. ${importantMail > 0 ? `${importantMail} mail${importantMail > 1 ? "s" : ""} important${importantMail > 1 ? "s" : ""} ${importantMail > 1 ? "demandent" : "demande"} ton attention. ` : "Aucun mail important n’est signalé pour le moment. "}${newsCount > 0 ? `La veille actualité contient aussi ${newsCount} élément${newsCount > 1 ? "s" : ""} récent${newsCount > 1 ? "s" : ""}. ` : ""}Le prochain passage de la veille précisera les priorités à partir des dernières données disponibles.`;

  const generalText =
    (typeof cockpit?.generalText === "string" && cockpit.generalText.trim()) ||
    (typeof cockpit?.summary === "string" && cockpit.summary.trim()) ||
    fallbackText;

  return (
    <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8def8] text-[#594b66]"><Sparkles className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Bilan général Angel OS IA</p>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground/90 sm:text-base">
            {generalText}
          </p>
          {data.admin_cockpit_summary?.updated_at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Mis à jour {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.admin_cockpit_summary.updated_at))}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
