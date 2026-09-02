import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ANGEL_NAVIGATION_TARGETS,
  searchNavigationTargets,
  type AngelNavigationTarget,
} from "@/lib/angel-os-ia/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const anyDb = supabase as unknown as { from: (t: string) => any };
type Hit = { id: string; label: string; detail: string; group: string; tab: string };

const SOURCES = [
  { table: "articles", select: "id,title,category,slug", group: "Article", tab: "articles", label: (r: any) => r.title, detail: (r: any) => r.category ?? "" },
  { table: "projects", select: "id,title,client_name", group: "Projet", tab: "projets", label: (r: any) => r.title, detail: (r: any) => r.client_name ?? "" },
  { table: "project_tasks", select: "id,title,status", group: "Tâche", tab: "projets", label: (r: any) => r.title, detail: (r: any) => r.status ?? "" },
  { table: "contacts_sources", select: "id,last_name,first_name,organization", group: "Contact", tab: "studio", label: (r: any) => [r.first_name, r.last_name].filter(Boolean).join(" "), detail: (r: any) => r.organization ?? "" },
  { table: "reportages", select: "id,title,location", group: "Reportage", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.location ?? "" },
  { table: "interviews", select: "id,title,person", group: "Interview", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.person ?? "" },
  { table: "investigations", select: "id,title,summary", group: "Enquête", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.summary ?? "" },
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function loadIndex(): Promise<Hit[]> {
  const results = await Promise.all(SOURCES.map(async (source) => {
    const { data } = await anyDb.from(source.table).select(source.select).limit(200);
    return ((data ?? []) as any[]).map((row) => ({
      id: `${source.table}-${row.id}`,
      label: source.label(row) || "Sans titre",
      detail: source.detail(row),
      group: source.group,
      tab: source.tab,
    }));
  }));
  return results.flat();
}

function contentScore(query: string, hit: Hit) {
  const q = normalize(query.trim());
  const label = normalize(hit.label);
  const detail = normalize(`${hit.detail} ${hit.group}`);
  if (label === q) return 100;
  if (label.startsWith(q)) return 88;
  if (label.includes(q)) return 78;
  const words = q.split(/\s+/).filter((word) => word.length > 1);
  const haystack = `${label} ${detail}`;
  const matched = words.filter((word) => haystack.includes(word)).length;
  return matched ? Math.round((matched / Math.max(words.length, 1)) * 65) : 0;
}

function dedupe(items: Hit[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.tab}:${normalize(item.label)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function GlobalSearch({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (tab: string) => void }) {
  const [query, setQuery] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["flamme-os", "search-index", "v3"],
    queryFn: loadIndex,
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const trimmed = query.trim();
  const pageResults = useMemo(
    () => trimmed.length >= 1
      ? searchNavigationTargets(trimmed, 10)
      : ANGEL_NAVIGATION_TARGETS.filter((target) => target.group === "Page").slice(0, 8).map((target) => ({ target, score: 0 })),
    [trimmed],
  );

  const contentResults = useMemo(() => {
    if (trimmed.length < 2) return [];
    return dedupe(data
      .map((hit) => ({ hit, score: contentScore(trimmed, hit) }))
      .filter((item) => item.score >= 35)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.hit)).slice(0, 12);
  }, [data, trimmed]);

  const navigateThroughCore = (target: Pick<AngelNavigationTarget, "tab" | "anchor">) => {
    if (target.anchor) sessionStorage.setItem("angel-os-navigation-anchor", target.anchor);
    else sessionStorage.removeItem("angel-os-navigation-anchor");
    onNavigate(target.tab);
    onClose();
    if (target.anchor) window.setTimeout(() => {
      const element = document.getElementById(`angel-section-${target.anchor}`) ?? document.querySelector(`[data-angel-section="${target.anchor}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  const navigateTab = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex h-[100dvh] items-start justify-center overflow-hidden bg-black/45 px-2 pt-[calc(env(safe-area-inset-top)+.5rem)] backdrop-blur-sm sm:px-4 sm:pt-[min(8vh,4rem)]" role="dialog" aria-modal="true" aria-label="Recherche Flamme OS" onClick={onClose}>
      <div className="flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card text-foreground shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Search className="h-4 w-4" /></span>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une page, un projet, une tâche, un article…"
            className="h-12 min-w-0 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
            aria-label="Recherche Flamme OS"
          />
          <Button variant="ghost" size="sm" className="min-h-11 min-w-11 rounded-xl" aria-label="Fermer" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Indexation de Flamme OS…</p> : null}

          {pageResults.length > 0 ? <section className="mb-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Pages et outils</p>
            <ul className="space-y-1">
              {pageResults.map(({ target }) => <li key={`${target.tab}-${target.label}`}>
                <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted" onClick={() => navigateThroughCore(target)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-primary"><Search className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block font-medium text-foreground">{target.label}</span><span className="block truncate text-xs text-muted-foreground">{target.detail}</span></span>
                </button>
              </li>)}
            </ul>
          </section> : null}

          {contentResults.length > 0 ? <section>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Contenus et données</p>
            <ul className="space-y-1">
              {contentResults.map((hit) => <li key={hit.id}>
                <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted" onClick={() => navigateTab(hit.tab)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground"><FileText className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate font-medium text-foreground">{hit.label}</span><span className="block truncate text-xs text-muted-foreground">{hit.group}{hit.detail ? ` · ${hit.detail}` : ""}</span></span>
                </button>
              </li>)}
            </ul>
          </section> : null}

          {!trimmed && !isLoading ? <p className="px-3 py-3 text-sm leading-relaxed text-muted-foreground">Recherche rapide dans les pages, projets, tâches, articles et outils de Flamme OS.</p> : null}
          {trimmed.length >= 2 && pageResults.length === 0 && contentResults.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Aucun résultat pour « {trimmed} ».</p> : null}
        </div>
      </div>
    </div>
  );
}
