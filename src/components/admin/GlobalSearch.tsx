import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const anyDb = supabase as unknown as { from: (t: string) => any };

type Hit = { id: string; label: string; detail: string; group: string; tab: string };

const SOURCES: {
  table: string;
  select: string;
  group: string;
  tab: string;
  label: (r: any) => string;
  detail: (r: any) => string;
}[] = [
  {
    table: "articles",
    select: "id,title,category,slug",
    group: "Articles",
    tab: "articles",
    label: (r) => r.title,
    detail: (r) => r.category ?? "",
  },
  {
    table: "projects",
    select: "id,title,client_name",
    group: "Projets",
    tab: "projets",
    label: (r) => r.title,
    detail: (r) => r.client_name ?? "",
  },
  {
    table: "applications",
    select: "id,company,position,city",
    group: "Candidatures",
    tab: "candidatures",
    label: (r) => r.company,
    detail: (r) => [r.position, r.city].filter(Boolean).join(" · "),
  },
  {
    table: "contacts_sources",
    select: "id,last_name,first_name,organization",
    group: "Contacts",
    tab: "studio",
    label: (r) => [r.first_name, r.last_name].filter(Boolean).join(" "),
    detail: (r) => r.organization ?? "",
  },
  {
    table: "reportages",
    select: "id,title,location",
    group: "Reportages",
    tab: "studio",
    label: (r) => r.title,
    detail: (r) => r.location ?? "",
  },
  {
    table: "interviews",
    select: "id,title,person",
    group: "Interviews",
    tab: "studio",
    label: (r) => r.title,
    detail: (r) => r.person ?? "",
  },
  {
    table: "investigations",
    select: "id,title,summary",
    group: "Enquêtes",
    tab: "studio",
    label: (r) => r.title,
    detail: (r) => r.summary ?? "",
  },
  {
    table: "press_review",
    select: "id,title,source",
    group: "Revue de presse",
    tab: "studio",
    label: (r) => r.title,
    detail: (r) => r.source ?? "",
  },
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

export function GlobalSearch({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}) {
  const [query, setQuery] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["angel", "search-index"],
    queryFn: loadIndex,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return data
      .filter((h) => h.label.toLowerCase().includes(q) || h.detail.toLowerCase().includes(q))
      .slice(0, 30);
  }, [data, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 p-4 sm:p-10"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans tout Angel OS…"
            className="h-11 border-0 shadow-none focus-visible:ring-0"
            aria-label="Rechercher dans Angel OS"
          />
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11"
            aria-label="Fermer la recherche"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading && (
            <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Indexation…
            </p>
          )}
          {!isLoading && query.trim().length < 2 && (
            <p className="p-4 text-sm text-muted-foreground">Saisissez au moins deux caractères.</p>
          )}
          {!isLoading && query.trim().length >= 2 && hits.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucun résultat.</p>
          )}
          <ul>
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="flex min-h-12 w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-muted"
                  onClick={() => {
                    onNavigate(h.tab);
                    onClose();
                  }}
                >
                  <span className="font-medium text-foreground">{h.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.group}
                    {h.detail ? ` · ${h.detail}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
