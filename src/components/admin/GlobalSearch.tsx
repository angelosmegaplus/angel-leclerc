import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  FileText,
  FolderOpen,
  History,
  Home,
  Loader2,
  Mail,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Users,
  WandSparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emitAngelOSEvent } from "@/lib/angel-os-runtime";
import { runAngelCommand } from "@/lib/angel-command.functions";
import { isArticleCommand, runArticleCommand } from "@/lib/article-command.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const anyDb = supabase as unknown as { from: (t: string) => any };

type Hit = { id: string; label: string; detail: string; group: string; tab: string };
type Shortcut = { label: string; detail: string; tab: string; aliases: string; icon: LucideIcon; alert?: boolean };

// La recherche universelle expose uniquement les vraies destinations de premier niveau.
// Agenda reste intégré au tableau de bord et les articles passent tous par Studio.
const BASE_SHORTCUTS: Shortcut[] = [
  { label: "Accueil", detail: "Vue d'ensemble Angel OS", tab: "dashboard", aliases: "home tableau bord agenda calendrier rendez vous prochain rdv", icon: Home },
  { label: "Mail", detail: "Messages et boîte mail", tab: "boite-mail", aliases: "email gmail messages boite mail", icon: Mail },
  { label: "Fichiers", detail: "Documents et fichiers", tab: "fichiers", aliases: "drive documents stockage", icon: FolderOpen },
  { label: "Studio", detail: "Articles, création, audio et production", tab: "studio", aliases: "article articles blog actu actualites publication contenus radio micro creation reportage agenda calendrier", icon: WandSparkles },
  { label: "Candidatures", detail: "Alternance et suivi des candidatures", tab: "candidatures", aliases: "emploi alternance recrutement", icon: BriefcaseBusiness },
  { label: "Communauté", detail: "Abonnés, avis et contacts", tab: "abonnes", aliases: "contacts avis soutiens abonnes communauté", icon: Users },
  { label: "Paramètres", detail: "Connexions et système", tab: "connexions", aliases: "settings reglages notifications connexions", icon: Settings },
  { label: "Notifications", detail: "Alertes Angel OS", tab: "notifications", aliases: "alertes", icon: Bell },
  { label: "Historique", detail: "Journal d'activité", tab: "activite", aliases: "activité journal logs", icon: History },
  { label: "Automatisations", detail: "Tâches et exécutions planifiées", tab: "automatisation", aliases: "taches planifiees cron", icon: SlidersHorizontal },
  { label: "Avis", detail: "Avis et soutiens", tab: "avis", aliases: "soutiens commentaires", icon: Star },
  { label: "Services", detail: "Parcours et services publiés", tab: "contenus", aliases: "parcours contenu site", icon: FileText },
  { label: "Boutique", detail: "Gestion de la boutique", tab: "boutique", aliases: "shop commandes", icon: Store },
  { label: "Statistiques", detail: "Mesures et audience", tab: "stats", aliases: "stats analytics", icon: Sparkles },
  { label: "Projets", detail: "Gestion des projets", tab: "projets", aliases: "project", icon: BriefcaseBusiness },
];

const SOURCES: {
  table: string;
  select: string;
  group: string;
  tab: string;
  label: (r: any) => string;
  detail: (r: any) => string;
}[] = [
  { table: "articles", select: "id,title,category,slug", group: "Studio · Article", tab: "studio", label: (r) => r.title, detail: (r) => r.category ?? "" },
  { table: "projects", select: "id,title,client_name", group: "Projets", tab: "projets", label: (r) => r.title, detail: (r) => r.client_name ?? "" },
  { table: "applications", select: "id,company,position,city", group: "Candidatures", tab: "candidatures", label: (r) => r.company, detail: (r) => [r.position, r.city].filter(Boolean).join(" · ") },
  { table: "contacts_sources", select: "id,last_name,first_name,organization", group: "Studio · Contact", tab: "studio", label: (r) => [r.first_name, r.last_name].filter(Boolean).join(" "), detail: (r) => r.organization ?? "" },
  { table: "reportages", select: "id,title,location", group: "Studio · Reportage", tab: "studio", label: (r) => r.title, detail: (r) => r.location ?? "" },
  { table: "interviews", select: "id,title,person", group: "Studio · Interview", tab: "studio", label: (r) => r.title, detail: (r) => r.person ?? "" },
  { table: "investigations", select: "id,title,summary", group: "Studio · Enquête", tab: "studio", label: (r) => r.title, detail: (r) => r.summary ?? "" },
  { table: "press_review", select: "id,title,source", group: "Studio · Revue de presse", tab: "studio", label: (r) => r.title, detail: (r) => r.source ?? "" },
];

async function loadIndex(): Promise<Hit[]> {
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      const { data } = await anyDb.from(s.table).select(s.select).limit(200);
      return ((data ?? []) as any[]).map((r) => ({
        id: `${s.table}-${r.id}`,
        label: s.label(r) || "Sans titre",
        detail: s.detail(r),
        group: s.group,
        tab: s.tab,
      }));
    }),
  );
  return results.flat();
}

