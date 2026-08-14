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

function readable(value: any, fallback = "Rien de nouveau pour le moment.") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value.summary === "string") return value.summary;
  return Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .map(([key, item]) => `${key.replace(/_/g, " ")} : ${String(item)}`)
    .join(" · ") || fallback;
}

function simpleShortSummary(value: any, fallback: string) {
  const raw = readable(value, fallback)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  if (!raw) return fallback;

  const sentences = raw.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()).filter(Boolean) ?? [raw];
  const firstTwo = sentences.slice(0, 2).join(" ");
  if (firstTwo.length <= 190) return firstTwo;

  const first = sentences[0] ?? raw;
  if (first.length <= 190) return first;

  const cut = first.slice(0, 187);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : 187).trim()}…`;
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
  if (applications.length === 0) return <p className="mt-2 text-sm text-muted-foreground">Aucune candidature pour le moment.</p>;
  const today = new Date().toISOString().slice(0, 10);
  const rejected = applications.filter((app) => app.status === "refusee");
  const active = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? ""));
  const due = active.filter((app) => app.follow_up_at && app.follow_up_at <= today);
  const future = active.filter((app) => app.follow_up_at && app.follow_up_at > today).sort((a, b) => (a.follow_up_at ?? "").localeCompare(b.follow_up_at ?? ""));
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passé</p><p className="mt-2 text-sm"><strong>{applications.length}</strong> candidature(s), dont <strong>{rejected.length}</strong> refus.</p></div>
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenant</p><p className="mt-2 text-sm"><strong>{active.length}</strong> dossier(s) actif(s). {due.length > 0 ? `${due.length} relance(s) à faire.` : "Pas de relance urgente."}</p></div>
      <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Après</p><p className="mt-2 text-sm">{future.length > 0 ? `Prochaine relance : ${applicationLabel(future[0])}, le ${formatShortDate(future[0].follow_up_at)}.` : "Continuer les candidatures et les relances utiles."}</p></div>
    </div>
  );
}

const pageConfig: Record<Exclude<SummaryMode, "dashboard" | "applications">, { title: string; icon: any; key: string; fallback: string }> = {
  mail: { title: "Bilan mails", icon: Mail, key: "gmail", fallback: "Regarde les mails importants et les réponses à faire." },
  messages: { title: "Bilan messages", icon: MessageSquare, key: "messages", fallback: "Regarde les messages récents et ceux qui demandent une réponse." },
  stats: { title: "Bilan statistiques", icon: TrendingUp, key: "stats", fallback: "Regarde les chiffres qui ont vraiment changé." },
  publications: { title: "Bilan publications", icon: FileText, key: "publications", fallback: "Regarde les brouillons, les publications et ce qu’il reste à faire." },
  agenda: { title: "Bilan agenda", icon: CalendarDays, key: "agenda", fallback: "Regarde le prochain rendez-vous et ce qu’il faut préparer." },
  projects: { title: "Bilan projets", icon: FolderKanban, key: "projects", fallback: "Regarde le projet prioritaire et la prochaine étape." },
  files: { title: "Bilan fichiers", icon: FileText, key: "files", fallback: "Regarde les fichiers récents ou importants." },
  studio: { title: "Bilan studio", icon: WandSparkles, key: "studio", fallback: "Regarde ce qu’il faut finir ou publier." },
  activity: { title: "Bilan activité", icon: Activity, key: "activity", fallback: "Voici les derniers changements utiles dans Angel OS." },
  connections: { title: "Bilan connexions", icon: Plug, key: "connections", fallback: "Vérifie les services connectés et les erreurs éventuelles." },
  notifications: { title: "Bilan notifications", icon: Bell, key: "notifications", fallback: "Regarde seulement les alertes importantes." },
  automation: { title: "Bilan automatisations", icon: Sparkles, key: "automation", fallback: "Vérifie les tâches actives et les erreurs." },
  subscribers: { title: "Bilan communauté", icon: Users, key: "subscribers", fallback: "Regarde les nouveaux abonnés et les changements utiles." },
  shop: { title: "Bilan boutique", icon: ShoppingBag, key: "shop", fallback: "Regarde les commandes et les actions à faire." },
  feedback: { title: "Bilan avis", icon: MessageSquare, key: "feedback", fallback: "Regarde les derniers avis et ce qu’il faut corriger." },
  ai: { title: "Bilan Angel IA", icon: Sparkles, key: "ai", fallback: "Voici l’action IA la plus utile maintenant." },
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

  if (isLoading || ((effectiveMode === "applications" || effectiveMode === "dashboard") && applicationsLoading)) return <p className="text-sm text-muted-foreground">Chargement du bilan…</p>;

  const gmail = data.gmail_dashboard?.payload;
  const cockpit = data.admin_cockpit_summary?.payload;
  const news = data.news_dashboard?.payload;
  const calendar = data.google_calendar_dashboard?.payload;

  if (effectiveMode === "applications") {
    return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><p className="flex items-center gap-2 font-semibold text-foreground"><Inbox className="h-5 w-5 text-primary" />Bilan candidatures</p><p className="mt-2 text-sm text-muted-foreground">Le point rapide sur les candidatures.</p><ApplicationsSummary applications={applications} /></section>;
  }

  if (effectiveMode !== "dashboard") {
    const config = pageConfig[effectiveMode];
    const value = effectiveMode === "mail" ? (gmail?.summary ?? gmail?.otherSummary ?? cockpit?.gmail) : effectiveMode === "agenda" ? (calendar?.summary ?? calendar ?? cockpit?.agenda) : cockpit?.[config.key];
    const Icon = config.icon;
    const summary = simpleShortSummary(value, config.fallback);
    return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8def8] text-[#594b66]"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">{config.title}</p><p className="mt-2 text-[15px] leading-6 text-foreground/90 sm:text-base">{summary}</p></div></div></section>;
  }

  const activeApplications = applications.filter((app) => !["refusee", "acceptee", "acceptée"].includes(app.status ?? "")).length;
  const importantMail = gmail?.important?.length ?? cockpit?.gmail?.important ?? 0;
  const newsCount = Array.isArray(news?.items) ? news.items.length : 0;
  const fallbackText = `${activeApplications} candidature${activeApplications > 1 ? "s" : ""} active${activeApplications > 1 ? "s" : ""}. ${importantMail > 0 ? `${importantMail} mail${importantMail > 1 ? "s" : ""} important${importantMail > 1 ? "s" : ""} à voir.` : "Pas de mail urgent."}${newsCount > 0 ? ` ${newsCount} actu${newsCount > 1 ? "s" : ""} récente${newsCount > 1 ? "s" : ""}.` : ""}`;
  const sourceText = (typeof cockpit?.generalText === "string" && cockpit.generalText.trim()) || (typeof cockpit?.summary === "string" && cockpit.summary.trim()) || fallbackText;
  const generalText = simpleShortSummary(sourceText, fallbackText);

  return <section className="mb-5 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8def8] text-[#594b66]"><Sparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-foreground">Bilan général</p><p className="mt-2 text-[15px] leading-6 text-foreground/90 sm:text-base">{generalText}</p>{data.admin_cockpit_summary?.updated_at && <p className="mt-3 text-xs text-muted-foreground">Mis à jour {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.admin_cockpit_summary.updated_at))}</p>}</div></div></section>;
}
