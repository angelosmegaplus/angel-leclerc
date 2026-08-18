import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, CircleSlash, Loader2, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listConnectors, testConnector, type ConnectorCard } from "@/lib/connectors.functions";

export const Route = createFileRoute("/admin-integrations")({
  head: () => ({
    meta: [
      { title: "Connexions & API | Angel OS" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: AdminIntegrationsPage,
});

function humanError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/<!doctype|<html|<head|<body/i.test(raw)) return "Le service n’a pas répondu correctement. Réessayez.";
  return raw.replace(/\s+/g, " ").slice(0, 220) || "Opération impossible.";
}

const STATE_LABEL: Record<ConnectorCard["state"], string> = {
  connected: "Connecté",
  configured: "Configuré",
  missing: "Configuration manquante",
  error: "Erreur",
};

const STATE_TONE: Record<ConnectorCard["state"], string> = {
  connected: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  configured: "text-sky-200 bg-sky-500/10 border-sky-500/20",
  missing: "text-white/55 bg-white/[.04] border-white/10",
  error: "text-red-200 bg-red-500/10 border-red-500/20",
};

function StateIcon({ state }: { state: ConnectorCard["state"] }) {
  if (state === "connected") return <CheckCircle2 className="h-5 w-5 text-emerald-300" />;
  if (state === "error") return <TriangleAlert className="h-5 w-5 text-red-300" />;
  if (state === "missing") return <CircleSlash className="h-5 w-5 text-white/30" />;
  return <ShieldCheck className="h-5 w-5 text-sky-300" />;
}

function AdminIntegrationsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const loadConnectors = useServerFn(listConnectors);
  const runTest = useServerFn(testConnector);

  const [cards, setCards] = useState<ConnectorCard[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  const refresh = async () => {
    setBusy("all");
    setError(null);
    try {
      setCards(await loadConnectors());
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (session && isAdmin) void refresh();
  }, [session, isAdmin]);

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

  if (loading || !session || !isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050607] text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-7 text-white sm:px-7">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.18em] text-red-300">Angel OS · Paramètres</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Connexions & API</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Chaque service listé alimente une fonction réelle. L’état affiché vient d’un appel réel au service.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void refresh()}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tout tester
            </button>
            <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70">
              Retour
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mt-5 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <article key={card.key} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/35">{card.category}</p>
                  <h2 className="mt-1 font-semibold">{card.name}</h2>
                </div>
                <StateIcon state={card.state} />
              </div>

              <p className="mt-3 text-sm leading-5 text-white/45">{card.detail}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.features.map((feature) => (
                  <span key={feature} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-white/55">
                    {feature}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-[11px] leading-5 text-white/35">
                {card.via} · {card.permissions.join(" · ")}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATE_TONE[card.state]}`}>
                  {STATE_LABEL[card.state]}
                </span>
                <button
                  onClick={() => void testOne(card.key)}
                  disabled={Boolean(busy)}
                  className="text-xs font-medium text-white/70 underline underline-offset-4 disabled:opacity-40"
                >
                  {busy === card.key ? "Test en cours…" : "Tester"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
