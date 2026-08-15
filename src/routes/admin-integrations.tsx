import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  clearTmdbCredentials,
  getTmdbCredentialStatus,
  saveTmdbCredentials,
  testActiveTmdbCredential,
} from "@/lib/tmdb-credentials.functions";

export const Route = createFileRoute("/admin-integrations")({
  head: () => ({
    meta: [
      { title: "Connexions API | Angel OS" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: AdminIntegrationsPage,
});

type Status = Awaited<ReturnType<typeof getTmdbCredentialStatus>>;

function AdminIntegrationsPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const getStatus = useServerFn(getTmdbCredentialStatus);
  const save = useServerFn(saveTmdbCredentials);
  const clear = useServerFn(clearTmdbCredentials);
  const test = useServerFn(testActiveTmdbCredential);
  const [apiKey, setApiKey] = useState("");
  const [readToken, setReadToken] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!session || !isAdmin)) void navigate({ to: "/auth" });
  }, [isAdmin, loading, navigate, session]);

  const refresh = async () => {
    try { setStatus(await getStatus()); } catch { setStatus(null); }
  };

  useEffect(() => { if (session && isAdmin) void refresh(); }, [session, isAdmin]);

  const handleSave = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await save({ data: { apiKey, readToken } });
      setMessage(result.message);
      setApiKey(""); setReadToken("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d’enregistrer les identifiants TMDB.");
    } finally { setBusy(false); }
  };

  const handleTest = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await test();
      if (result.ok) setMessage(`Connexion TMDB opérationnelle · source : ${result.source}`);
      else setError(result.error || "Connexion TMDB indisponible.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test TMDB impossible.");
    } finally { setBusy(false); }
  };

  const handleClear = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await clear();
      setMessage("Identifiants TMDB enregistrés depuis ce navigateur supprimés.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally { setBusy(false); }
  };

  if (loading || !session || !isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#050607] text-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  const configured = Boolean(status?.activeSource);

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-8 text-white sm:px-7">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.18em] text-red-300">Angel OS · Connexions</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">API Films & séries</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Configure TMDB directement depuis l’espace administrateur. Les valeurs saisies ne sont jamais affichées à nouveau et ne sont pas envoyées dans GitHub.</p>
          </div>
          <Link to="/admin-movix" className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[.08]">Films & séries</Link>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${configured ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}><Wifi className="h-5 w-5" /></div>
              <div><h2 className="font-semibold">État TMDB</h2><p className="text-xs text-white/45">{configured ? `Configuré · ${status?.activeSource}` : "Aucun identifiant actif détecté"}</p></div>
            </div>
            {configured ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : null}
          </div>
          <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
            <span>Serveur · Read token : {status?.envReadToken ? "présent" : "absent"}</span>
            <span>Serveur · API key : {status?.envApiKey ? "présente" : "absente"}</span>
            <span>Site · Read token : {status?.cookieReadToken ? "présent" : "absent"}</span>
            <span>Site · API key : {status?.cookieApiKey ? "présente" : "absente"}</span>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-red-300" /><h2 className="font-semibold">Identifiants TMDB</h2></div>
          <p className="mt-2 text-sm leading-6 text-white/45">Le jeton d’accès en lecture est prioritaire. La clé API v3 peut être ajoutée en secours. Chaque valeur est testée auprès de TMDB avant d’être conservée.</p>

          <label className="mt-5 block text-xs font-medium text-white/65">Jeton d’accès en lecture de l’API</label>
          <textarea value={readToken} onChange={(e) => setReadToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="eyJhbGciOiJIUzI1NiJ9…" className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/35 px-3 py-3 font-mono text-xs text-white outline-none placeholder:text-white/20 focus:border-red-300/50" />

          <label className="mt-4 block text-xs font-medium text-white/65">Clé API v3</label>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" placeholder="••••••••••••••••••••••••••••••••" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-red-300/50" />

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" disabled={busy || (!apiKey.trim() && !readToken.trim())} onClick={handleSave} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? "Vérification…" : "Tester et enregistrer"}</button>
            <button type="button" disabled={busy} onClick={handleTest} className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm text-white/75 disabled:opacity-40">Tester la connexion active</button>
            <button type="button" disabled={busy || (!status?.cookieApiKey && !status?.cookieReadToken)} onClick={handleClear} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-200 disabled:opacity-40"><Trash2 className="h-4 w-4" />Supprimer la configuration du site</button>
          </div>

          {message ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">{message}</div> : null}
          {error ? <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-sm text-red-200">{error}</div> : null}
        </section>

        <aside className="mt-5 flex gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm leading-6 text-white/45">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white/55" />
          <p>Les identifiants configurés ici sont stockés dans des cookies HttpOnly, Secure et SameSite Strict pour ce navigateur. Les variables serveur Vercel restent prioritaires : cette page sert de configuration de secours directe depuis Angel OS.</p>
        </aside>
      </div>
    </main>
  );
}
