import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, Inbox, Mail, MessageSquare, Sparkles, TrendingUp, FolderKanban, Bell, Plug, Activity, ShoppingBag, Users, WandSparkles } from "lucide-react";
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

type SummaryMode =
  | "dashboard"
  | "applications"
  | "mail"
  | "messages"
  | "stats"
  | "publications"
  | "agenda"
  | "projects"
  | "files"
  | "studio"
  | "activity"
  | "connections"
  | "notifications"
  | "automation"
  | "subscribers"
  | "shop"
  | "feedback"
  | "ai";

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

function readable(value: any, fallback = "Aucune donnée récente remontée pour cette section.") {
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

function detectMode(title: string): SummaryMode {
  const value = title.toLocaleLowerCase("fr");
  if (value.includes("candid")) return "applications";
  if (value.includes("mail") || value.includes("boîte")) return "mail";
  if (value.includes("message")) return "messages";
  if (value.includes("stat")) return "stats";
  if (value.includes("article") || value.includes("contenu") || value.includes("publication")) return "publications";
  if (value.includes("agenda") || value.includes("calendrier")) return "agenda";
  if (value.includes("projet")) return "projects";
  if (value.includes("fichier")) return "files";
  if (value.includes("studio")) return "studio";
  if (value.includes("activité")) return "activity";
  if (value.includes("connexion")) return "connections";
  if (value.includes("notification")) return "notifications";
  if (value.includes("automatisation")) return "automation";
  if (value.includes("abonné")) return "subscribers";
  if (value.includes("boutique")) return "shop";
  if (value.includes("avis")) return "feedback";
  if (value.includes("ia") || value.includes("angel ai")) return "ai";
  return "dashboard";
}

function ApplicationsSummary({ applications }: { applications: ApplicationRow[] }) {
  if (applications.length === 0) return <p className="mt-2 text-sm text-muted-foreground">Aucune candidature enregistrée pour le moment.</p>;
  const today = new Date().toISOString().slice(0, 10);
  const rejected = applications.filter((app) => app.status === "refusee");
  const active = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? ""));
  const due = active.filter((app) => app.follow_up_at && app.follow_up_at <= today);
  const future = active.filter((app) => app.follow_up_at && app.follow_up_at > today).sort((a, b) => (a.follow_up_at ?? "").localeCompare(b.follow_up_at ?? ""));
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passé</p><p className="mt-2 text-sm"><strong>{applications.length}</strong> candidature(s), dont <strong>{rejected.length}</strong> refus. Dernières démarches : {applications.slice(0, 3).map((app) => `${applicationLabel(app)} (${formatShortDate(app.sent_at)})`).join(" · ")}.</p></div>
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Présent</p><p className="mt-2 text-sm"><strong>{active.length}</strong> dossier(s) encore actif(s). {due.length > 0 ? `${due.length} relance(s) sont à faire maintenant : ${due.slice(0, 4).map(applicationLabel).join(" · ")}.` : "Aucune relance arrivée à échéance aujourd’hui."}</p></div>
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Futur</p><p className="mt-2 text-sm">{future.length > 0 ? `Prochaine relance : ${applicationLabel(future[0])}, le ${formatShortDate(future[0].follow_up_at)}.` : "Priorité : relancer les dossiers sans réponse et poursuivre les nouvelles candidatures pertinentes."}</p></div>
    </div>
  );
}

const pageConfig: Record<Exclude<SummaryMode, "dashboard" | "applications">, { title: string; icon: any; key: string; fallback: string }> = {
  mail: { title: "Bilan mails Angel OS IA", icon: Mail, key: "gmail", fallback: "Analyse les mails récents, les messages importants, les réponses attendues et les actions à faire en priorité." },
  messages: { title: "Bilan messages Angel OS IA", icon: MessageSquare, key: "messages", fallback: "Synthèse des messages récents, des conversations à reprendre et des réponses qui demandent ton attention." },
  stats: { title: "Bilan statistiques Angel OS IA", icon: TrendingUp, key: "stats", fallback: "Lecture des statistiques récentes, évolutions importantes et points à surveiller." },
  publications: { title: "Bilan publications Angel OS IA", icon: FileText, key: "publications", fallback: "Synthèse des brouillons, publications récentes, contenus programmés et prochaines actions éditoriales." },
  agenda: { title: "Bilan agenda Angel OS IA", icon: CalendarDays, key: "agenda", fallback: "Synthèse des prochains rendez-vous, échéances et conseils pratiques utiles pour les préparer." },
  projects: { title: "Bilan projets Angel OS IA", icon: FolderKanban, key: "projects", fallback: "État des projets en cours, blocages, priorités et prochaines étapes concrètes." },
  files: { title: "Bilan fichiers Angel OS IA", icon: FileText, key: "files", fallback: "Synthèse des fichiers récents ou importants et des documents qui méritent une action." },
  studio: { title: "Bilan studio Angel OS IA", icon: WandSparkles, key: "studio", fallback: "Point sur les créations en cours, éléments à finaliser et prochaines productions utiles." },
  activity: { title: "Bilan activité Angel OS IA", icon: Activity, key: "activity", fallback: "Résumé de l’activité récente d’Angel OS et des changements significatifs." },
  connections: { title: "Bilan connexions Angel OS IA", icon: Plug, key: "connections", fallback: "État des connexions, services disponibles et éventuels points de vigilance." },
  notifications: { title: "Bilan notifications Angel OS IA", icon: Bell, key: "notifications", fallback: "Tri des notifications importantes, urgentes et secondaires." },
  automation: { title: "Bilan automatisations Angel OS IA", icon: Sparkles, key: "automation", fallback: "État des automatisations actives, dernières exécutions, éventuels incidents et tâches à ajuster." },
  subscribers: { title: "Bilan abonnés Angel OS IA", icon: Users, key: "subscribers", fallback: "Évolution des abonnés, activité récente et actions pertinentes pour la newsletter ou la communauté." },
  shop: { title: "Bilan boutique Angel OS IA", icon: ShoppingBag, key: "shop", fallback: "Point sur la boutique, commandes, éléments à traiter et prochaines actions." },
  feedback: { title: "Bilan avis Angel OS IA", icon: MessageSquare, key: "feedback", fallback: "Synthèse des avis et retours récents, avec les points utiles à retenir ou corriger." },
  ai: { title: "Bilan Angel IA", icon: Sparkles, key: "ai", fallback: "Synthèse des actions IA disponibles, suggestions utiles et priorités du moment." },
};

