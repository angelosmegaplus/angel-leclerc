import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, FileText, Loader2, Search, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emitAngelOSEvent } from "@/lib/angel-os-runtime";
import { runPrivateAngelOsIaChat } from "@/lib/angel-os-ia/private-chat.functions";
import {
  ANGEL_NAVIGATION_TARGETS,
  looksLikeNaturalLanguage,
  resolveNavigationIntent,
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
  { table: "applications", select: "id,company,position,city", group: "Candidature", tab: "candidatures", label: (r: any) => r.company, detail: (r: any) => [r.position, r.city].filter(Boolean).join(" · ") },
  { table: "contacts_sources", select: "id,last_name,first_name,organization", group: "Contact studio", tab: "studio", label: (r: any) => [r.first_name, r.last_name].filter(Boolean).join(" "), detail: (r: any) => r.organization ?? "" },
  { table: "reportages", select: "id,title,location", group: "Reportage", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.location ?? "" },
  { table: "interviews", select: "id,title,person", group: "Interview", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.person ?? "" },
  { table: "investigations", select: "id,title,summary", group: "Enquête", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.summary ?? "" },
  { table: "press_review", select: "id,title,source", group: "Revue de presse", tab: "studio", label: (r: any) => r.title, detail: (r: any) => r.source ?? "" },
] as const;

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
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
  return matched ? Math.round((matched / words.length) * 65) : 0;
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
  const executePrivateAi = useServerFn(runPrivateAngelOsIaChat);
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["angel", "search-index"], queryFn: loadIndex, enabled: open, staleTime: 60_000 });

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
  const sentenceMode = looksLikeNaturalLanguage(trimmed);
  const noUsefulResult = trimmed.length >= 2 && pageResults.length === 0 && contentResults.length === 0;
  const canAskAi = trimmed.length >= 2;

  const navigateThroughCore = (target: Pick<AngelNavigationTarget, "tab" | "label" | "anchor">) => {
    void emitAngelOSEvent("angel-os-ia:navigation", { tab: target.tab, label: target.label, anchor: target.anchor ?? null, query: trimmed.slice(0, 300) }).catch(() => {});
    if (target.anchor) sessionStorage.setItem("angel-os-navigation-anchor", target.anchor);
    else sessionStorage.removeItem("angel-os-navigation-anchor");
    onNavigate(target.tab);
    onClose();
    if (target.anchor) window.setTimeout(() => {
      const element = document.getElementById(`angel-section-${target.anchor}`) ?? document.querySelector(`[data-angel-section="${target.anchor}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };
  const navigateTab = (tab: string, label: string) => navigateThroughCore({ tab, label });

  const ai = useMutation({
    mutationFn: async (value: string) => {
      const navigation = resolveNavigationIntent(value);
      if (navigation) return { navigation } as const;
      const result = await executePrivateAi({ data: { command: value } });
      return { result } as const;
    },
    onSuccess: (payload) => {
      const navigationPayload = "navigation" in payload ? payload.navigation : undefined;
      if (navigationPayload) {
        navigateThroughCore(navigationPayload.target);
        toast.success(`Ouverture : ${navigationPayload.target.label}`);
        return;
      }
      void emitAngelOSEvent("angel-os-ia:universal-search:conversation-started", { query: trimmed.slice(0, 500), source: "openai" }).catch(() => {});
      void queryClient.invalidateQueries({ queryKey: ["angel-ai-messages"] });
      void queryClient.invalidateQueries({ queryKey: ["angel"] });
      toast.success("Conversation Angel OS IA lancée dans Angel OS IA");
      onNavigate("angel-ai");
      onClose();
    },
    onError: (error: Error) => toast.error("Angel OS IA indisponible", { description: error.message, duration: 12000 }),
  });

  const submit = () => {
    if (!canAskAi) return;
    const navigation = resolveNavigationIntent(trimmed);
    if (navigation) { navigateThroughCore(navigation.target); return; }
    if (pageResults[0] && !sentenceMode && pageResults[0].score >= 82) { navigateThroughCore(pageResults[0].target); return; }
    ai.mutate(trimmed);
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex h-[100dvh] items-start justify-center overflow-hidden bg-black/75 px-2 pb-2 pt-[calc(env(safe-area-inset-top)+0.35rem)] backdrop-blur-md sm:px-4 sm:pt-[min(8vh,4rem)]"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche universelle Angel OS IA"
      onClick={onClose}
    >
      <div className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-.7rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-red-500/15 bg-[#090b0d]/98 text-white shadow-[0_24px_90px_rgba(0,0,0,.75)] sm:max-h-[84vh] sm:rounded-[1.75rem]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#090b0d]/98 p-2.5 sm:p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300"><Search className="h-4 w-4" /></span>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
            placeholder="Rechercher ou demander à Angel OS IA…"
            className="h-12 min-w-0 border-0 bg-transparent px-1 text-base text-white shadow-none placeholder:text-white/30 focus-visible:ring-0"
            aria-label="Recherche universelle Angel OS IA"
          />
          <Button variant="ghost" size="sm" className="min-h-11 min-w-11 rounded-xl text-white/55 hover:bg-white/[.05] hover:text-white" aria-label="Fermer" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-3">
          {isLoading ? <p className="flex items-center gap-2 p-3 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Indexation du site…</p> : null}

          {pageResults.length > 0 ? <section className="mb-4">
            <p className="mb-2 px-2 font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-white/35">Pages, sections et outils</p>
            <ul className="space-y-1">
              {pageResults.map(({ target }) => <li key={`${target.tab}-${target.label}`}>
                <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-red-500/15 hover:bg-red-500/[.04]" onClick={() => navigateThroughCore(target)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-red-300"><Sparkles className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block font-medium text-white">{target.label}</span><span className="block truncate text-xs text-white/40">{target.group} · {target.detail}</span></span>
                </button>
              </li>)}
            </ul>
          </section> : null}

          {contentResults.length > 0 ? <section className="mb-4">
            <p className="mb-2 px-2 font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-white/35">Contenus du site</p>
            <ul className="space-y-1">
              {contentResults.map((hit) => <li key={hit.id}>
                <button type="button" className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-red-500/15 hover:bg-red-500/[.04]" onClick={() => navigateTab(hit.tab, hit.label)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.035] text-white/55"><FileText className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate font-medium text-white">{hit.label}</span><span className="block truncate text-xs text-white/40">{hit.group}{hit.detail ? ` · ${hit.detail}` : ""}</span></span>
                </button>
              </li>)}
            </ul>
          </section> : null}

          {canAskAi ? <button
            type="button"
            disabled={ai.isPending}
            onClick={submit}
            className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] disabled:opacity-60 ${noUsefulResult || sentenceMode ? "border-red-500/25 bg-red-500/10 text-red-50" : "border-white/10 bg-white/[.025] text-white"}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">{ai.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bot className="h-5 w-5" />}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Demander à Angel OS IA</span><span className="mt-0.5 block truncate text-xs text-white/45">« {trimmed} »</span></span>
            <Send className="h-4 w-4 shrink-0 text-red-300" />
          </button> : null}

          {!trimmed && !isLoading ? <p className="px-3 py-2 text-sm leading-relaxed text-white/45">Recherche une page, une candidature, un article ou pose directement une question. Dans l’espace privé, aucune IA locale ne remplace Angel OS IA.</p> : null}
        </div>
      </div>
    </div>
  );
}
