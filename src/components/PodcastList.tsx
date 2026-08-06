import { useQuery } from "@tanstack/react-query";
import { Check, Link2, Mic } from "lucide-react";
import { useState } from "react";
import { fetchPodcasts, formatDuration, type AudioItem } from "@/lib/audio";
import { formatDate } from "@/lib/articles";
import { Button } from "@/components/ui/button";

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch {
          /* action annulée */
        }
      }}
    >
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Link2 className="mr-2 h-4 w-4" />
      )}
      {copied ? "Lien copié" : "Partager"}
    </Button>
  );
}

export function PodcastList() {
  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ["podcasts"],
    queryFn: fetchPodcasts,
  });

  return (
    <section aria-labelledby="podcasts-title" className="mt-14">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mic className="h-5 w-5" aria-hidden />
        </span>
        <h2
          id="podcasts-title"
          className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl"
        >
          Mes podcasts
        </h2>
      </div>

      {isLoading && (
        <p className="mt-5 text-sm text-muted-foreground">Chargement…</p>
      )}

      {!isLoading && podcasts.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          Aucun podcast publié pour le moment.
        </p>
      )}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {podcasts.map((p: AudioItem) => (
          <article
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
          >
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.title}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg font-bold leading-snug text-foreground">
                {p.title}
              </h3>
              {p.description && (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {[
                  formatDate(p.published_at ?? p.created_at),
                  p.duration_seconds ? formatDuration(p.duration_seconds) : null,
                  p.author,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <audio
                src={p.audio_url}
                controls
                preload="none"
                className="mt-4 w-full"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <ShareLink url={p.audio_url} />
                <a
                  href={p.audio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary underline underline-offset-4"
                >
                  Lien direct
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
