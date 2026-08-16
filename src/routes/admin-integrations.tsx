import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, Loader2, RefreshCw, Unplug, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  disconnectOAuthConnection,
  integrationReadiness,
  startOAuthConnection,
  type IntegrationReadiness,
} from "@/lib/system.functions";

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

function stateLabel(item: IntegrationReadiness) {
  if (item.connection === "connected") return "Connecté";
  if (item.connection === "reconnect_required") return "Reconnexion requise";
  return item.status === "ready" ? "Prêt" : "À configurer";
}

function stateTone(item: IntegrationReadiness) {
  if (item.connection === "connected") return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
  if (item.connection === "reconnect_required") return "text-amber-200 bg-amber-500/10 border-amber-500/20";
  if (item.status === "ready") return "text-sky-200 bg-sky-500/10 border-sky-500/20";
  return "text-white/55 bg-white/[.04] border-white/10";
}

function AdminIntegrationsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const getReadiness = useServerFn(integrationReadiness);
  const connect = useServerFn(startOAuthConnection);
  const disconnect = useServerFn(disconnectOAuthConnection);

  const [items, setItems] = useState<IntegrationReadiness[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  const refresh = async () => {
    setError(null);
    try {
      setItems(await getReadiness());
    } catch (e) {
      setError(humanError(e));
    }
  };

  useEffect(() => {
    if (session && isAdmin) void refresh();
  }, [session, isAdmin]);

  const google = useMemo(() => items.find((item) => item.key === "google"), [items]);
  const rest = useMemo(() => items.filter((item) => item.key !== "google"), [items]);

  const runConnect = async (item: IntegrationReadiness) => {
    if (!item.provider) return;
    setBusy(item.key);
    setError(null);
    try {
      const result = await connect({ data: { provider: item.provider } });
      window.location.assign(result.url);
    } catch (e) {
      setError(humanError(e));
      setBusy(null);
    }
  };

  const runDisconnect = async (item: IntegrationReadiness) => {
    if (!item.provider) return;
    setBusy(item.key);
    setError(null);
    try {
      await disconnect({ data: { provider: item.provider } });
      await refresh();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const testAll = async () => {
    setBusy("health");
    setHealth(null);
    setError(null);
    try {
      const response = await fetch("/api/angel-os/health", { headers: { accept: "application/json" } });
      const text = await response.text();
      if (!response.ok || /<!doctype|<html/i.test(text)) throw new Error("Le service n’a pas répondu correctement.");
      const data = JSON.parse(text) as { healthy?: boolean };
      setHealth(data.healthy ? "Services principaux opérationnels." : "Certains services demandent une vérification.");
      await refresh();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading || !session || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-7 text-white sm:px-7">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.18em] text-red-300">Angel OS · Paramètres</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Connexions & API</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Un seul endroit pour voir ce qui est prêt, connecter les comptes et relancer un test.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void testAll()} disabled={busy === "health"} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
              {busy === "health" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Tester tout
            </button>
            <Link to="/admin" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70">Retour</Link>
          </div>
        </header>

        {error ? <div className="mt-5 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
        {health ? <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{health}</div> : null}

        {google ? (
          <section className="mt-7 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[.14em] text-white/35">Compte principal</p>
                <h2 className="mt-1 text-xl font-semibold">Google Workspace</h2>
                <p className="mt-2 text-sm text-white/45">Gmail · Agenda · Drive</p>
                {google.accountLabel ? <p className="mt-2 text-sm text-white/70">{google.accountLabel}</p> : null}
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${stateTone(google)}`}>{stateLabel(google)}</span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Gmail", "Agenda", "Drive"].map((label) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/65">{label}</div>)}
            </div>

            {google.note ? <p className="mt-4 text-xs leading-5 text-white/35">{google.note}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button disabled={busy === google.key || google.status !== "ready"} onClick={() => void runConnect(google)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
                {busy === google.key ? "Ouverture…" : google.connection === "connected" ? "Reconnecter Google" : "Se connecter avec Google"}
              </button>
              {google.connection === "connected" || google.connection === "reconnect_required" ? (
                <button disabled={busy === google.key} onClick={() => void runDisconnect(google)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/70 disabled:opacity-40"><Unplug className="h-4 w-4" />Déconnecter</button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {rest.map((item) => (
            <article key={item.key} className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-white/35">{item.category}</p>
                  <h3 className="mt-1 font-semibold">{item.name}</h3>
                </div>
                {item.status === "ready" ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Wifi className="h-5 w-5 text-white/30" />}
              </div>
              <p className="mt-3 text-sm leading-5 text-white/45">{item.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${stateTone(item)}`}>{stateLabel(item)}</span>
                {item.provider && item.status === "ready" ? (
                  <button onClick={() => void runConnect(item)} disabled={busy === item.key} className="text-xs font-medium text-white/70 underline underline-offset-4 disabled:opacity-40">{item.connection === "connected" ? "Reconnecter" : "Connecter"}</button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