export function AdminAutomationSummary({ mode = "dashboard" }: { mode?: SummaryMode }) {
  const [detectedMode, setDetectedMode] = useState<SummaryMode>(mode);
  useEffect(() => {
    if (mode !== "dashboard") return setDetectedMode(mode);
    const title = document.querySelector("h1")?.textContent ?? "";
    setDetectedMode(detectMode(title));
  });

  const effectiveMode = mode === "dashboard" ? detectedMode : mode;
  const { data = {}, isLoading } = useQuery({ queryKey: ["admin-automation-summaries"], queryFn: loadSummaries, refetchInterval: 5 * 60 * 1000 });
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({ queryKey: ["admin-application-summary"], queryFn: loadApplications, refetchInterval: 5 * 60 * 1000, enabled: effectiveMode === "applications" || effectiveMode === "dashboard" });

  if (isLoading || ((effectiveMode === "applications" || effectiveMode === "dashboard") && applicationsLoading)) return <p className="text-sm text-muted-foreground">Chargement du bilan Angel OS…</p>;

  const gmail = data.gmail_dashboard?.payload;
  const cockpit = data.admin_cockpit_summary?.payload;
  const news = data.news_dashboard?.payload;
  const calendar = data.google_calendar_dashboard?.payload;

  if (effectiveMode === "applications") {
    return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><p className="flex items-center gap-2 font-semibold text-foreground"><Inbox className="h-5 w-5 text-primary" />Bilan candidatures Angel OS IA</p><p className="mt-2 text-sm text-muted-foreground">Ici, le bilan se concentre uniquement sur l’historique, les dossiers actifs, les relances et les prochaines candidatures.</p><ApplicationsSummary applications={applications} /></section>;
  }

  if (effectiveMode !== "dashboard") {
    const config = pageConfig[effectiveMode];
    const value = effectiveMode === "mail" ? (gmail?.summary ?? gmail?.otherSummary ?? cockpit?.gmail) : effectiveMode === "agenda" ? (calendar?.summary ?? calendar ?? cockpit?.agenda) : cockpit?.[config.key];
    const Icon = config.icon;
    return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8def8] text-[#594b66]"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">{config.title}</p><p className="mt-1 text-xs text-muted-foreground">Bilan contextualisé pour cette page, sans recopier le résumé général de l’accueil.</p><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground/90 sm:text-base">{readable(value, config.fallback)}</p></div></div></section>;
  }

  const activeApplications = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? "")).length;
  const importantMail = gmail?.important?.length ?? cockpit?.gmail?.important ?? 0;
  const newsCount = Array.isArray(news?.items) ? news.items.length : 0;
  const fallbackText = `Vue d’ensemble du moment : ${applications.length} candidature${applications.length > 1 ? "s" : ""}, dont ${activeApplications} encore active${activeApplications > 1 ? "s" : ""}. ${importantMail > 0 ? `${importantMail} mail${importantMail > 1 ? "s" : ""} important${importantMail > 1 ? "s" : ""} demandent ton attention. ` : "Aucun mail important n’est signalé. "}${newsCount > 0 ? `La veille actualité contient ${newsCount} élément${newsCount > 1 ? "s" : ""} récent${newsCount > 1 ? "s" : ""}. ` : ""}L’accueil reste volontairement transversal ; chaque autre page possède désormais son propre bilan spécialisé.`;
  const generalText = (typeof cockpit?.generalText === "string" && cockpit.generalText.trim()) || (typeof cockpit?.summary === "string" && cockpit.summary.trim()) || fallbackText;

  return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8def8] text-[#594b66]"><Sparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">Bilan général Angel OS IA</p><p className="mt-1 text-xs text-muted-foreground">Vue d’ensemble réservée à l’accueil.</p><p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground/90 sm:text-base">{generalText}</p>{data.admin_cockpit_summary?.updated_at && <p className="mt-3 text-xs text-muted-foreground">Mis à jour {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.admin_cockpit_summary.updated_at))}</p>}</div></div></section>;
}
