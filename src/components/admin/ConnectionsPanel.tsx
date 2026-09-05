import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  CircleAlert,
  CircleSlash,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { AdminCard } from "./AdminShell";
import { listConnectors, testConnector, type ConnectorCard } from "@/lib/connectors.functions";
import { FLAMME_GOOGLE_ACCOUNT } from "@/lib/google-workspace.functions";

const MODULE_LINKS: Record<string, { href: string; label: string }> = {
  gmail: { href: "/admin?tab=boite-mail", label: "Ouvrir la boîte mail" },
  calendar: { href: "/admin?tab=agenda", label: "Ouvrir l’agenda" },
  drive: { href: "/admin?tab=fichiers", label: "Ouvrir les fichiers" },
  database: { href: "/admin?tab=studio", label: "Ouvrir le Studio" },
  tmdb: { href: "/admin-movix", label: "Ouvrir Films & séries" },
};

const STATE_LABEL: Record<ConnectorCard["state"], string> = {
  connected: "Connecté",
  configured: "À vérifier",
  missing: "Non relié",
  error: "Erreur",
};

const STATE_TONE: Record<ConnectorCard["state"], string> = {
  connected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  configured: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  missing: "bg-muted text-muted-foreground",
  error: "bg-red-500/10 text-red-600 dark:text-red-300",
};

function StateIcon({ state }: { state: ConnectorCard["state"] }) {
  if (state === "connected") return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />;
  if (state === "error") return <TriangleAlert className="h-5 w-5 shrink-0 text-red-500" />;
  if (state === "missing") return <CircleSlash className="h-5 w-5 shrink-0 text-muted-foreground" />;
  return <ShieldCheck className="h-5 w-5 shrink-0 text-amber-500" />;
}

function humanError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/<!doctype|<html|<head|<body/i.test(raw)) return "Le service n’a pas répondu correctement. Réessaie dans quelques instants.";
  return raw.replace(/\s+/g, " ").slice(0, 240) || "Opération impossible.";
}

function formatCheckedAt(value: string | null) {
  if (!value) return "Jamais testé";
  return `Vérifié le ${new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function ConnectionsPanel() {
  const loadConnectors = useServerFn(listConnectors);
  const runTest = useServerFn(testConnector);
  const [cards, setCards] = useState<ConnectorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ok" | "todo">("all");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setCards(await loadConnectors());
    } catch (e) {
      setError(humanError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const testOne = async (key: string) => {
    setBusy(key);
    setError(null);
    try {
      const updated = await runTest({ data: { key } });
      setCards((current) => current.map((card) => (card.key === key ? updated : card)));
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const visibleCards = cards.filter((card) =>
    filter === "all" ? true : filter === "ok" ? card.state === "connected" : card.state !== "connected",
  );
  const categories = [...new Set(visibleCards.map((card) => card.category))];
  const connectedCount = cards.filter((card) => card.state === "connected").length;
  const ratio = cards.length ? Math.round((connectedCount / cards.length) * 100) : 0;
  const calendar = cards.find((card) => card.key === "calendar");

  return (
    <div className="space-y-4">
      <AdminCard title="Connexions" description="Flamme OS n’affiche un service comme connecté qu’après un test réel côté serveur.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Compte Google attendu</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{FLAMME_GOOGLE_ACCOUNT}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              L’agenda principal de ce compte est la référence de Flamme OS. Si le connecteur Lovable n’est pas relié à ce compte, Agenda restera vide.
            </p>
          </div>
          <button type="button" disabled={loading || Boolean(busy)} onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:opacity-40">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Tout vérifier
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{loading ? "Vérification en cours…" : `${connectedCount}/${cards.length} services réellement connectés`}</span>
          {calendar ? <span>· Google Calendar : <strong className="text-foreground">{STATE_LABEL[calendar.state]}</strong></span> : null}
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${ratio}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {([["all", "Tous"], ["ok", "Connectés"], ["todo", "À relier"]] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition ${filter === value ? "border-transparent bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {error ? <div className="mt-3 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-700 dark:text-red-100"><CircleAlert className="h-4 w-4 shrink-0" /> {error}</div> : null}
      </AdminCard>

      {categories.map((category) => (
        <AdminCard key={category} title={category} description="">
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleCards.filter((card) => card.category === category).map((card) => {
              const link = MODULE_LINKS[card.key];
              return (
                <section key={card.key} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{card.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_TONE[card.state]}`}>{STATE_LABEL[card.state]}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.detail}</p>
                    </div>
                    <StateIcon state={card.state} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {card.features.map((feature) => <span key={feature} className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">{feature}</span>)}
                  </div>

                  <dl className="mt-3 space-y-1 text-[11px] leading-5 text-muted-foreground">
                    <div className="flex gap-1.5"><dt className="font-medium text-foreground">Accès :</dt><dd>{card.via}</dd></div>
                    <div className="flex gap-1.5"><dt className="font-medium text-foreground">Permissions :</dt><dd>{card.permissions.join(" · ")}</dd></div>
                    <p>{formatCheckedAt(card.checkedAt)}</p>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={Boolean(busy) || loading} onClick={() => void testOne(card.key)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground disabled:opacity-40">
                      {busy === card.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tester
                    </button>
                    {link && card.state === "connected" ? <a href={link.href} className="inline-flex min-h-10 items-center rounded-xl bg-foreground px-3.5 text-sm font-semibold text-background">{link.label}</a> : null}
                  </div>

                  {card.needsManualSetup ? <p className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] leading-5 text-muted-foreground">Ce connecteur doit être relié dans Lovable avant de pouvoir alimenter Flamme OS.</p> : null}
                </section>
              );
            })}
          </div>
        </AdminCard>
      ))}

      <AdminCard title="Sécurité des connexions" description="Les jetons Google ne sont jamais exposés dans le navigateur.">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-xs leading-5 text-muted-foreground">Les accès Google passent par la passerelle de connecteurs Lovable. Flamme OS ne stocke pas directement les jetons OAuth et n’affiche pas un service comme actif tant que le test serveur échoue.</p>
        </div>
      </AdminCard>
    </div>
  );
}
