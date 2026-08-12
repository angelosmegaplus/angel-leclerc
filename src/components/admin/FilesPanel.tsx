import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Image as ImageIcon, Loader2, Music, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminCard } from "./AdminShell";

type Item = { id: string; name: string; url: string; origin: string; type: string };

const anyDb = supabase as unknown as { from: (t: string) => any };

function kindOf(url: string) {
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url)) return "image";
  if (/\.(mp3|wav|ogg|webm)(\?|$)/i.test(url)) return "audio";
  return "fichier";
}

async function loadFiles(): Promise<Item[]> {
  const [articles, reportages, interviews] = await Promise.all([
    supabase.from("articles").select("id,title,cover_url,attachments"),
    anyDb.from("reportages").select("id,title,media_url").not("media_url", "is", null),
    anyDb.from("interviews").select("id,title,media_url").not("media_url", "is", null),
  ]);

  const out: Item[] = [];
  for (const a of articles.data ?? []) {
    if (a.cover_url)
      out.push({
        id: `cov-${a.id}`,
        name: `Couverture — ${a.title}`,
        url: a.cover_url,
        origin: "Article",
        type: "image",
      });
    const atts = Array.isArray(a.attachments) ? a.attachments : [];
    atts.forEach((raw, i) => {
      const att = raw as { name?: string; url?: string };
      if (!att?.url) return;
      out.push({
        id: `att-${a.id}-${i}`,
        name: att.name ?? "Pièce jointe",
        url: att.url,
        origin: `Article — ${a.title}`,
        type: kindOf(att.url),
      });
    });
  }
  for (const r of (reportages.data ?? []) as any[])
    out.push({
      id: `rep-${r.id}`,
      name: r.title,
      url: r.media_url,
      origin: "Reportage",
      type: kindOf(r.media_url),
    });
  for (const i of (interviews.data ?? []) as any[])
    out.push({
      id: `itw-${i.id}`,
      name: i.title,
      url: i.media_url,
      origin: "Interview",
      type: kindOf(i.media_url),
    });
  return out;
}

export function FilesPanel() {
  const [query, setQuery] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["angel", "files"],
    queryFn: loadFiles,
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.origin.toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <div className="space-y-4">
      <AdminCard
        title="Fichiers"
        description="Tous les médias déjà stockés sur le site : couvertures, pièces jointes et enregistrements du studio."
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un fichier…"
            className="h-11 pl-9"
            aria-label="Rechercher un fichier"
          />
        </div>
      </AdminCard>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aucun fichier trouvé.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((f) => {
            const Icon =
              f.type === "image" ? ImageIcon : f.type === "audio" ? Music : FileText;
            return (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{f.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{f.origin}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="min-h-10">
                      <a href={f.url} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-10"
                      onClick={() => {
                        navigator.clipboard?.writeText(f.url);
                        toast.success("Lien copié.");
                      }}
                    >
                      Copier le lien
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}