async function loadNotificationCount(): Promise<number> {
  const { data } = await anyDb.from("notifications").select("id").order("created_at", { ascending: false }).limit(20);
  return Array.isArray(data) ? data.length : 0;
}

function dedupeHits(items: Hit[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.tab}:${item.label.trim().toLocaleLowerCase("fr")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function GlobalSearch({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (tab: string) => void }) {
  const [query, setQuery] = useState("");
  const execute = useServerFn(runAngelCommand);
  const executeArticle = useServerFn(runArticleCommand);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["angel", "search-index"], queryFn: loadIndex, enabled: open });
  const { data: notificationCount = 0 } = useQuery({ queryKey: ["angel", "search-notifications"], queryFn: loadNotificationCount, enabled: open, staleTime: 60_000 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const q = query.trim().toLocaleLowerCase("fr");
  const hits = useMemo(() => {
    if (q.length < 2) return [];
    const filtered = data.filter((h) => `${h.label} ${h.detail} ${h.group}`.toLocaleLowerCase("fr").includes(q));
    return dedupeHits(filtered).slice(0, 16);
  }, [data, q]);

  const shortcuts = useMemo(() => {
    const enriched = BASE_SHORTCUTS.map((s) => ({ ...s, alert: notificationCount > 0 && (s.tab === "connexions" || s.tab === "notifications") }));
    const filtered = q.length < 2
      ? enriched.slice(0, 8)
      : enriched.filter((s) => `${s.label} ${s.detail} ${s.aliases}`.toLocaleLowerCase("fr").includes(q));
    const seen = new Set<string>();
    return filtered.filter((s) => {
      if (seen.has(s.tab)) return false;
      seen.add(s.tab);
      return true;
    }).slice(0, 8);
  }, [q, notificationCount]);

  const navigateThroughCore = (tab: string, label: string) => {
    void emitAngelOSEvent("angel-os:admin:navigation", { tab, label }).catch(() => {});
    onNavigate(tab);
    onClose();
  };

  const ai = useMutation({
    mutationFn: (value: string) => isArticleCommand(value) ? executeArticle({ data: { command: value } }) : execute({ data: { command: value } }),
    onSuccess: (result) => {
      void emitAngelOSEvent("angel-os:ai:command-completed", {
        query: query.trim().slice(0, 500),
        status: "status" in result ? result.status : "completed",
        source: "source" in result ? result.source : "article-command",
        autoExecuted: "autoExecuted" in result ? result.autoExecuted : true,
        actionId: "actionId" in result ? result.actionId : null,
      }).catch(() => {});
      toast.success("Demande envoyée à Angel AI");
      void queryClient.invalidateQueries({ queryKey: ["angel-ai-messages"] });
      void queryClient.invalidateQueries({ queryKey: ["ai-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["angel"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!open) return null;
  const canAskAi = query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 p-3 sm:p-10" role="dialog" aria-modal="true" aria-label="Recherche et commandes Angel OS" onClick={onClose}>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && canAskAi && hits.length === 0 && shortcuts.length === 0) ai.mutate(query.trim()); }} placeholder="Rechercher ou demander à Angel AI…" className="h-12 border-0 text-base shadow-none focus-visible:ring-0" aria-label="Rechercher ou demander à Angel AI" />
          <Button variant="ghost" size="sm" className="min-h-11 min-w-11" aria-label="Fermer" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">
          {isLoading && <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Indexation…</p>}

          {shortcuts.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Applications</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {shortcuts.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button key={s.tab} type="button" className="group flex items-center gap-3 rounded-2xl bg-muted/60 px-3.5 py-3 text-left transition-colors hover:bg-muted" onClick={() => navigateThroughCore(s.tab, s.label)}>
                      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-background text-primary shadow-sm">
                        <Icon className="h-5 w-5" />
                        {s.alert ? <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-white shadow"><Bell className="h-3 w-3" /></span> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{s.label}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{s.detail}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {hits.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Résultats</p>
              <ul className="space-y-1">
                {hits.map((h) => (
                  <li key={h.id}><button type="button" className="flex min-h-12 w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-muted" onClick={() => navigateThroughCore(h.tab, h.label)}><span className="font-medium text-foreground">{h.label}</span><span className="text-xs text-muted-foreground">{h.group}{h.detail ? ` · ${h.detail}` : ""}</span></button></li>
                ))}
              </ul>
            </section>
          )}

          {canAskAi && (
            <button type="button" disabled={ai.isPending} onClick={() => ai.mutate(query.trim())} className="flex w-full items-center gap-3 rounded-2xl bg-[#d3e3fd] p-4 text-left text-[#0b57d0] transition-transform active:scale-[0.99] disabled:opacity-60">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/70">{ai.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Demander à Angel AI</span><span className="mt-0.5 block truncate text-xs opacity-80">« {query.trim()} »</span></span>
              <Send className="h-4 w-4 shrink-0" />
            </button>
          )}

          {!canAskAi && !isLoading && <p className="px-3 py-2 text-sm text-muted-foreground">Tape un nom, une fonction, une question ou une action à effectuer.</p>}
        </div>
      </div>
    </div>
  );
}
