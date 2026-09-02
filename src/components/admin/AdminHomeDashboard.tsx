import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  ListTodo,
  MessageSquareText,
  NotebookPen,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { listGoogleCalendarEvents } from "@/lib/google-workspace.functions";
import { AdminCard } from "./AdminShell";

type DashboardProps = {
  onNavigate: (key: string) => void;
};

type Memo = {
  id: string;
  text: string;
  createdAt: string;
};

type ProjectRow = {
  id: string;
  title: string;
  status?: string | null;
  due_date?: string | null;
  client_name?: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  status?: string | null;
  due_date?: string | null;
};

type MessageRow = {
  id: string;
  full_name?: string | null;
  project_type?: string | null;
  created_at?: string | null;
  is_read?: boolean | null;
};

type ArticleRow = {
  id: string;
  title: string;
  updated_at?: string | null;
  published?: boolean | null;
};

const anyDb = supabase as unknown as { from: (table: string) => any };
const MEMO_KEY = "flamme-os-quick-memos";

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

async function loadDashboardData() {
  const [articles, messages, projects, tasks, subscribers] = await Promise.allSettled([
    supabase.from("articles").select("id,title,updated_at,published").order("updated_at", { ascending: false }).limit(6),
    supabase.from("contact_requests").select("id,full_name,project_type,created_at,is_read").order("created_at", { ascending: false }).limit(6),
    anyDb.from("projects").select("id,title,status,due_date,client_name").order("due_date", { ascending: true }).limit(24),
    anyDb.from("project_tasks").select("id,title,status,due_date").order("due_date", { ascending: true }).limit(60),
    supabase.from("blog_subscribers").select("id", { count: "exact", head: true }),
  ]);

  const unwrap = <T,>(result: PromiseSettledResult<any>): T[] => {
    if (result.status !== "fulfilled" || result.value?.error) return [];
    return (result.value?.data ?? []) as T[];
  };

  return {
    articles: unwrap<ArticleRow>(articles),
    messages: unwrap<MessageRow>(messages),
    projects: unwrap<ProjectRow>(projects),
    tasks: unwrap<TaskRow>(tasks),
    subscriberCount:
      subscribers.status === "fulfilled" && !subscribers.value?.error
        ? Number(subscribers.value?.count ?? 0)
        : 0,
  };
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <span className="font-display text-2xl font-bold tracking-[-.04em] text-foreground">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export function AdminHomeDashboard({ onNavigate }: DashboardProps) {
  const loadGoogleCalendar = useServerFn(listGoogleCalendarEvents);
  const [memoText, setMemoText] = useState("");
  const [memos, setMemos] = useState<Memo[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MEMO_KEY);
      if (stored) setMemos(JSON.parse(stored));
    } catch {
      setMemos([]);
    }
  }, []);

  const persistMemos = (next: Memo[]) => {
    setMemos(next);
    try { window.localStorage.setItem(MEMO_KEY, JSON.stringify(next)); } catch { /* local-only convenience */ }
  };

  const dashboardQuery = useQuery({
    queryKey: ["flamme-os", "home-dashboard", "v2"],
    queryFn: loadDashboardData,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const calendarQuery = useQuery({
    queryKey: ["flamme-os", "home-calendar", "v2"],
    queryFn: async () => {
      try {
        return { connected: true, events: await loadGoogleCalendar() };
      } catch (error) {
        return { connected: false, events: [], error: error instanceof Error ? error.message : "Google Calendar indisponible" };
      }
    },
    staleTime: 30_000,
    retry: false,
  });

  const data = dashboardQuery.data ?? { articles: [], messages: [], projects: [], tasks: [], subscriberCount: 0 };
  const now = Date.now();
  const upcomingEvents = (calendarQuery.data?.events ?? [])
    .filter((event) => new Date(event.start).getTime() >= now - 60 * 60 * 1000)
    .slice(0, 6);

  const openTasks = data.tasks.filter((task) => task.status !== "termine");
  const activeProjects = data.projects.filter((project) => project.status !== "termine");
  const unreadMessages = data.messages.filter((message) => !message.is_read);

  const taskColumns = useMemo(() => [
    { key: "a_faire", label: "À faire", rows: data.tasks.filter((task) => !task.status || task.status === "a_faire") },
    { key: "en_cours", label: "En cours", rows: data.tasks.filter((task) => task.status === "en_cours") },
    { key: "termine", label: "Terminé", rows: data.tasks.filter((task) => task.status === "termine") },
  ], [data.tasks]);

  const addMemo = () => {
    const text = memoText.trim();
    if (!text) return;
    const next = [{ id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }, ...memos].slice(0, 20);
    persistMemos(next);
    setMemoText("");
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_.8fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex items-center gap-3">
              <img src="/flamme-os/logo.svg" alt="Flamme OS" className="h-9 w-auto max-w-[10rem] object-contain object-left" />
            </div>
            <p className="mt-7 text-sm font-semibold text-primary">{greeting()}</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-[-.05em] text-foreground sm:text-4xl">Voici ce qui demande ton attention.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Agenda, tâches, projets, messages et notes rapides réunis au même endroit. Pas de modules scolaires ni d’IA envahissante : uniquement les outils utiles au quotidien.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => onNavigate("agenda")}><CalendarDays className="mr-2 h-4 w-4" />Ouvrir l’agenda</Button>
              <Button variant="outline" onClick={() => onNavigate("projets")}><ListTodo className="mr-2 h-4 w-4" />Tâches & projets</Button>
              <Button variant="outline" onClick={() => onNavigate("boite-mail")}><Inbox className="mr-2 h-4 w-4" />Mail</Button>
            </div>
          </div>
          <div className="border-t border-border bg-primary/[.04] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Aujourd’hui</p>
            <div className="mt-4 space-y-3">
              {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 3).map((event) => (
                <button key={event.id} onClick={() => onNavigate("agenda")} className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/35">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Clock3 className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{event.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{formatShortDate(event.start)} · {formatTime(event.start)}</span></span>
                </button>
              )) : (
                <button onClick={() => onNavigate(calendarQuery.data?.connected === false ? "connexions" : "agenda")} className="w-full rounded-2xl border border-dashed border-border bg-card/70 p-5 text-left">
                  <p className="text-sm font-semibold text-foreground">{calendarQuery.data?.connected === false ? "Google Agenda n’est pas relié" : "Aucun rendez-vous à venir"}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{calendarQuery.data?.connected === false ? "Ouvre Connexions pour rétablir la synchronisation." : "Ton agenda est libre pour le moment."}</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={CalendarDays} label="Événements" value={upcomingEvents.length} detail="Rendez-vous Google à venir" />
        <Metric icon={ListTodo} label="Tâches ouvertes" value={openTasks.length} detail="À faire ou en cours" />
        <Metric icon={MessageSquareText} label="Messages non lus" value={unreadMessages.length} detail="Demandes reçues via le site" />
        <Metric icon={Users} label="Abonnés" value={data.subscriberCount} detail="Contacts inscrits aux publications" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <AdminCard title="Planning" description="Les prochains éléments réellement synchronisés avec Google Calendar.">
          <div className="space-y-2">
            {upcomingEvents.length ? upcomingEvents.map((event) => (
              <button key={event.id} onClick={() => onNavigate("agenda")} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/30 hover:bg-muted/40">
                <div className="w-14 shrink-0 text-center"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{new Date(event.start).toLocaleDateString("fr-FR", { weekday: "short" })}</p><p className="font-display text-xl font-bold text-foreground">{new Date(event.start).getDate()}</p></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{event.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{formatTime(event.start)}{event.location ? ` · ${event.location}` : ""}</p></div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            )) : <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Aucun événement synchronisé à afficher.</p>}
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate("agenda")}>Voir le planning complet</Button>
        </AdminCard>

        <AdminCard title="Note rapide" description="Inspiré de Memos : écrire d’abord, classer seulement si nécessaire.">
          <Textarea value={memoText} onChange={(event) => setMemoText(event.target.value)} placeholder="Une idée, un rappel, quelque chose à ne pas oublier…" className="min-h-28 resize-none" onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") addMemo(); }} />
          <div className="mt-3 flex items-center justify-between gap-3"><p className="text-[11px] text-muted-foreground">Ctrl/⌘ + Entrée pour enregistrer</p><Button size="sm" onClick={addMemo} disabled={!memoText.trim()}><Plus className="mr-1.5 h-4 w-4" />Ajouter</Button></div>
          {memos.length > 0 ? <div className="mt-4 space-y-2 border-t border-border pt-4">{memos.slice(0, 4).map((memo) => <div key={memo.id} className="group rounded-xl border border-border bg-background p-3"><p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{memo.text}</p><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{new Date(memo.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span><button onClick={() => persistMemos(memos.filter((item) => item.id !== memo.id))} className="text-[10px] font-semibold text-muted-foreground opacity-60 hover:text-foreground group-hover:opacity-100">Supprimer</button></div></div>)}</div> : null}
        </AdminCard>
      </div>

      <AdminCard title="Tâches" description="Une lecture rapide façon Kanban, sans transformer l’admin en usine à gaz.">
        <div className="grid gap-3 lg:grid-cols-3">
          {taskColumns.map((column) => (
            <section key={column.key} className="rounded-2xl border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-foreground">{column.label}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{column.rows.length}</span></div>
              <div className="mt-3 space-y-2">{column.rows.slice(0, 4).map((task) => <button key={task.id} onClick={() => onNavigate("projets")} className="w-full rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/30"><p className="text-sm font-medium text-foreground">{task.title}</p>{task.due_date ? <p className="mt-1 text-[11px] text-muted-foreground">Échéance {formatShortDate(task.due_date)}</p> : null}</button>)}{column.rows.length === 0 ? <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Rien ici.</p> : null}</div>
            </section>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate("projets")}>Gérer les tâches et projets</Button>
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard title="Projets actifs" description={`${activeProjects.length} projet${activeProjects.length > 1 ? "s" : ""} encore ouvert${activeProjects.length > 1 ? "s" : ""}.`}>
          <div className="space-y-2">{activeProjects.slice(0, 5).map((project) => <button key={project.id} onClick={() => onNavigate("projets")} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{project.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{project.client_name || "Projet personnel"}{project.due_date ? ` · ${formatShortDate(project.due_date)}` : ""}</span></span></button>)}{activeProjects.length === 0 ? <p className="text-sm text-muted-foreground">Aucun projet actif.</p> : null}</div>
        </AdminCard>

        <AdminCard title="Flux récent" description="Les derniers éléments utiles, dans une logique de timeline.">
          <div className="space-y-3">
            {data.messages.slice(0, 3).map((message) => <button key={message.id} onClick={() => onNavigate("messages")} className="flex w-full gap-3 text-left"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Inbox className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{message.full_name || "Nouveau message"}</span><span className="block truncate text-xs text-muted-foreground">{message.project_type || "Message reçu"}</span></span></button>)}
            {data.articles.slice(0, 3).map((article) => <button key={article.id} onClick={() => onNavigate("articles")} className="flex w-full gap-3 text-left"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><FileText className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{article.title}</span><span className="block text-xs text-muted-foreground">Article {article.published ? "publié" : "en préparation"}</span></span></button>)}
            {data.messages.length === 0 && data.articles.length === 0 ? <p className="text-sm text-muted-foreground">Pas encore d’activité récente.</p> : null}
          </div>
        </AdminCard>
      </div>

      <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => { dashboardQuery.refetch(); calendarQuery.refetch(); }}><RefreshCw className={`mr-2 h-4 w-4 ${dashboardQuery.isFetching || calendarQuery.isFetching ? "animate-spin" : ""}`} />Actualiser le cockpit</Button></div>
    </div>
  );
}
